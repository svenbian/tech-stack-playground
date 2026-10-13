import { APP_CATALOG } from '@/data/catalog';
import { generateSampleHistory } from '@/data/sampleData';
import { GEMS, newlyUnlockedGems, type GemSnapshot } from '../gems';
import { createSession, completeSession } from '../session';
import { computeStreaks, focusScore, weeklyReport } from '../stats';
import { addDays, MINUTE, toDateKey } from '../time';

const NOW = new Date(2026, 9, 13, 20, 0).getTime();

describe('focus score', () => {
  it('rewards progress toward the goal and a good ratio', () => {
    expect(focusScore(0, 0, 120)).toBe(0);
    expect(focusScore(120, 0, 120)).toBe(100);
    expect(focusScore(60, 60, 120)).toBe(50); // 35 + 15
    expect(focusScore(10, 300, 120)).toBeGreaterThan(0); // never a harsh zero
  });
});

describe('streaks', () => {
  const day = (offset: number) => toDateKey(addDays(NOW, offset));

  it('counts consecutive qualifying days ending today or yesterday', () => {
    expect(computeStreaks({ [day(0)]: 30, [day(-1)]: 30, [day(-2)]: 30 }, NOW).current).toBe(3);
    // Today not done yet: streak still alive from yesterday.
    expect(computeStreaks({ [day(-1)]: 30, [day(-2)]: 30 }, NOW).current).toBe(2);
    // Days under the minimum break the chain.
    expect(computeStreaks({ [day(0)]: 30, [day(-1)]: 10, [day(-2)]: 30 }, NOW).current).toBe(1);
  });

  it('tracks the longest run', () => {
    const log = { [day(-10)]: 30, [day(-9)]: 30, [day(-8)]: 30, [day(-7)]: 30, [day(0)]: 40 };
    expect(computeStreaks(log, NOW)).toMatchObject({ current: 1, longest: 4 });
  });
});

describe('weekly report & gems', () => {
  it('summarizes sample data sensibly', () => {
    const h = generateSampleHistory(NOW);
    const r = weeklyReport({ ...h, catalog: APP_CATALOG, goalMinutes: 120, baselineDistractionMinutes: 240, now: NOW });
    expect(r.days).toHaveLength(7);
    expect(r.totalFocusMinutes).toBeGreaterThan(0);
    expect(r.topDistractions.length).toBeGreaterThan(0);
    expect(r.topDistractions.every((a) => a.app.category !== 'productivity')).toBe(true);
    expect(r.averageScore).toBeGreaterThanOrEqual(0);
    expect(r.averageScore).toBeLessThanOrEqual(100);
  });

  it('unlocks the first gems after a completed deep session', () => {
    const s = completeSession(
      createSession({ id: 'x', label: 'x', durationMinutes: 25, difficulty: 'deep', blockListIds: [], now: NOW - 30 * MINUTE }),
      NOW,
    );
    const snapshot: GemSnapshot = {
      sessions: [s], totalFocusMinutes: 25, currentStreak: 1, longestStreak: 1,
      blockLists: [], schedules: [], limits: [], totalBlockAttempts: 0,
    };
    const fresh = newlyUnlockedGems(snapshot, {});
    expect(fresh).toEqual(expect.arrayContaining(['first-session', 'first-deep']));
    expect(newlyUnlockedGems(snapshot, { 'first-session': 1, 'first-deep': 1 })).toEqual([]);
    expect(new Set(GEMS.map((g) => g.id)).size).toBe(GEMS.length);
  });
});
