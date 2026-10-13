import type { FocusSession, Schedule, AppLimit, BlockList } from './types';
import { focusedMs } from './session';
import { MINUTE } from './time';

/**
 * Gems are milestone badges. Each one is a predicate over a small snapshot of
 * the user's progress, so adding a new gem is a single entry in GEMS.
 */

export interface GemSnapshot {
  sessions: FocusSession[];
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  blockLists: BlockList[];
  schedules: Schedule[];
  limits: AppLimit[];
  totalBlockAttempts: number;
}

export interface GemDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Gradient-ish tint for the badge. */
  color: string;
  /** 0 → 1 progress toward unlocking. */
  progress: (s: GemSnapshot) => number;
}

const completed = (s: GemSnapshot) => s.sessions.filter((x) => x.status === 'completed');
const ratio = (value: number, target: number) => Math.min(1, value / target);

export const GEMS: GemDefinition[] = [
  {
    id: 'first-session',
    name: 'First Spark',
    description: 'Complete your first focus session.',
    emoji: '✨',
    color: '#F2C46D',
    progress: (s) => ratio(completed(s).length, 1),
  },
  {
    id: 'first-deep',
    name: 'Deep Diver',
    description: 'Finish a Deep Focus session.',
    emoji: '🌊',
    color: '#6C7BF2',
    progress: (s) => ratio(completed(s).filter((x) => x.difficulty === 'deep').length, 1),
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Create a recurring schedule.',
    emoji: '🗓️',
    color: '#7FB69E',
    progress: (s) => ratio(s.schedules.length, 1),
  },
  {
    id: 'boundaries',
    name: 'Healthy Boundaries',
    description: 'Set your first daily app limit.',
    emoji: '🧭',
    color: '#E89B7B',
    progress: (s) => ratio(s.limits.length, 1),
  },
  {
    id: 'ten-hours',
    name: 'Ten-Hour Tree',
    description: 'Focus for 10 hours in total.',
    emoji: '🌳',
    color: '#5FAF8A',
    progress: (s) => ratio(s.totalFocusMinutes, 600),
  },
  {
    id: 'marathon',
    name: 'Marathon Mind',
    description: 'Complete a single session of 90 minutes or more.',
    emoji: '🏔️',
    color: '#9A8CF0',
    progress: (s) =>
      ratio(Math.max(0, ...completed(s).map((x) => focusedMs(x, x.endedAt ?? 0) / MINUTE)), 90),
  },
  {
    id: 'streak-3',
    name: 'Kindling',
    description: 'Focus 3 days in a row.',
    emoji: '🔥',
    color: '#F29A6B',
    progress: (s) => ratio(s.longestStreak, 3),
  },
  {
    id: 'streak-7',
    name: 'Steady Flame',
    description: 'Keep a 7-day focus streak.',
    emoji: '💎',
    color: '#6CB8F2',
    progress: (s) => ratio(s.longestStreak, 7),
  },
  {
    id: 'resisted-25',
    name: 'Calm Resolve',
    description: 'Choose focus over a blocked app 25 times.',
    emoji: '🪷',
    color: '#E58FB5',
    progress: (s) => ratio(s.totalBlockAttempts, 25),
  },
  {
    id: 'fifty-hours',
    name: 'Forge Master',
    description: 'Focus for 50 hours in total.',
    emoji: '🏆',
    color: '#E0B04C',
    progress: (s) => ratio(s.totalFocusMinutes, 3000),
  },
];

/** Gem ids that are unlocked in `snapshot` but not yet in `alreadyUnlocked`. */
export function newlyUnlockedGems(snapshot: GemSnapshot, alreadyUnlocked: Record<string, number>): string[] {
  return GEMS.filter((g) => !alreadyUnlocked[g.id] && g.progress(snapshot) >= 1).map((g) => g.id);
}

export function gemById(id: string): GemDefinition | undefined {
  return GEMS.find((g) => g.id === id);
}
