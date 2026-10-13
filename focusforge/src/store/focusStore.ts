import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_ALLOWLIST } from '@/data/catalog';
import {
  DEFAULT_BLOCK_LISTS,
  DEFAULT_LIMITS,
  DEFAULT_SCHEDULES,
  generateSampleHistory,
} from '@/data/sampleData';
import { newlyUnlockedGems } from '@/domain/gems';
import * as Session from '@/domain/session';
import { computeStreaks, focusMinutesByDay } from '@/domain/stats';
import { toDateKey } from '@/domain/time';
import type {
  AppCategory,
  AppLimit,
  BlockAttemptLog,
  BlockList,
  Difficulty,
  FocusSession,
  Schedule,
  Settings,
  UsageLog,
} from '@/domain/types';
import { persistStorage } from './storage';

export interface FocusState {
  /** True once persisted state has loaded. Screens wait for this. */
  hydrated: boolean;
  settings: Settings;
  blockLists: BlockList[];
  schedules: Schedule[];
  limits: AppLimit[];
  /** All sessions, including the active one. */
  sessions: FocusSession[];
  activeSessionId?: string;
  usage: UsageLog;
  blockAttempts: BlockAttemptLog;
  /** gemId → unlocked timestamp. */
  unlockedGems: Record<string, number>;
  /** Gems unlocked but not yet celebrated in the UI (not persisted). */
  celebrationQueue: string[];

  // Onboarding & data
  completeOnboarding: (input: OnboardingInput) => void;
  loadSampleData: () => void;
  resetAll: () => void;

  // Sessions
  startSession: (input: StartSessionInput) => string;
  takeBreak: (minutes: number) => void;
  resumeFromBreak: () => void;
  endSessionEarly: () => void;
  /** Called every second by the session watcher: completes due sessions, closes breaks, checks gems. */
  tick: (now?: number) => void;

  // Block lists, schedules, limits
  upsertBlockList: (list: Omit<BlockList, 'id' | 'createdAt'> & { id?: string }) => string;
  deleteBlockList: (id: string) => void;
  upsertSchedule: (schedule: Omit<Schedule, 'id'> & { id?: string }) => string;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string, enabled: boolean) => void;
  upsertLimit: (limit: Omit<AppLimit, 'id'> & { id?: string }) => string;
  deleteLimit: (id: string) => void;
  toggleLimit: (id: string, enabled: boolean) => void;

  // Settings
  updateSettings: (patch: Partial<Settings>) => void;
  toggleAllowlisted: (appId: string) => void;

  // Usage simulation & tracking
  recordUsage: (appId: string, minutes: number, now?: number) => void;
  recordBlockAttempt: (now?: number) => void;
  checkGems: (now?: number) => void;
  dismissCelebration: () => void;
}

export interface OnboardingInput {
  name: string;
  distractions: AppCategory[];
  dailyGoalMinutes: number;
  baselineDistractionMinutes: number;
  addSleepSchedule: boolean;
  addWorkSchedule: boolean;
  withSampleData: boolean;
}

export interface StartSessionInput {
  label: string;
  durationMinutes: number;
  difficulty: Difficulty;
  blockListIds: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  onboarded: false,
  theme: 'system',
  haptics: true,
  defaultDifficulty: 'medium',
  dailyGoalMinutes: 120,
  baselineDistractionMinutes: 180,
  allowlist: DEFAULT_ALLOWLIST,
};

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const initialData = {
  settings: DEFAULT_SETTINGS,
  blockLists: [] as BlockList[],
  schedules: [] as Schedule[],
  limits: [] as AppLimit[],
  sessions: [] as FocusSession[],
  activeSessionId: undefined as string | undefined,
  usage: {} as UsageLog,
  blockAttempts: {} as BlockAttemptLog,
  unlockedGems: {} as Record<string, number>,
  celebrationQueue: [] as string[],
};

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const exists = items.some((i) => i.id === item.id);
  return exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => {
      /** Replace the active session via a pure domain transition. */
      const updateActive = (fn: (s: FocusSession) => FocusSession) => {
        const { activeSessionId, sessions } = get();
        const active = sessions.find((s) => s.id === activeSessionId);
        if (!active) return;
        const next = fn(active);
        set({
          sessions: sessions.map((s) => (s.id === next.id ? next : s)),
          activeSessionId: next.status === 'active' ? next.id : undefined,
        });
      };

      return {
        hydrated: false,
        ...initialData,

        completeOnboarding: (input) => {
          const now = Date.now();
          // Turn picked distraction categories into a first block list.
          const firstList: BlockList = {
            id: 'bl-mine',
            name: 'My Distractions',
            emoji: '🌿',
            categories: input.distractions,
            appIds: [],
            createdAt: now,
          };
          const blockLists = input.withSampleData ? [firstList, ...DEFAULT_BLOCK_LISTS] : [firstList];
          const listIds = [firstList.id];
          const schedules: Schedule[] = [];
          if (input.addWorkSchedule) schedules.push({ ...DEFAULT_SCHEDULES[0], blockListIds: listIds });
          if (input.addSleepSchedule) schedules.push({ ...DEFAULT_SCHEDULES[1], blockListIds: listIds });
          const history = input.withSampleData
            ? generateSampleHistory(now)
            : { sessions: [], usage: {}, blockAttempts: {} };

          set({
            settings: {
              ...get().settings,
              name: input.name.trim(),
              dailyGoalMinutes: input.dailyGoalMinutes,
              baselineDistractionMinutes: input.baselineDistractionMinutes,
              onboarded: true,
            },
            blockLists,
            schedules,
            limits: input.withSampleData ? DEFAULT_LIMITS : [],
            ...history,
          });
          // Sample history may already qualify for gems: unlock silently, no confetti for fake data.
          get().checkGems(now);
          if (input.withSampleData) set({ celebrationQueue: [] });
        },

        loadSampleData: () => {
          const now = Date.now();
          const history = generateSampleHistory(now);
          const { blockLists, schedules, limits } = get();
          set({
            ...history,
            activeSessionId: undefined,
            blockLists: blockLists.length ? blockLists : DEFAULT_BLOCK_LISTS,
            schedules: schedules.length ? schedules : DEFAULT_SCHEDULES,
            limits: limits.length ? limits : DEFAULT_LIMITS,
          });
          get().checkGems(now);
          set({ celebrationQueue: [] });
        },

        resetAll: () => set({ ...initialData, settings: { ...DEFAULT_SETTINGS } }),

        startSession: (input) => {
          const now = Date.now();
          // Only one session at a time: finish any lingering one first.
          get().tick(now);
          if (get().activeSessionId) throw new Error('A session is already running.');
          const session = Session.createSession({ id: newId('fs'), ...input, now });
          set({ sessions: [...get().sessions, session], activeSessionId: session.id });
          return session.id;
        },

        takeBreak: (minutes) => updateActive((s) => Session.startBreak(s, minutes, Date.now())),
        resumeFromBreak: () => updateActive((s) => Session.endBreak(s, Date.now())),
        endSessionEarly: () => updateActive((s) => Session.endSessionEarly(s, Date.now())),

        tick: (now = Date.now()) => {
          const { activeSessionId, sessions } = get();
          const active = sessions.find((s) => s.id === activeSessionId);
          if (!active) return;
          if (Session.isSessionDue(active, now)) {
            updateActive((s) => Session.completeSession(s, now));
            get().checkGems(now);
          } else if (Session.hasExpiredOpenBreak(active, now)) {
            updateActive((s) => Session.endBreak(s, now));
          }
        },

        upsertBlockList: ({ id, ...rest }) => {
          const existing = get().blockLists.find((l) => l.id === id);
          const list: BlockList = { id: id ?? newId('bl'), createdAt: existing?.createdAt ?? Date.now(), ...rest };
          set({ blockLists: upsert(get().blockLists, list) });
          return list.id;
        },
        deleteBlockList: (id) =>
          set({
            blockLists: get().blockLists.filter((l) => l.id !== id),
            schedules: get().schedules.map((s) => ({ ...s, blockListIds: s.blockListIds.filter((x) => x !== id) })),
          }),

        upsertSchedule: ({ id, ...rest }) => {
          const schedule: Schedule = { id: id ?? newId('sc'), ...rest };
          set({ schedules: upsert(get().schedules, schedule) });
          get().checkGems();
          return schedule.id;
        },
        deleteSchedule: (id) => set({ schedules: get().schedules.filter((s) => s.id !== id) }),
        toggleSchedule: (id, enabled) =>
          set({ schedules: get().schedules.map((s) => (s.id === id ? { ...s, enabled } : s)) }),

        upsertLimit: ({ id, ...rest }) => {
          const limit: AppLimit = { id: id ?? newId('lim'), ...rest };
          set({ limits: upsert(get().limits, limit) });
          get().checkGems();
          return limit.id;
        },
        deleteLimit: (id) => set({ limits: get().limits.filter((l) => l.id !== id) }),
        toggleLimit: (id, enabled) => set({ limits: get().limits.map((l) => (l.id === id ? { ...l, enabled } : l)) }),

        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
        toggleAllowlisted: (appId) => {
          const { allowlist } = get().settings;
          const next = allowlist.includes(appId) ? allowlist.filter((a) => a !== appId) : [...allowlist, appId];
          get().updateSettings({ allowlist: next });
        },

        recordUsage: (appId, minutes, now = Date.now()) => {
          const key = toDateKey(now);
          const usage = get().usage;
          const day = usage[key] ?? {};
          set({ usage: { ...usage, [key]: { ...day, [appId]: (day[appId] ?? 0) + minutes } } });
        },
        recordBlockAttempt: (now = Date.now()) => {
          const key = toDateKey(now);
          const attempts = get().blockAttempts;
          set({ blockAttempts: { ...attempts, [key]: (attempts[key] ?? 0) + 1 } });
          get().checkGems(now);
        },

        checkGems: (now = Date.now()) => {
          const state = get();
          const focusByDay = focusMinutesByDay(state.sessions, now);
          const streaks = computeStreaks(focusByDay, now);
          const fresh = newlyUnlockedGems(
            {
              sessions: state.sessions,
              totalFocusMinutes: Object.values(focusByDay).reduce((a, b) => a + b, 0),
              currentStreak: streaks.current,
              longestStreak: streaks.longest,
              blockLists: state.blockLists,
              schedules: state.schedules,
              limits: state.limits,
              totalBlockAttempts: Object.values(state.blockAttempts).reduce((a, b) => a + b, 0),
            },
            state.unlockedGems,
          );
          if (fresh.length === 0) return;
          const unlocked = { ...state.unlockedGems };
          fresh.forEach((id) => (unlocked[id] = now));
          set({ unlockedGems: unlocked, celebrationQueue: [...state.celebrationQueue, ...fresh] });
        },
        dismissCelebration: () => set({ celebrationQueue: get().celebrationQueue.slice(1) }),
      };
    },
    {
      name: 'focusforge-store',
      version: 1,
      storage: persistStorage,
      // Persist data, not functions or transient UI state.
      partialize: ({ hydrated, celebrationQueue, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<FocusState>,
      onRehydrateStorage: () => () => useFocusStore.setState({ hydrated: true }),
    },
  ),
);
