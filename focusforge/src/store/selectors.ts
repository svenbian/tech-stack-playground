import { useMemo } from 'react';

import { APP_CATALOG } from '@/data/catalog';
import type { BlockingContext } from '@/domain/blocking';
import { computeStreaks, distractedMinutes, focusMinutesByDay, focusScore, weeklyReport } from '@/domain/stats';
import { toDateKey } from '@/domain/time';
import type { FocusSession } from '@/domain/types';
import { useFocusStore } from './focusStore';

/*
 * Hooks that derive view data from the store. Each one subscribes to the
 * *smallest* slices it needs (stable references), then computes with useMemo.
 * Returning a fresh object straight from a Zustand selector would re-render forever.
 */

export function useActiveSession(): FocusSession | undefined {
  const id = useFocusStore((s) => s.activeSessionId);
  const sessions = useFocusStore((s) => s.sessions);
  return useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);
}

export function useBlockingContext(now: number): BlockingContext {
  const blockLists = useFocusStore((s) => s.blockLists);
  const schedules = useFocusStore((s) => s.schedules);
  const limits = useFocusStore((s) => s.limits);
  const usage = useFocusStore((s) => s.usage);
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const activeSession = useActiveSession();
  const todayKey = toDateKey(now);
  return useMemo(
    () => ({
      catalog: APP_CATALOG,
      blockLists,
      schedules,
      limits,
      activeSession,
      usageToday: usage[todayKey] ?? {},
      allowlist,
    }),
    [blockLists, schedules, limits, activeSession, usage, todayKey, allowlist],
  );
}

export function useTodaySummary(now: number) {
  const sessions = useFocusStore((s) => s.sessions);
  const usage = useFocusStore((s) => s.usage);
  const goal = useFocusStore((s) => s.settings.dailyGoalMinutes);
  const attempts = useFocusStore((s) => s.blockAttempts);
  // Re-derive once a minute is plenty for summary numbers (the live timer has its own clock).
  const minuteBucket = Math.floor(now / 60_000);
  return useMemo(() => {
    const t = minuteBucket * 60_000;
    const key = toDateKey(t);
    const focusByDay = focusMinutesByDay(sessions, t);
    const focus = focusByDay[key] ?? 0;
    const distracted = distractedMinutes(usage[key], APP_CATALOG);
    return {
      focusMinutes: focus,
      distractedMinutes: distracted,
      score: focusScore(focus, distracted, goal),
      goalMinutes: goal,
      streak: computeStreaks(focusByDay, t),
      blockAttempts: attempts[key] ?? 0,
      sessionsToday: sessions.filter((s) => toDateKey(s.startedAt) === key && s.status === 'completed').length,
    };
  }, [sessions, usage, goal, attempts, minuteBucket]);
}

export function useWeeklyReport(now: number) {
  const sessions = useFocusStore((s) => s.sessions);
  const usage = useFocusStore((s) => s.usage);
  const blockAttempts = useFocusStore((s) => s.blockAttempts);
  const goal = useFocusStore((s) => s.settings.dailyGoalMinutes);
  const baseline = useFocusStore((s) => s.settings.baselineDistractionMinutes);
  const minuteBucket = Math.floor(now / 60_000);
  return useMemo(
    () =>
      weeklyReport({
        sessions,
        usage,
        blockAttempts,
        catalog: APP_CATALOG,
        goalMinutes: goal,
        baselineDistractionMinutes: baseline,
        now: minuteBucket * 60_000,
      }),
    [sessions, usage, blockAttempts, goal, baseline, minuteBucket],
  );
}
