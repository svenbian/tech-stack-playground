import type { Schedule } from './types';
import { addDays, formatMinutesOfDay, minutesSinceMidnight, startOfDay, WEEKDAY_SHORT } from './time';

/** True if the schedule's window spans midnight (e.g. 23:00 → 07:00). */
export function isOvernight(s: Pick<Schedule, 'startMinutes' | 'endMinutes'>): boolean {
  return s.endMinutes <= s.startMinutes;
}

export function scheduleLengthMinutes(s: Pick<Schedule, 'startMinutes' | 'endMinutes'>): number {
  return isOvernight(s) ? 1440 - s.startMinutes + s.endMinutes : s.endMinutes - s.startMinutes;
}

/**
 * Returns the active window [start, end) containing `now`, or null.
 * Overnight windows belong to the day they *start* on: a Mon 23:00→07:00
 * schedule is active early Tuesday morning only if Monday is selected.
 */
export function activeWindow(schedule: Schedule, now: number): { start: number; end: number } | null {
  if (!schedule.enabled || schedule.days.length === 0) return null;
  const minute = minutesSinceMidnight(now);
  const today = startOfDay(now);
  const day = today.getDay();

  if (!isOvernight(schedule)) {
    if (schedule.days.includes(day) && minute >= schedule.startMinutes && minute < schedule.endMinutes) {
      return windowFrom(today, schedule);
    }
    return null;
  }

  // Overnight: the evening portion belongs to today, the morning portion to yesterday.
  if (minute >= schedule.startMinutes && schedule.days.includes(day)) {
    return windowFrom(today, schedule);
  }
  const yesterday = addDays(today, -1);
  if (minute < schedule.endMinutes && schedule.days.includes(yesterday.getDay())) {
    return windowFrom(yesterday, schedule);
  }
  return null;
}

function windowFrom(dayStart: Date, s: Schedule) {
  const start = dayStart.getTime() + s.startMinutes * 60_000;
  return { start, end: start + scheduleLengthMinutes(s) * 60_000 };
}

export function isScheduleActive(schedule: Schedule, now: number): boolean {
  return activeWindow(schedule, now) !== null;
}

/** Next start time strictly after `now` within the coming week, or null. */
export function nextStart(schedule: Schedule, now: number): number | null {
  if (!schedule.enabled || schedule.days.length === 0) return null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(startOfDay(now), offset);
    if (!schedule.days.includes(day.getDay())) continue;
    const start = day.getTime() + schedule.startMinutes * 60_000;
    if (start > now) return start;
  }
  return null;
}

export function formatScheduleTime(s: Pick<Schedule, 'startMinutes' | 'endMinutes'>): string {
  return `${formatMinutesOfDay(s.startMinutes)} – ${formatMinutesOfDay(s.endMinutes)}`;
}

export function formatScheduleDays(days: number[]): string {
  const sorted = [...days].sort();
  const key = sorted.join(',');
  if (key === '0,1,2,3,4,5,6') return 'Every day';
  if (key === '1,2,3,4,5') return 'Weekdays';
  if (key === '0,6') return 'Weekends';
  if (sorted.length === 0) return 'No days';
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ');
}
