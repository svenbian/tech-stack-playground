import type { Difficulty, FocusBreak, FocusSession } from './types';
import { MINUTE } from './time';

/**
 * Session timing is wall-clock based: we store timestamps, not "seconds left".
 * That way the timer stays correct after the app is backgrounded, killed or the
 * phone restarts. The UI just re-derives everything from `now`.
 *
 * Breaks pause the timer: the session's end time moves back by the time spent
 * on break, so a break never costs you focus time.
 */

export interface DifficultyRules {
  label: string;
  tagline: string;
  canEndEarly: boolean;
  /** Seconds of mindful countdown before "End session" becomes available. */
  endEarlyDelaySeconds: number;
  /** null = unlimited. */
  maxBreaks: number | null;
  /** Seconds of countdown before a break starts. */
  breakDelaySeconds: number;
}

export const DIFFICULTY_RULES: Record<Difficulty, DifficultyRules> = {
  easy: {
    label: 'Easy',
    tagline: 'Gentle reminders. End anytime.',
    canEndEarly: true,
    endEarlyDelaySeconds: 0,
    maxBreaks: null,
    breakDelaySeconds: 0,
  },
  medium: {
    label: 'Medium',
    tagline: 'A mindful pause before you quit.',
    canEndEarly: true,
    endEarlyDelaySeconds: 10,
    maxBreaks: 2,
    breakDelaySeconds: 5,
  },
  deep: {
    label: 'Deep Focus',
    tagline: 'Locked in until the timer ends.',
    canEndEarly: false,
    endEarlyDelaySeconds: 0,
    maxBreaks: 0,
    breakDelaySeconds: 0,
  },
};

export const DURATION_PRESETS_MIN = [25, 50, 90];
export const BREAK_PRESETS_MIN = [5, 15];

function breakElapsedMs(b: FocusBreak, now: number): number {
  const end = b.endedAt ?? Math.min(now, b.startedAt + b.durationMs);
  return Math.max(0, end - b.startedAt);
}

export function totalBreakMs(session: FocusSession, now: number): number {
  return session.breaks.reduce((sum, b) => sum + breakElapsedMs(b, now), 0);
}

export function currentBreak(session: FocusSession, now: number): FocusBreak | undefined {
  const last = session.breaks[session.breaks.length - 1];
  if (!last || last.endedAt !== undefined) return undefined;
  return now < last.startedAt + last.durationMs ? last : undefined;
}

export function isOnBreak(session: FocusSession, now: number): boolean {
  return session.status === 'active' && currentBreak(session, now) !== undefined;
}

/** Breaks whose planned time has passed but haven't been closed yet. */
export function hasExpiredOpenBreak(session: FocusSession, now: number): boolean {
  const last = session.breaks[session.breaks.length - 1];
  return !!last && last.endedAt === undefined && now >= last.startedAt + last.durationMs;
}

/**
 * When the session will finish. While on a break we assume the full planned
 * break is taken, so the ring doesn't jump around.
 */
export function sessionEndsAt(session: FocusSession, now: number): number {
  const open = currentBreak(session, now);
  const closedBreaks = session.breaks
    .filter((b) => b !== open)
    .reduce((sum, b) => sum + breakElapsedMs(b, now), 0);
  return session.startedAt + session.plannedDurationMs + closedBreaks + (open ? open.durationMs : 0);
}

export function focusedMs(session: FocusSession, now: number): number {
  const end = session.endedAt ?? Math.min(now, sessionEndsAt(session, now));
  const raw = end - session.startedAt - totalBreakMs(session, end);
  return Math.max(0, Math.min(session.plannedDurationMs, raw));
}

export function remainingMs(session: FocusSession, now: number): number {
  return Math.max(0, session.plannedDurationMs - focusedMs(session, now));
}

/** 0 → 1 progress of focused time. */
export function sessionProgress(session: FocusSession, now: number): number {
  if (session.plannedDurationMs <= 0) return 1;
  return Math.min(1, focusedMs(session, now) / session.plannedDurationMs);
}

export function isSessionDue(session: FocusSession, now: number): boolean {
  return session.status === 'active' && now >= sessionEndsAt(session, now);
}

export function breaksRemaining(session: FocusSession): number | null {
  const max = DIFFICULTY_RULES[session.difficulty].maxBreaks;
  if (max === null) return null;
  return Math.max(0, max - session.breaks.length);
}

export type ActionCheck = { allowed: true } | { allowed: false; reason: string };

export function canTakeBreak(session: FocusSession, now: number): ActionCheck {
  if (session.status !== 'active') return { allowed: false, reason: 'This session has ended.' };
  if (isOnBreak(session, now)) return { allowed: false, reason: "You're already on a break." };
  const left = breaksRemaining(session);
  if (left === 0) {
    return {
      allowed: false,
      reason:
        session.difficulty === 'deep'
          ? 'Deep Focus has no breaks. You chose this. You’ve got it.'
          : 'You’ve used your breaks for this session.',
    };
  }
  return { allowed: true };
}

export function canEndEarly(session: FocusSession): ActionCheck {
  if (session.status !== 'active') return { allowed: false, reason: 'This session has ended.' };
  if (!DIFFICULTY_RULES[session.difficulty].canEndEarly) {
    return { allowed: false, reason: 'Deep Focus can’t be ended early. Breathe. The finish line is coming.' };
  }
  return { allowed: true };
}

// ---- State transitions (pure: return a new session) ------------------------

export function createSession(input: {
  id: string;
  label: string;
  durationMinutes: number;
  difficulty: Difficulty;
  blockListIds: string[];
  now: number;
  source?: FocusSession['source'];
  scheduleId?: string;
}): FocusSession {
  return {
    id: input.id,
    label: input.label,
    startedAt: input.now,
    plannedDurationMs: Math.round(input.durationMinutes * MINUTE),
    difficulty: input.difficulty,
    blockListIds: input.blockListIds,
    breaks: [],
    status: 'active',
    source: input.source ?? 'manual',
    scheduleId: input.scheduleId,
  };
}

export function startBreak(session: FocusSession, minutes: number, now: number): FocusSession {
  const check = canTakeBreak(session, now);
  if (!check.allowed) throw new Error(check.reason);
  return { ...session, breaks: [...session.breaks, { startedAt: now, durationMs: minutes * MINUTE }] };
}

/** Close an open break (early or on time). Idempotent. */
export function endBreak(session: FocusSession, now: number): FocusSession {
  const last = session.breaks[session.breaks.length - 1];
  if (!last || last.endedAt !== undefined) return session;
  const endedAt = Math.min(now, last.startedAt + last.durationMs);
  return { ...session, breaks: [...session.breaks.slice(0, -1), { ...last, endedAt }] };
}

export function completeSession(session: FocusSession, now: number): FocusSession {
  const closed = endBreak(session, now);
  return { ...closed, status: 'completed', endedAt: Math.min(now, sessionEndsAt(closed, now)) };
}

export function endSessionEarly(session: FocusSession, now: number): FocusSession {
  const check = canEndEarly(session);
  if (!check.allowed) throw new Error(check.reason);
  return { ...endBreak(session, now), status: 'ended_early', endedAt: now };
}
