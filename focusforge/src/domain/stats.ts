import type { AppCategory, AppInfo, BlockAttemptLog, DateKey, FocusSession, UsageLog } from './types';
import { focusedMs } from './session';
import { addDays, fromDateKey, lastNDays, MINUTE, toDateKey } from './time';

/** Categories that count as "time on other apps" for the Focus Score. */
export const DISTRACTING_CATEGORIES: AppCategory[] = ['social', 'entertainment', 'games', 'news', 'shopping'];

/** A day counts toward your streak once you focus at least this long. */
export const STREAK_MIN_FOCUS_MINUTES = 25;

/**
 * Focused minutes per day. A session is attributed to the day it started on.
 * That's a small simplification for sessions running past midnight.
 */
export function focusMinutesByDay(sessions: FocusSession[], now: number): Record<DateKey, number> {
  const out: Record<DateKey, number> = {};
  for (const s of sessions) {
    const key = toDateKey(s.startedAt);
    out[key] = (out[key] ?? 0) + focusedMs(s, now) / MINUTE;
  }
  return out;
}

export function distractedMinutes(usageForDay: Record<string, number> | undefined, catalog: AppInfo[]): number {
  if (!usageForDay) return 0;
  const byId = new Map(catalog.map((a) => [a.id, a]));
  return Object.entries(usageForDay).reduce((sum, [id, mins]) => {
    const app = byId.get(id);
    return app && DISTRACTING_CATEGORIES.includes(app.category) ? sum + mins : sum;
  }, 0);
}

/**
 * Focus Score, 0–100.
 *  • 70 pts: progress toward your daily focus goal
 *  • 30 pts: share of tracked time that was focused (vs. on distracting apps)
 * Gentle by design: a little focus always earns something, and nobody gets
 * a "zero" just for opening Instagram.
 */
export function focusScore(focused: number, distracted: number, goalMinutes: number): number {
  if (focused <= 0 && distracted <= 0) return 0;
  const goalPart = Math.min(1, focused / Math.max(1, goalMinutes)) * 70;
  const ratioPart = (focused / Math.max(1, focused + distracted)) * 30;
  return Math.round(goalPart + ratioPart);
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'In the zone';
  if (score >= 65) return 'Strong focus';
  if (score >= 40) return 'Building momentum';
  if (score > 0) return 'A gentle start';
  return 'Ready when you are';
}

export interface StreakInfo {
  current: number;
  longest: number;
  /** Did today already count? */
  todayCounts: boolean;
}

export function computeStreaks(focusByDay: Record<DateKey, number>, now: number): StreakInfo {
  const qualifies = (key: DateKey) => (focusByDay[key] ?? 0) >= STREAK_MIN_FOCUS_MINUTES;
  const todayKey = toDateKey(now);
  const todayCounts = qualifies(todayKey);

  // Current streak: count back from today (or yesterday, if today hasn't counted *yet*:
  // we don't break someone's streak at 8am).
  let current = 0;
  let cursor = todayCounts ? new Date(now) : addDays(now, -1);
  while (qualifies(toDateKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const keys = Object.keys(focusByDay).filter(qualifies).sort();
  let longest = 0;
  let run = 0;
  let prev: string | undefined;
  for (const key of keys) {
    run = prev && toDateKey(addDays(fromDateKey(prev), 1)) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = key;
  }
  return { current, longest: Math.max(longest, current), todayCounts };
}

export interface DaySummary {
  key: DateKey;
  focusMinutes: number;
  distractedMinutes: number;
  score: number;
}

export function daySummaries(
  days: DateKey[],
  focusByDay: Record<DateKey, number>,
  usage: UsageLog,
  catalog: AppInfo[],
  goalMinutes: number,
): DaySummary[] {
  return days.map((key) => {
    const focus = focusByDay[key] ?? 0;
    const distracted = distractedMinutes(usage[key], catalog);
    return { key, focusMinutes: focus, distractedMinutes: distracted, score: focusScore(focus, distracted, goalMinutes) };
  });
}

export interface AppUsageRow {
  app: AppInfo;
  minutes: number;
}

export interface CategoryUsageRow {
  category: AppCategory;
  minutes: number;
}

export function usageBreakdown(days: DateKey[], usage: UsageLog, catalog: AppInfo[]) {
  const byApp = new Map<string, number>();
  for (const key of days) {
    for (const [id, mins] of Object.entries(usage[key] ?? {})) byApp.set(id, (byApp.get(id) ?? 0) + mins);
  }
  const apps: AppUsageRow[] = [];
  const cats = new Map<AppCategory, number>();
  for (const app of catalog) {
    const minutes = byApp.get(app.id);
    if (!minutes) continue;
    apps.push({ app, minutes });
    cats.set(app.category, (cats.get(app.category) ?? 0) + minutes);
  }
  apps.sort((a, b) => b.minutes - a.minutes);
  const categories: CategoryUsageRow[] = [...cats.entries()]
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
  return { apps, categories };
}

export interface WeeklyReport {
  days: DaySummary[];
  totalFocusMinutes: number;
  totalDistractedMinutes: number;
  /** Minutes below your pre-FocusForge baseline, summed over the week. */
  timeSavedMinutes: number;
  averageScore: number;
  sessionsCompleted: number;
  blockAttempts: number;
  longestStreak: number;
  topDistractions: AppUsageRow[];
  categories: CategoryUsageRow[];
}

export function weeklyReport(input: {
  sessions: FocusSession[];
  usage: UsageLog;
  blockAttempts: BlockAttemptLog;
  catalog: AppInfo[];
  goalMinutes: number;
  baselineDistractionMinutes: number;
  now: number;
}): WeeklyReport {
  const keys = lastNDays(7, input.now);
  const focusByDay = focusMinutesByDay(input.sessions, input.now);
  const days = daySummaries(keys, focusByDay, input.usage, input.catalog, input.goalMinutes);
  const { apps, categories } = usageBreakdown(keys, input.usage, input.catalog);
  const keySet = new Set(keys);
  const trackedDays = days.filter((d) => d.focusMinutes > 0 || d.distractedMinutes > 0);

  return {
    days,
    totalFocusMinutes: sum(days.map((d) => d.focusMinutes)),
    totalDistractedMinutes: sum(days.map((d) => d.distractedMinutes)),
    timeSavedMinutes: sum(trackedDays.map((d) => Math.max(0, input.baselineDistractionMinutes - d.distractedMinutes))),
    averageScore: trackedDays.length ? Math.round(sum(trackedDays.map((d) => d.score)) / trackedDays.length) : 0,
    sessionsCompleted: input.sessions.filter((s) => s.status === 'completed' && keySet.has(toDateKey(s.startedAt))).length,
    blockAttempts: sum(keys.map((k) => input.blockAttempts[k] ?? 0)),
    longestStreak: computeStreaks(focusByDay, input.now).longest,
    topDistractions: apps.filter((a) => DISTRACTING_CATEGORIES.includes(a.app.category)).slice(0, 5),
    categories,
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
