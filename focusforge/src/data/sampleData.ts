import type {
  AppLimit,
  BlockAttemptLog,
  BlockList,
  Difficulty,
  FocusSession,
  Schedule,
  UsageLog,
} from '@/domain/types';
import { addDays, MINUTE, startOfDay, toDateKey } from '@/domain/time';

/**
 * Generates two weeks of believable history so every screen has something to
 * show on first launch. It's deterministic (seeded PRNG), so screenshots and
 * tests stay stable for a given day.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_BLOCK_LISTS: BlockList[] = [
  { id: 'bl-social', name: 'Social Media', emoji: '💬', categories: ['social'], appIds: [], createdAt: 0 },
  {
    id: 'bl-fun',
    name: 'Entertainment & Games',
    emoji: '🎮',
    categories: ['entertainment', 'games'],
    appIds: [],
    createdAt: 0,
  },
  { id: 'bl-rabbit', name: 'Rabbit Holes', emoji: '🐇', categories: ['news'], appIds: ['reddit', 'youtube', 'amazon'], createdAt: 0 },
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'sc-work',
    name: 'Deep Work Mornings',
    emoji: '☀️',
    days: [1, 2, 3, 4, 5],
    startMinutes: 9 * 60,
    endMinutes: 12 * 60,
    blockListIds: ['bl-social', 'bl-fun'],
    difficulty: 'medium',
    enabled: true,
  },
  {
    id: 'sc-sleep',
    name: 'Wind Down',
    emoji: '🌙',
    days: [0, 1, 2, 3, 4, 5, 6],
    startMinutes: 23 * 60,
    endMinutes: 7 * 60,
    blockListIds: ['bl-social', 'bl-fun', 'bl-rabbit'],
    difficulty: 'easy',
    enabled: true,
  },
];

export const DEFAULT_LIMITS: AppLimit[] = [
  { id: 'lim-ig', appId: 'instagram', dailyLimitMinutes: 30, enabled: true },
  { id: 'lim-yt', appId: 'youtube', dailyLimitMinutes: 45, enabled: true },
  { id: 'lim-tt', appId: 'tiktok', dailyLimitMinutes: 20, enabled: true },
];

const DISTRACTION_WEIGHTS: Record<string, number> = {
  instagram: 34,
  tiktok: 28,
  youtube: 40,
  reddit: 18,
  x: 14,
  netflix: 22,
  news: 10,
  amazon: 7,
  candy: 9,
  spotify: 25,
  whatsapp: 18,
  slack: 30,
};

const LABELS = ['Deep work', 'Writing', 'Study', 'Reading', 'Design sprint', 'Inbox zero', 'Planning'];

export interface SampleHistory {
  sessions: FocusSession[];
  usage: UsageLog;
  blockAttempts: BlockAttemptLog;
}

export function generateSampleHistory(now: number, days = 14): SampleHistory {
  const rand = mulberry32(Math.floor(startOfDay(now).getTime() / 86_400_000));
  const sessions: FocusSession[] = [];
  const usage: UsageLog = {};
  const blockAttempts: BlockAttemptLog = {};

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = addDays(startOfDay(now), -offset);
    const key = toDateKey(day);
    const isToday = offset === 0;
    // Users improve over time: distraction trends down, focus trends up.
    const trend = 1 - (days - 1 - offset) / (days * 1.6);
    // Skip a couple of days so streak math is visible.
    const restDay = offset === 9 || offset === 10;

    // Usage: today only partially elapsed.
    const dayFraction = isToday ? Math.min(1, (now - day.getTime()) / 86_400_000 / 0.75) : 1;
    usage[key] = {};
    for (const [appId, avg] of Object.entries(DISTRACTION_WEIGHTS)) {
      const mins = Math.round(avg * (0.55 + rand() * 0.9) * (appId === 'slack' ? 1 : trend) * dayFraction);
      if (mins > 0) usage[key][appId] = mins;
    }
    blockAttempts[key] = Math.round((4 + rand() * 9) * dayFraction);

    if (restDay) continue;
    const count = isToday ? (now - day.getTime() > 11 * 3_600_000 ? 1 : 0) : 1 + Math.floor(rand() * 3);
    let cursor = day.getTime() + (8.5 + rand() * 1.5) * 3_600_000;
    for (let i = 0; i < count; i++) {
      const duration = [25, 50, 50, 90][Math.floor(rand() * 4)];
      const difficulty: Difficulty = rand() > 0.8 ? 'deep' : rand() > 0.4 ? 'medium' : 'easy';
      const endedEarly = difficulty !== 'deep' && rand() > 0.85;
      const startedAt = cursor;
      const focused = endedEarly ? duration * (0.4 + rand() * 0.4) : duration;
      sessions.push({
        id: `sample-${key}-${i}`,
        label: LABELS[Math.floor(rand() * LABELS.length)],
        startedAt,
        plannedDurationMs: duration * MINUTE,
        difficulty,
        blockListIds: ['bl-social', 'bl-fun'],
        breaks: [],
        status: endedEarly ? 'ended_early' : 'completed',
        endedAt: startedAt + focused * MINUTE,
        source: 'manual',
      });
      cursor += (duration + 30 + rand() * 120) * MINUTE;
    }
  }
  return { sessions, usage, blockAttempts };
}
