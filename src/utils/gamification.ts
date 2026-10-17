import { DailyTask } from '../types';
import { getTodayKey, addDays } from './dates';

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_TIERS = [
  { level: 1, xp: 0, title: 'Novice Scholar' },
  { level: 2, xp: 100, title: 'Active Apprentice' },
  { level: 3, xp: 250, title: 'Focused Student' },
  { level: 4, xp: 450, title: 'Disciplined Scholar' },
  { level: 5, xp: 700, title: 'Master of Routine' },
  { level: 6, xp: 1000, title: 'Consistent Ace' },
  { level: 7, xp: 1400, title: 'Subject Virtuoso' },
  { level: 8, xp: 1900, title: 'Grand Academic' },
  { level: 9, xp: 2500, title: 'High Honor Scholar' },
  { level: 10, xp: 3200, title: 'StudyOS Luminary' },
];

export function calculateLevel(totalXp: number): LevelInfo {
  let tier = LEVEL_TIERS[0];
  let nextTier = LEVEL_TIERS[1];

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (totalXp >= LEVEL_TIERS[i].xp) {
      tier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || {
        level: tier.level + 1,
        xp: tier.xp + 1000,
        title: 'StudyOS Legend',
      };
    } else {
      break;
    }
  }

  const range = nextTier.xp - tier.xp;
  const progressInTier = Math.max(0, totalXp - tier.xp);
  const progressPercent = Math.min(100, Math.round((progressInTier / range) * 100));

  return {
    level: tier.level,
    title: tier.title,
    currentXp: totalXp,
    currentLevelBaseXp: tier.xp,
    nextLevelXp: nextTier.xp,
    progressPercent,
  };
}

export function calculateStreak(tasks: DailyTask[]): { currentStreak: number; longestStreak: number } {
  // Collect all distinct dates where at least one task was marked done
  const activeDates = new Set<string>();
  tasks.forEach((t) => {
    if (t.done && t.completedOnDateKey) {
      activeDates.add(t.completedOnDateKey);
    } else if (t.done && t.completedAt) {
      activeDates.add(t.completedAt.split('T')[0]);
    }
  });

  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayKey = getTodayKey();
  const yesterdayKey = addDays(todayKey, -1);

  // Check if today or yesterday is active
  let currentStreak = 0;
  let checkKey = activeDates.has(todayKey) ? todayKey : activeDates.has(yesterdayKey) ? yesterdayKey : null;

  if (checkKey) {
    while (activeDates.has(checkKey)) {
      currentStreak += 1;
      checkKey = addDays(checkKey, -1);
    }
  }

  // Calculate longest streak across all history
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let running = 0;
  let prevDateKey: string | null = null;

  for (const dateKey of sortedDates) {
    if (!prevDateKey) {
      running = 1;
    } else {
      const expected = addDays(prevDateKey, 1);
      if (dateKey === expected) {
        running += 1;
      } else {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDateKey = dateKey;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}
