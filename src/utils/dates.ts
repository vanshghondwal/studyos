export function getTodayKey(): string {
  const now = new Date();
  return formatDateKey(now);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatFriendlyDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysOverdue(scheduledDateKey: string, todayKey: string = getTodayKey()): number {
  const sched = parseDateKey(scheduledDateKey);
  const today = parseDateKey(todayKey);
  const diffTime = today.getTime() - sched.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getDayOfWeekFromKey(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday through Sunday

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function addDays(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

export function getWeekDaysForDate(targetDate: Date): { dateKey: string; dayOfWeek: number; dayName: string; isToday: boolean }[] {
  const currentDay = targetDate.getDay(); // 0 is Sun, 1 is Mon...
  // Monday as start of week:
  const distanceToMonday = (currentDay + 6) % 7;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - distanceToMonday);

  const todayKey = getTodayKey();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(dayDate);
    days.push({
      dateKey,
      dayOfWeek: dayDate.getDay(),
      dayName: WEEKDAY_NAMES[dayDate.getDay()],
      isToday: dateKey === todayKey,
    });
  }
  return days;
}
