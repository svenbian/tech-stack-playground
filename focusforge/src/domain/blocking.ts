import type { AppInfo, AppLimit, BlockList, BlockState, Difficulty, FocusSession, Schedule } from './types';
import { activeWindow } from './schedule';
import { isOnBreak, sessionEndsAt } from './session';
import { nextMidnight } from './time';

/**
 * The single source of truth for "is this app blocked right now, and why?".
 * Sessions, schedules and daily limits all feed into the same resolver, so
 * the UI, the simulator and (later) the native shield always agree.
 */

export interface BlockingContext {
  catalog: AppInfo[];
  blockLists: BlockList[];
  schedules: Schedule[];
  limits: AppLimit[];
  activeSession?: FocusSession;
  /** Minutes used today, per app id. */
  usageToday: Record<string, number>;
  allowlist: string[];
}

/** Expand block lists (categories + individual apps) to a set of app ids. */
export function resolveBlockedAppIds(
  blockListIds: string[],
  blockLists: BlockList[],
  catalog: AppInfo[],
  allowlist: string[] = [],
): Set<string> {
  const lists = blockLists.filter((l) => blockListIds.includes(l.id));
  const ids = new Set<string>();
  for (const list of lists) {
    list.appIds.forEach((id) => ids.add(id));
    for (const app of catalog) {
      if (list.categories.includes(app.category)) ids.add(app.id);
    }
  }
  allowlist.forEach((id) => ids.delete(id));
  return ids;
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, deep: 2 };

export function getBlockState(appId: string, ctx: BlockingContext, now: number): BlockState {
  if (ctx.allowlist.includes(appId)) return { blocked: false };

  const candidates: BlockState[] = [];

  // 1. Active focus session (not during a break: blocking pauses on breaks).
  const s = ctx.activeSession;
  if (s && s.status === 'active' && !isOnBreak(s, now)) {
    if (resolveBlockedAppIds(s.blockListIds, ctx.blockLists, ctx.catalog).has(appId)) {
      candidates.push({
        blocked: true,
        reason: 'session',
        until: sessionEndsAt(s, now),
        difficulty: s.difficulty,
        sourceLabel: s.label,
      });
    }
  }

  // 2. Recurring schedules.
  for (const schedule of ctx.schedules) {
    const window = activeWindow(schedule, now);
    if (!window) continue;
    if (resolveBlockedAppIds(schedule.blockListIds, ctx.blockLists, ctx.catalog).has(appId)) {
      candidates.push({
        blocked: true,
        reason: 'schedule',
        until: window.end,
        difficulty: schedule.difficulty,
        sourceLabel: schedule.name,
      });
    }
  }

  // 3. Daily limits.
  const limit = ctx.limits.find((l) => l.enabled && l.appId === appId);
  if (limit && (ctx.usageToday[appId] ?? 0) >= limit.dailyLimitMinutes) {
    candidates.push({
      blocked: true,
      reason: 'limit',
      until: nextMidnight(now),
      difficulty: 'medium',
      sourceLabel: `${limit.dailyLimitMinutes} min daily limit`,
    });
  }

  if (candidates.length === 0) return { blocked: false };
  // Report the strictest rule; ties go to whichever lasts longest.
  return candidates.reduce((best, c) => {
    const rank = DIFFICULTY_RANK[c.difficulty!] - DIFFICULTY_RANK[best.difficulty!];
    if (rank > 0) return c;
    if (rank === 0 && (c.until ?? 0) > (best.until ?? 0)) return c;
    return best;
  });
}

/** Every app id that is blocked right now. This is what a native shield would receive. */
export function currentlyBlockedAppIds(ctx: BlockingContext, now: number): string[] {
  return ctx.catalog.filter((a) => getBlockState(a.id, ctx, now).blocked).map((a) => a.id);
}

export interface LimitProgress {
  limit: AppLimit;
  usedMinutes: number;
  remainingMinutes: number;
  ratio: number;
  reached: boolean;
}

export function limitProgress(limit: AppLimit, usageToday: Record<string, number>): LimitProgress {
  const used = usageToday[limit.appId] ?? 0;
  return {
    limit,
    usedMinutes: used,
    remainingMinutes: Math.max(0, limit.dailyLimitMinutes - used),
    ratio: limit.dailyLimitMinutes > 0 ? Math.min(1, used / limit.dailyLimitMinutes) : 1,
    reached: used >= limit.dailyLimitMinutes,
  };
}
