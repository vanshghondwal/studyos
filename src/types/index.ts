export type TaskType = 'lecture' | 'dpp' | 'custom';

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  bgColor: string;
  borderColor: string;
  order: number;
  plannedTotalLectures?: number;
}

export interface WeeklyClassSlot {
  slot: 1 | 2 | 3;
  subjectId: string | null; // null represents "No class"
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayName: string;
  isRestDay: boolean;
  classes: WeeklyClassSlot[];
}

export interface DailyTask {
  id: string;
  dateKey: string; // YYYY-MM-DD of the scheduled day
  title: string;
  type: TaskType;
  subjectId: string;
  classSlot?: number; // 1, 2, 3
  done: boolean;
  isMandatory: boolean;
  completedAt?: string; // ISO string
  completedOnDateKey?: string; // YYYY-MM-DD when completed
  estimatedMinutes?: number;
  notes?: string;
  order: number;
}

export interface LectureRecord {
  id: string;
  subjectId: string;
  lectureNumber: number;
  title: string;
  scheduledDateKey?: string;
  completedDateKey?: string;
  done: boolean;
  completedAt?: string;
  notes?: string;
}

export interface XpTransaction {
  id: string;
  taskId: string;
  dateKey: string;
  xp: number;
  reason: string;
  timestamp: string;
}

export interface UserSettings {
  id: string; // 'current'
  userName: string;
  backlogMode: 'strict' | 'flexible';
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  theme: 'dark' | 'light';
  dailyGoalHours?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'backlog' | 'special';
  unlockedAt?: string;
  currentProgress: number;
  maxProgress: number;
}

export interface StudyDaySummary {
  dateKey: string;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  isPerfectDay: boolean;
  xpEarned: number;
}
