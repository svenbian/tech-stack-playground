import {
  canEndEarly,
  canTakeBreak,
  completeSession,
  createSession,
  endBreak,
  endSessionEarly,
  focusedMs,
  isOnBreak,
  isSessionDue,
  remainingMs,
  sessionEndsAt,
  startBreak,
} from '../session';
import { MINUTE } from '../time';

const T0 = new Date(2026, 9, 13, 9, 0).getTime();
const make = (difficulty: 'easy' | 'medium' | 'deep' = 'easy', minutes = 25) =>
  createSession({ id: 's1', label: 'Test', durationMinutes: minutes, difficulty, blockListIds: ['a'], now: T0 });

describe('focus session timer', () => {
  it('counts down from wall-clock time', () => {
    const s = make();
    expect(remainingMs(s, T0)).toBe(25 * MINUTE);
    expect(remainingMs(s, T0 + 10 * MINUTE)).toBe(15 * MINUTE);
    expect(isSessionDue(s, T0 + 24 * MINUTE)).toBe(false);
    expect(isSessionDue(s, T0 + 25 * MINUTE)).toBe(true);
  });

  it('pauses during a break and pushes the end time back', () => {
    let s = make('easy');
    s = startBreak(s, 5, T0 + 10 * MINUTE);
    expect(isOnBreak(s, T0 + 12 * MINUTE)).toBe(true);
    // Focus time frozen during the break.
    expect(focusedMs(s, T0 + 14 * MINUTE)).toBe(10 * MINUTE);
    expect(sessionEndsAt(s, T0 + 12 * MINUTE)).toBe(T0 + 30 * MINUTE);
    // After the break ends on its own, focus resumes.
    expect(isOnBreak(s, T0 + 16 * MINUTE)).toBe(false);
    expect(focusedMs(s, T0 + 20 * MINUTE)).toBe(15 * MINUTE);
  });

  it('ending a break early only charges the time actually taken', () => {
    let s = make('easy');
    s = startBreak(s, 15, T0 + 10 * MINUTE);
    s = endBreak(s, T0 + 12 * MINUTE);
    expect(sessionEndsAt(s, T0 + 13 * MINUTE)).toBe(T0 + 27 * MINUTE);
    expect(remainingMs(s, T0 + 13 * MINUTE)).toBe(14 * MINUTE);
  });

  it('completes with full focus credit', () => {
    const done = completeSession(make(), T0 + 40 * MINUTE);
    expect(done.status).toBe('completed');
    expect(done.endedAt).toBe(T0 + 25 * MINUTE);
    expect(focusedMs(done, T0 + 99 * MINUTE)).toBe(25 * MINUTE);
  });
});

describe('difficulty rules', () => {
  it('easy: end anytime, unlimited breaks', () => {
    let s = make('easy');
    for (let i = 0; i < 4; i++) {
      s = startBreak(s, 5, T0 + i * 6 * MINUTE);
      s = endBreak(s, T0 + i * 6 * MINUTE + MINUTE);
    }
    expect(canTakeBreak(s, T0 + 30 * MINUTE).allowed).toBe(true);
    expect(endSessionEarly(s, T0 + 31 * MINUTE).status).toBe('ended_early');
  });

  it('medium: two breaks, can end early', () => {
    let s = make('medium');
    s = endBreak(startBreak(s, 5, T0), T0 + MINUTE);
    s = endBreak(startBreak(s, 5, T0 + 2 * MINUTE), T0 + 3 * MINUTE);
    expect(canTakeBreak(s, T0 + 4 * MINUTE).allowed).toBe(false);
    expect(canEndEarly(s).allowed).toBe(true);
  });

  it('deep: no breaks, no early end', () => {
    const s = make('deep');
    expect(canTakeBreak(s, T0).allowed).toBe(false);
    expect(canEndEarly(s).allowed).toBe(false);
    expect(() => endSessionEarly(s, T0)).toThrow();
    expect(() => startBreak(s, 5, T0)).toThrow();
  });
});
