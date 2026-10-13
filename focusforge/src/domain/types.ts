/**
 * Core domain types. Everything in `src/domain` is plain TypeScript: no React,
 * no storage, no platform APIs. That keeps the rules easy to test and reuse.
 */

export type AppCategory =
  | 'social'
  | 'entertainment'
  | 'games'
  | 'news'
  | 'shopping'
  | 'communication'
  | 'productivity'
  | 'utilities';

export interface AppInfo {
  id: string;
  name: string;
  category: AppCategory;
  /** Ionicons glyph name used to draw a placeholder app icon. */
  icon: string;
  /** Brand-ish tint for the placeholder icon. */
  color: string;
  kind: 'app' | 'website';
  domain?: string;
}

export interface BlockList {
  id: string;
  name: string;
  emoji: string;
  /** Whole categories to block (e.g. every social app). */
  categories: AppCategory[];
  /** Individually picked apps/websites. */
  appIds: string[];
  createdAt: number;
}

export type Difficulty = 'easy' | 'medium' | 'deep';

export interface FocusBreak {
  startedAt: number;
  /** Planned break length. */
  durationMs: number;
  /** Set when the break ends (early or on time). */
  endedAt?: number;
}

export type SessionStatus = 'active' | 'completed' | 'ended_early';

export interface FocusSession {
  id: string;
  label: string;
  startedAt: number;
  plannedDurationMs: number;
  difficulty: Difficulty;
  blockListIds: string[];
  breaks: FocusBreak[];
  status: SessionStatus;
  endedAt?: number;
  source: 'manual' | 'schedule';
  scheduleId?: string;
}

export interface Schedule {
  id: string;
  name: string;
  emoji: string;
  /** 0 = Sunday … 6 = Saturday (matches Date#getDay). */
  days: number[];
  /** Minutes since midnight, 0–1439. */
  startMinutes: number;
  /** Minutes since midnight. If <= start, the block runs past midnight. */
  endMinutes: number;
  blockListIds: string[];
  difficulty: Difficulty;
  enabled: boolean;
}

export interface AppLimit {
  id: string;
  appId: string;
  dailyLimitMinutes: number;
  enabled: boolean;
}

/** `YYYY-MM-DD` in local time. */
export type DateKey = string;

/** Minutes spent per app per day, e.g. usage['2026-10-13']['instagram'] = 34. */
export type UsageLog = Record<DateKey, Record<string, number>>;

/** How many times a blocked app was opened (and the shield shown) per day. */
export type BlockAttemptLog = Record<DateKey, number>;

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  name: string;
  onboarded: boolean;
  theme: ThemePreference;
  haptics: boolean;
  defaultDifficulty: Difficulty;
  /** Daily focus goal in minutes, which drives the Focus Score. */
  dailyGoalMinutes: number;
  /** User's estimate of daily distracted minutes before FocusForge, used for "time saved". */
  baselineDistractionMinutes: number;
  /** Apps that are never blocked. */
  allowlist: string[];
}

export type BlockReason = 'session' | 'schedule' | 'limit';

export interface BlockState {
  blocked: boolean;
  reason?: BlockReason;
  /** When the block lifts (epoch ms), if known. */
  until?: number;
  difficulty?: Difficulty;
  /** Human label of what's blocking (session label, schedule name, limit). */
  sourceLabel?: string;
}
