import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Subject,
  DaySchedule,
  DailyTask,
  LectureRecord,
  XpTransaction,
  UserSettings,
  Achievement,
} from '../types';
import {
  db,
  initializeDatabase,
  generateTasksForDate,
  persistDaySchedule,
} from '../db/db';
import { getTodayKey, getWeekDaysForDate } from '../utils/dates';
import { calculateLevel, calculateStreak } from '../utils/gamification';
import {
  playTaskCheckSound,
  playBacklogClearedSound,
  playDayConqueredSound,
} from '../utils/audio';

export interface StudyDataState {
  isLoaded: boolean;
  subjects: Subject[];
  weeklySchedule: DaySchedule[];
  todayTasks: DailyTask[];
  overdueTasks: DailyTask[];
  allTasks: DailyTask[];
  lectureRecords: LectureRecord[];
  xpTransactions: XpTransaction[];
  userSettings: UserSettings;
  achievements: Achievement[];
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  isTodayLocked: boolean;
  todayCompletionRate: number;
  todayCompletedCount: number;
  todayTotalCount: number;
}

export function useStudyData() {
  const [data, setData] = useState<StudyDataState>({
    isLoaded: false,
    subjects: [],
    weeklySchedule: [],
    todayTasks: [],
    overdueTasks: [],
    allTasks: [],
    lectureRecords: [],
    xpTransactions: [],
    userSettings: {
      id: 'current',
      userName: 'Scholar',
      backlogMode: 'strict',
      soundEnabled: true,
      soundVolume: 0.5,
      theme: 'dark',
      dailyGoalHours: 4,
    },
    achievements: [],
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    isTodayLocked: false,
    todayCompletionRate: 0,
    todayCompletedCount: 0,
    todayTotalCount: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      // Ensure all days of the current week have their scheduled lecture and DPP classes generated
      const currentWeek = getWeekDaysForDate(new Date());
      for (const w of currentWeek) {
        await generateTasksForDate(w.dateKey);
      }

      const [
        subjects,
        weeklySchedule,
        allTasks,
        lectureRecords,
        xpTransactions,
        settings,
        achievements,
      ] = await Promise.all([
        db.subjects.orderBy('order').toArray(),
        db.weeklySchedule.orderBy('dayOfWeek').toArray(),
        db.dailyTasks.toArray(),
        db.lectureRecords.toArray(),
        db.xpTransactions.toArray(),
        db.userSettings.get('current'),
        db.achievements.toArray(),
      ]);

      const userSettings = settings || {
        id: 'current',
        userName: 'Scholar',
        backlogMode: 'strict',
        soundEnabled: true,
        soundVolume: 0.5,
        theme: 'dark',
        dailyGoalHours: 4,
      };

      // Today's tasks (specifically for todayKey)
      const todayTasks = allTasks
        .filter((t) => t.dateKey === todayKey)
        .sort((a, b) => a.order - b.order);

      // Overdue tasks: any uncompleted mandatory task scheduled before today!
      const overdueTasks = allTasks
        .filter((t) => !t.done && t.isMandatory && t.dateKey < todayKey)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.order - b.order);

      // Strict lock logic
      const isTodayLocked = userSettings.backlogMode === 'strict' && overdueTasks.length > 0;

      // XP & streak calculation
      const totalXp = xpTransactions.reduce((acc, tx) => acc + tx.xp, 0);
      const { currentStreak, longestStreak } = calculateStreak(allTasks);

      // Today completion counts
      const todayTotalCount = todayTasks.length;
      const todayCompletedCount = todayTasks.filter((t) => t.done).length;
      const todayCompletionRate =
        todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

      setData({
        isLoaded: true,
        subjects,
        weeklySchedule,
        todayTasks,
        overdueTasks,
        allTasks,
        lectureRecords,
        xpTransactions,
        userSettings,
        achievements,
        totalXp,
        currentStreak,
        longestStreak,
        isTodayLocked,
        todayCompletionRate,
        todayCompletedCount,
        todayTotalCount,
      });
    } catch (err) {
      console.error('Failed to load study data:', err);
    }
  }, []);

  // Initialize DB on mount and listen to date change/visibility change
  useEffect(() => {
    let mounted = true;
    (async () => {
      await initializeDatabase();
      if (mounted) {
        await refreshData();
      }
    })();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    // Periodically check in case midnight crosses while app is open
    const interval = setInterval(() => {
      refreshData();
    }, 60000);

    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [refreshData]);

  // Toggle task completion
  const toggleTask = useCallback(
    async (taskId: string): Promise<{ success: boolean; message?: string }> => {
      const task = await db.dailyTasks.get(taskId);
      if (!task) return { success: false, message: 'Task not found' };

      const todayKey = getTodayKey();
      const isTodayOrFutureTask = task.dateKey >= todayKey;

      // In Strict Mode, if there are overdue tasks, prevent completing today's tasks
      if (isTodayOrFutureTask && data.isTodayLocked && !task.done) {
        showToast(`Locked: Complete ${data.overdueTasks.length} overdue backlog task(s) first`);
        return {
          success: false,
          message: `Locked: Complete ${data.overdueTasks.length} overdue backlog task(s) first`,
        };
      }

      const isMarkingDone = !task.done;
      const now = new Date();
      const completedAt = isMarkingDone ? now.toISOString() : undefined;
      const completedOnDateKey = isMarkingDone ? todayKey : undefined;

      await db.transaction(
        'rw',
        [db.dailyTasks, db.xpTransactions, db.lectureRecords, db.achievements],
        async () => {
          // 1. Update the task
          await db.dailyTasks.update(taskId, {
            done: isMarkingDone,
            completedAt,
            completedOnDateKey,
          });

          // 2. Handle XP transaction (deterministic 20 XP per task)
          const existingTx = await db.xpTransactions.get(taskId);
          if (isMarkingDone) {
            if (!existingTx) {
              await db.xpTransactions.put({
                id: taskId,
                taskId,
                dateKey: todayKey,
                xp: 20,
                reason: `Completed: ${task.title}`,
                timestamp: now.toISOString(),
              });
            }
          } else {
            // Unchecking rolls back the XP transaction
            if (existingTx) {
              await db.xpTransactions.delete(taskId);
            }
          }

          // 3. If it's a lecture task, maintain lifetime lecture record
          if (task.type === 'lecture') {
            const existingRecord = await db.lectureRecords
              .where('id')
              .equals(`rec-${task.id}`)
              .first();

            if (isMarkingDone) {
              await db.lectureRecords.put({
                id: `rec-${task.id}`,
                subjectId: task.subjectId,
                lectureNumber: task.classSlot || 1,
                title: task.title,
                scheduledDateKey: task.dateKey,
                completedDateKey: todayKey,
                done: true,
                completedAt: now.toISOString(),
                notes: task.notes,
              });
            } else if (existingRecord) {
              await db.lectureRecords.delete(`rec-${task.id}`);
            }
          }

          // 4. Update achievements progress
          if (isMarkingDone) {
            const firstStep = await db.achievements.get('first-step');
            if (firstStep && !firstStep.unlockedAt) {
              await db.achievements.update('first-step', {
                currentProgress: 1,
                unlockedAt: now.toISOString(),
              });
            }

            // If it was an overdue task, update backlog hero
            if (task.dateKey < todayKey) {
              const backlogHero = await db.achievements.get('backlog-hero');
              if (backlogHero) {
                const newProgress = Math.min(backlogHero.maxProgress, backlogHero.currentProgress + 1);
                await db.achievements.update('backlog-hero', {
                  currentProgress: newProgress,
                  unlockedAt: newProgress >= backlogHero.maxProgress ? now.toISOString() : undefined,
                });
              }
            }

            // If it's a DPP, update DPP master
            if (task.type === 'dpp') {
              const dppMaster = await db.achievements.get('dpp-master-25');
              if (dppMaster) {
                const newProgress = Math.min(dppMaster.maxProgress, dppMaster.currentProgress + 1);
                await db.achievements.update('dpp-master-25', {
                  currentProgress: newProgress,
                  unlockedAt: newProgress >= dppMaster.maxProgress ? now.toISOString() : undefined,
                });
              }
            }
          }
        }
      );

      // Subtle feedback
      if (isMarkingDone) {
        if (data.userSettings.soundEnabled) {
          playTaskCheckSound(data.userSettings.soundVolume);
        }

        // Check if this was the last overdue task being cleared
        const isOverdue = task.dateKey < todayKey;
        if (isOverdue && data.overdueTasks.length === 1 && data.overdueTasks[0].id === taskId) {
          showToast(`Backlog cleared. Today's schedule unlocked.`);
        }
      }

      await refreshData();
      return { success: true };
    },
    [data, showToast, refreshData]
  );

  // Add custom task
  const addTask = useCallback(
    async (taskData: {
      title: string;
      subjectId: string;
      type: 'lecture' | 'dpp' | 'custom';
      dateKey?: string;
      estimatedMinutes?: number;
      notes?: string;
      isMandatory?: boolean;
    }) => {
      const dateKey = taskData.dateKey || getTodayKey();
      const existing = await db.dailyTasks.where('dateKey').equals(dateKey).toArray();
      const order = existing.length + 1;
      const id = `${dateKey}-cust-${Date.now()}`;

      await db.dailyTasks.put({
        id,
        dateKey,
        title: taskData.title,
        type: taskData.type,
        subjectId: taskData.subjectId,
        done: false,
        isMandatory: taskData.isMandatory !== false,
        order,
        estimatedMinutes: taskData.estimatedMinutes || 30,
        notes: taskData.notes || '',
      });

      showToast(`Task "${taskData.title}" added`);
      await refreshData();
    },
    [showToast, refreshData]
  );

  // Edit task
  const editTask = useCallback(
    async (
      taskId: string,
      updates: {
        title?: string;
        estimatedMinutes?: number;
        notes?: string;
        subjectId?: string;
        isMandatory?: boolean;
      }
    ) => {
      await db.dailyTasks.update(taskId, updates);
      showToast(`Task updated`);
      await refreshData();
    },
    [showToast, refreshData]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      await db.transaction('rw', [db.dailyTasks, db.xpTransactions, db.lectureRecords], async () => {
        await db.dailyTasks.delete(taskId);
        await db.xpTransactions.delete(taskId);
        await db.lectureRecords.delete(`rec-${taskId}`);
      });
      showToast(`Task removed`);
      await refreshData();
    },
    [showToast, refreshData]
  );

  // Save weekly schedule day with validation, transactional persistence, and synchronization
  const saveWeeklyScheduleDay = useCallback(
    async (daySchedule: DaySchedule): Promise<{ success: boolean; message?: string }> => {
      try {
        await persistDaySchedule(daySchedule);
        await refreshData();
        showToast(`Saved schedule for ${daySchedule.dayName}`);
        return { success: true };
      } catch (err: unknown) {
        console.error('Failed to save weekly schedule:', err);
        const msg = err instanceof Error ? err.message : 'Failed to save weekly schedule';
        showToast(`Error: ${msg}`);
        return { success: false, message: msg };
      }
    },
    [showToast, refreshData]
  );

  // Update weekly schedule slot
  const updateWeeklyScheduleSlot = useCallback(
    async (dayOfWeek: number, slot: 1 | 2 | 3, subjectId: string | null) => {
      const day = await db.weeklySchedule.get(dayOfWeek);
      if (!day) return;
      const classes = day.classes.map((c) => (c.slot === slot ? { ...c, subjectId } : c));
      await persistDaySchedule({ ...day, classes });
      showToast(`Schedule updated`);
      await refreshData();
    },
    [showToast, refreshData]
  );

  // Update user settings
  const updateUserSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const current = await db.userSettings.get('current');
      const updated = { ...(current || { id: 'current' }), ...updates } as UserSettings;
      await db.userSettings.put(updated);
      showToast(`Settings saved`);
      await refreshData();
    },
    [showToast, refreshData]
  );

  // Export all data as JSON
  const exportData = useCallback(async () => {
    const [
      subjects,
      weeklySchedule,
      dailyTasks,
      lectureRecords,
      xpTransactions,
      userSettings,
      achievements,
    ] = await Promise.all([
      db.subjects.toArray(),
      db.weeklySchedule.toArray(),
      db.dailyTasks.toArray(),
      db.lectureRecords.toArray(),
      db.xpTransactions.toArray(),
      db.userSettings.get('current'),
      db.achievements.toArray(),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects,
      weeklySchedule,
      dailyTasks,
      lectureRecords,
      xpTransactions,
      userSettings,
      achievements,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyos-backup-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Data exported successfully`);
  }, [showToast]);

  // Import data from JSON
  const importData = useCallback(
    async (jsonContent: string): Promise<boolean> => {
      try {
        const backup = JSON.parse(jsonContent);
        if (!backup || !backup.dailyTasks || !backup.subjects) {
          throw new Error('Invalid StudyOS backup format');
        }

        await db.transaction(
          'rw',
          [
            db.subjects,
            db.weeklySchedule,
            db.dailyTasks,
            db.lectureRecords,
            db.xpTransactions,
            db.userSettings,
            db.achievements,
          ],
          async () => {
            await db.subjects.clear();
            await db.weeklySchedule.clear();
            await db.dailyTasks.clear();
            await db.lectureRecords.clear();
            await db.xpTransactions.clear();
            await db.achievements.clear();

            if (backup.subjects?.length) await db.subjects.bulkAdd(backup.subjects);
            if (backup.weeklySchedule?.length) await db.weeklySchedule.bulkAdd(backup.weeklySchedule);
            if (backup.dailyTasks?.length) await db.dailyTasks.bulkAdd(backup.dailyTasks);
            if (backup.lectureRecords?.length) await db.lectureRecords.bulkAdd(backup.lectureRecords);
            if (backup.xpTransactions?.length) await db.xpTransactions.bulkAdd(backup.xpTransactions);
            if (backup.achievements?.length) await db.achievements.bulkAdd(backup.achievements);
            if (backup.userSettings) await db.userSettings.put(backup.userSettings);
          }
        );

        showToast(`Backup restored successfully!`);
        await refreshData();
        return true;
      } catch (err) {
        console.error('Import error:', err);
        showToast(`Failed to import backup: invalid file format`);
        return false;
      }
    },
    [showToast, refreshData]
  );

  // Reset all data
  const resetAllData = useCallback(async () => {
    await db.transaction(
      'rw',
      [
        db.subjects,
        db.weeklySchedule,
        db.dailyTasks,
        db.lectureRecords,
        db.xpTransactions,
        db.userSettings,
        db.achievements,
      ],
      async () => {
        await db.subjects.clear();
        await db.weeklySchedule.clear();
        await db.dailyTasks.clear();
        await db.lectureRecords.clear();
        await db.xpTransactions.clear();
        await db.userSettings.clear();
        await db.achievements.clear();
      }
    );
    await initializeDatabase();
    showToast(`All data reset to defaults`);
    await refreshData();
  }, [showToast, refreshData]);

  // Ensure tasks are generated for any date
  const ensureTasksForDate = useCallback(
    async (dateKey: string) => {
      await generateTasksForDate(dateKey);
      await refreshData();
    },
    [refreshData]
  );

  // Generate / refresh lecture and DPP classes for all days of the active week
  const generateAllDaysTasks = useCallback(async () => {
    const currentWeek = getWeekDaysForDate(new Date());
    for (const w of currentWeek) {
      await generateTasksForDate(w.dateKey);
    }
    showToast(`Lecture and DPP classes generated for all days!`);
    await refreshData();
  }, [showToast, refreshData]);

  // Derived level information
  const levelInfo = useMemo(() => calculateLevel(data.totalXp), [data.totalXp]);

  return {
    ...data,
    levelInfo,
    toastMessage,
    refreshData,
    ensureTasksForDate,
    generateAllDaysTasks,
    toggleTask,
    addTask,
    editTask,
    deleteTask,
    updateWeeklyScheduleSlot,
    saveWeeklyScheduleDay,
    updateUserSettings,
    exportData,
    importData,
    resetAllData,
  };
}
