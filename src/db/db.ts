import Dexie, { type Table } from 'dexie';
import {
  Subject,
  DaySchedule,
  DailyTask,
  LectureRecord,
  XpTransaction,
  UserSettings,
  Achievement,
} from '../types';
import { getTodayKey, getDayOfWeekFromKey, getWeekDaysForDate, getPreviousDayKey } from '../utils/dates';

export class StudyOSDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  weeklySchedule!: Table<DaySchedule, number>;
  dailyTasks!: Table<DailyTask, string>;
  lectureRecords!: Table<LectureRecord, string>;
  xpTransactions!: Table<XpTransaction, string>;
  userSettings!: Table<UserSettings, string>;
  achievements!: Table<Achievement, string>;

  constructor() {
    super('StudyOSDatabase');
    this.version(1).stores({
      subjects: 'id, name, order',
      weeklySchedule: 'dayOfWeek',
      dailyTasks: 'id, dateKey, done, isMandatory, subjectId, type, [dateKey+done]',
      lectureRecords: 'id, subjectId, done, lectureNumber, scheduledDateKey',
      xpTransactions: 'id, taskId, dateKey, timestamp',
      userSettings: 'id',
      achievements: 'id, unlockedAt',
    });
  }
}

export const db = new StudyOSDatabase();

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'accountancy',
    name: 'Accountancy',
    color: '#3b82f6', // Soft blue
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    order: 1,
    plannedTotalLectures: 40,
  },
  {
    id: 'statistics',
    name: 'Statistics',
    color: '#10b981', // Emerald green
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    order: 2,
    plannedTotalLectures: 35,
  },
  {
    id: 'math',
    name: 'Math',
    color: '#f43f5e', // Coral red
    bgColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    order: 3,
    plannedTotalLectures: 45,
  },
  {
    id: 'business-studies',
    name: 'Business Studies',
    color: '#8b5cf6', // Violet purple
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    order: 4,
    plannedTotalLectures: 32,
  },
  {
    id: 'micro-economics',
    name: 'Micro Economics',
    color: '#f59e0b', // Warm amber
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    order: 5,
    plannedTotalLectures: 30,
  },
];

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    dayOfWeek: 1, // Monday
    dayName: 'Monday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'statistics' },
      { slot: 3, subjectId: 'math' },
    ],
  },
  {
    dayOfWeek: 2, // Tuesday
    dayName: 'Tuesday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'statistics' },
      { slot: 3, subjectId: 'micro-economics' },
    ],
  },
  {
    dayOfWeek: 3, // Wednesday
    dayName: 'Wednesday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'statistics' },
      { slot: 3, subjectId: 'math' },
    ],
  },
  {
    dayOfWeek: 4, // Thursday
    dayName: 'Thursday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'business-studies' },
      { slot: 3, subjectId: 'math' },
    ],
  },
  {
    dayOfWeek: 5, // Friday
    dayName: 'Friday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'business-studies' },
      { slot: 3, subjectId: 'micro-economics' },
    ],
  },
  {
    dayOfWeek: 6, // Saturday
    dayName: 'Saturday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'business-studies' },
      { slot: 3, subjectId: 'math' },
    ],
  },
  {
    dayOfWeek: 0, // Sunday
    dayName: 'Sunday',
    isRestDay: false,
    classes: [
      { slot: 1, subjectId: 'accountancy' },
      { slot: 2, subjectId: 'statistics' },
      { slot: 3, subjectId: 'micro-economics' },
    ],
  },
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your very first study task.',
    icon: 'target',
    category: 'completion',
    currentProgress: 0,
    maxProgress: 1,
  },
  {
    id: 'backlog-hero',
    title: 'Backlog Destroyer',
    description: 'Clear 3 overdue backlog tasks.',
    icon: 'shield-alert',
    category: 'backlog',
    currentProgress: 0,
    maxProgress: 3,
  },
  {
    id: 'perfect-day',
    title: 'Perfect Day',
    description: 'Complete 100% of your scheduled tasks for a day.',
    icon: 'sparkles',
    category: 'completion',
    currentProgress: 0,
    maxProgress: 1,
  },
  {
    id: 'streak-3',
    title: 'Three-Day Streak',
    description: 'Maintain study momentum for 3 consecutive days.',
    icon: 'flame',
    category: 'streak',
    currentProgress: 0,
    maxProgress: 3,
  },
  {
    id: 'streak-7',
    title: 'Consistency King',
    description: 'Achieve a 7-day study streak without missing.',
    icon: 'crown',
    category: 'streak',
    currentProgress: 0,
    maxProgress: 7,
  },
  {
    id: 'dpp-master-25',
    title: 'Problem Solver',
    description: 'Successfully complete 25 Daily Practice Problems (DPPs).',
    icon: 'file-check-2',
    category: 'special',
    currentProgress: 0,
    maxProgress: 25,
  },
];

export async function generateTasksForDate(dateKey: string): Promise<DailyTask[]> {
  const existing = await db.dailyTasks.where('dateKey').equals(dateKey).toArray();

  // Recorded lecture mapping: The study tasks on dateKey correspond to original classes from 1 calendar day prior
  const originalClassDate = getPreviousDayKey(dateKey);
  const originalClassDayOfWeek = getDayOfWeekFromKey(originalClassDate);
  const schedule = await db.weeklySchedule.get(originalClassDayOfWeek);
  if (!schedule) {
    return existing;
  }

  const subjects = await db.subjects.toArray();
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const newTasks: DailyTask[] = [];
  let orderIndex = existing.length;

  for (const classSlot of schedule.classes) {
    if (!classSlot.subjectId) continue;
    const subject = subjectMap.get(classSlot.subjectId);
    const subjectName = subject ? subject.name : 'Class';

    // 1. Lecture Task
    const existingLec = existing.find((t) => t.classSlot === classSlot.slot && t.type === 'lecture');
    if (!existingLec) {
      orderIndex += 1;
      newTasks.push({
        id: `${dateKey}-c${classSlot.slot}-lec`,
        dateKey,
        studyDate: dateKey,
        originalClassDate,
        title: `${subjectName} Lecture (Class ${classSlot.slot})`,
        type: 'lecture',
        subjectId: classSlot.subjectId,
        classSlot: classSlot.slot,
        done: false,
        isMandatory: true,
        order: orderIndex,
        estimatedMinutes: 60,
      });
    } else {
      // If task exists, preserve completion state but ensure studyDate/originalClassDate are recorded
      const updates: Partial<DailyTask> = {};
      if (!existingLec.studyDate) updates.studyDate = dateKey;
      if (!existingLec.originalClassDate) updates.originalClassDate = originalClassDate;
      // If uncompleted and today/future, update to current mapped class if changed (preserving past historical tasks)
      if (!existingLec.done && dateKey >= getTodayKey() && existingLec.subjectId !== classSlot.subjectId) {
        updates.subjectId = classSlot.subjectId;
        updates.title = `${subjectName} Lecture (Class ${classSlot.slot})`;
      }
      if (Object.keys(updates).length > 0) {
        await db.dailyTasks.update(existingLec.id, updates);
        Object.assign(existingLec, updates);
      }
    }

    // 2. DPP Task
    const existingDpp = existing.find((t) => t.classSlot === classSlot.slot && t.type === 'dpp');
    if (!existingDpp) {
      orderIndex += 1;
      newTasks.push({
        id: `${dateKey}-c${classSlot.slot}-dpp`,
        dateKey,
        studyDate: dateKey,
        originalClassDate,
        title: `${subjectName} DPP ${classSlot.slot}`,
        type: 'dpp',
        subjectId: classSlot.subjectId,
        classSlot: classSlot.slot,
        done: false,
        isMandatory: true,
        order: orderIndex,
        estimatedMinutes: 30,
      });
    } else {
      const updates: Partial<DailyTask> = {};
      if (!existingDpp.studyDate) updates.studyDate = dateKey;
      if (!existingDpp.originalClassDate) updates.originalClassDate = originalClassDate;
      // If uncompleted and today/future, update to current mapped class if changed (preserving past historical tasks)
      if (!existingDpp.done && dateKey >= getTodayKey() && existingDpp.subjectId !== classSlot.subjectId) {
        updates.subjectId = classSlot.subjectId;
        updates.title = `${subjectName} DPP ${classSlot.slot}`;
      }
      if (Object.keys(updates).length > 0) {
        await db.dailyTasks.update(existingDpp.id, updates);
        Object.assign(existingDpp, updates);
      }
    }
  }

  if (newTasks.length > 0) {
    await db.dailyTasks.bulkAdd(newTasks);
  }

  return [...existing, ...newTasks];
}

export async function persistDaySchedule(daySchedule: DaySchedule): Promise<void> {
  // 1. Validate schedule data
  if (typeof daySchedule.dayOfWeek !== 'number' || daySchedule.dayOfWeek < 0 || daySchedule.dayOfWeek > 6) {
    throw new Error(`Invalid dayOfWeek: ${daySchedule.dayOfWeek}. Must be between 0 (Sunday) and 6 (Saturday).`);
  }
  if (!Array.isArray(daySchedule.classes)) {
    throw new Error('Schedule classes must be an array.');
  }

  // Ensure all 3 slots (1, 2, 3) are strictly normalized
  const validSlots = [1, 2, 3] as const;
  const normalizedClasses = validSlots.map((slotNum) => {
    const existing = daySchedule.classes.find((c) => c.slot === slotNum);
    return {
      slot: slotNum,
      subjectId: existing?.subjectId ? String(existing.subjectId) : null,
    };
  });

  const validatedRecord: DaySchedule = {
    dayOfWeek: daySchedule.dayOfWeek,
    dayName: daySchedule.dayName || 'Day',
    isRestDay: !!daySchedule.isRestDay,
    classes: normalizedClasses,
  };

  // 2. Persist transactionally to Dexie IndexedDB
  await db.transaction('rw', [db.weeklySchedule, db.dailyTasks, db.subjects], async () => {
    await db.weeklySchedule.put(validatedRecord);

    // 3. Synchronize active and future uncompleted tasks (preserving completed and past records)
    const todayKey = getTodayKey();
    const allSubjects = await db.subjects.toArray();
    const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

    const activeTasks = await db.dailyTasks
      .where('dateKey')
      .aboveOrEqual(todayKey)
      .toArray();

    for (const task of activeTasks) {
      if (task.done) continue; // NEVER modify completed tasks!

      // Check if this task corresponds to original class on validatedRecord.dayOfWeek
      const origDate = task.originalClassDate || getPreviousDayKey(task.dateKey);
      const origDayOfWeek = getDayOfWeekFromKey(origDate);

      if (origDayOfWeek === validatedRecord.dayOfWeek && task.classSlot) {
        const slotConfig = normalizedClasses.find((c) => c.slot === task.classSlot);
        if (slotConfig && slotConfig.subjectId) {
          const sub = subjectMap.get(slotConfig.subjectId);
          const subName = sub ? sub.name : 'Class';
          const newTitle =
            task.type === 'lecture'
              ? `${subName} Lecture (Class ${task.classSlot})`
              : `${subName} DPP ${task.classSlot}`;
          await db.dailyTasks.update(task.id, {
            subjectId: slotConfig.subjectId,
            title: newTitle,
          });
        }
      }
    }
  });
}

export async function initializeDatabase(): Promise<void> {
  const subjectsCount = await db.subjects.count();
  if (subjectsCount === 0) {
    await db.subjects.bulkAdd(DEFAULT_SUBJECTS);
  }

  // Initialize weekly schedule only once if no schedule has ever been saved
  const scheduleCount = await db.weeklySchedule.count();
  if (scheduleCount === 0) {
    await db.weeklySchedule.bulkAdd(DEFAULT_WEEKLY_SCHEDULE);
  } else {
    // Ensure all 7 days (Monday through Sunday) exist in DB without overwriting saved custom schedules
    for (const defaultDay of DEFAULT_WEEKLY_SCHEDULE) {
      const existingDay = await db.weeklySchedule.get(defaultDay.dayOfWeek);
      if (!existingDay) {
        await db.weeklySchedule.put(defaultDay);
      }
    }
  }

  const achievementsCount = await db.achievements.count();
  if (achievementsCount === 0) {
    await db.achievements.bulkAdd(DEFAULT_ACHIEVEMENTS);
  }

  const settings = await db.userSettings.get('current');
  if (!settings) {
    await db.userSettings.put({
      id: 'current',
      userName: 'Scholar',
      backlogMode: 'strict', // Strict mode default
      soundEnabled: true,
      soundVolume: 0.5,
      theme: 'dark',
      dailyGoalHours: 4,
    });
  }

  // Backfill studyDate and originalClassDate for any existing records
  const allExistingTasks = await db.dailyTasks.toArray();
  for (const t of allExistingTasks) {
    if (!t.studyDate || !t.originalClassDate) {
      const sDate = t.studyDate || t.dateKey;
      await db.dailyTasks.update(t.id, {
        studyDate: sDate,
        originalClassDate: t.originalClassDate || getPreviousDayKey(sDate),
      });
    }
  }

  // Ensure lecture and DPP tasks for all days of the current week are generated with recorded mapping
  const currentWeek = getWeekDaysForDate(new Date());
  for (const day of currentWeek) {
    await generateTasksForDate(day.dateKey);
  }
}
