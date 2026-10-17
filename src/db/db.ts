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
import { getTodayKey, getDayOfWeekFromKey, getWeekDaysForDate } from '../utils/dates';

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
  const existingSlots = new Set(existing.map((t) => `${t.classSlot}-${t.type}`));

  const dayOfWeek = getDayOfWeekFromKey(dateKey);
  const schedule = await db.weeklySchedule.get(dayOfWeek);
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

    // 1. Lecture Task if missing
    if (!existingSlots.has(`${classSlot.slot}-lecture`)) {
      orderIndex += 1;
      newTasks.push({
        id: `${dateKey}-c${classSlot.slot}-lec`,
        dateKey,
        title: `${subjectName} Lecture (Class ${classSlot.slot})`,
        type: 'lecture',
        subjectId: classSlot.subjectId,
        classSlot: classSlot.slot,
        done: false,
        isMandatory: true,
        order: orderIndex,
        estimatedMinutes: 60,
      });
    }

    // 2. DPP Task if missing
    if (!existingSlots.has(`${classSlot.slot}-dpp`)) {
      orderIndex += 1;
      newTasks.push({
        id: `${dateKey}-c${classSlot.slot}-dpp`,
        dateKey,
        title: `${subjectName} DPP ${classSlot.slot}`,
        type: 'dpp',
        subjectId: classSlot.subjectId,
        classSlot: classSlot.slot,
        done: false,
        isMandatory: true,
        order: orderIndex,
        estimatedMinutes: 30,
      });
    }
  }

  if (newTasks.length > 0) {
    await db.dailyTasks.bulkAdd(newTasks);
  }

  return [...existing, ...newTasks];
}

export async function initializeDatabase(): Promise<void> {
  const subjectsCount = await db.subjects.count();
  if (subjectsCount === 0) {
    await db.subjects.bulkAdd(DEFAULT_SUBJECTS);
  }

  const scheduleCount = await db.weeklySchedule.count();
  if (scheduleCount === 0) {
    await db.weeklySchedule.bulkAdd(DEFAULT_WEEKLY_SCHEDULE);
  } else {
    // Ensure all 7 days (Monday through Sunday) have full classes configured in existing databases
    for (const defaultDay of DEFAULT_WEEKLY_SCHEDULE) {
      const existingDay = await db.weeklySchedule.get(defaultDay.dayOfWeek);
      if (
        !existingDay ||
        existingDay.isRestDay ||
        existingDay.classes.length < 3 ||
        existingDay.classes.some((c) => !c.subjectId)
      ) {
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

  // Ensure lecture and DPP tasks for ALL days of the current week (and surrounding days) are generated
  const currentWeek = getWeekDaysForDate(new Date());
  for (const day of currentWeek) {
    await generateTasksForDate(day.dateKey);
  }
}
