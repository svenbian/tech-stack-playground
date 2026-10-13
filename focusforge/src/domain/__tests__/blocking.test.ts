import { APP_CATALOG } from '@/data/catalog';
import { currentlyBlockedAppIds, getBlockState, resolveBlockedAppIds, type BlockingContext } from '../blocking';
import { createSession, startBreak } from '../session';
import { MINUTE } from '../time';
import type { BlockList, Schedule } from '../types';

const NOW = new Date(2026, 9, 12, 10, 0).getTime(); // Monday 10:00
const social: BlockList = { id: 'social', name: 'Social', emoji: '💬', categories: ['social'], appIds: ['youtube'], createdAt: 0 };

const base = (over: Partial<BlockingContext> = {}): BlockingContext => ({
  catalog: APP_CATALOG,
  blockLists: [social],
  schedules: [],
  limits: [],
  usageToday: {},
  allowlist: ['messages'],
  ...over,
});

describe('blocking resolver', () => {
  it('expands categories and individual apps, minus the allowlist', () => {
    const ids = resolveBlockedAppIds(['social'], [social], APP_CATALOG, ['reddit']);
    expect(ids.has('instagram')).toBe(true);
    expect(ids.has('youtube')).toBe(true);
    expect(ids.has('reddit')).toBe(false);
    expect(ids.has('maps')).toBe(false);
  });

  it('blocks during an active session but not during its break', () => {
    const session = createSession({ id: 's', label: 'Deep work', durationMinutes: 50, difficulty: 'medium', blockListIds: ['social'], now: NOW });
    expect(getBlockState('instagram', base({ activeSession: session }), NOW + MINUTE)).toMatchObject({ blocked: true, reason: 'session' });
    const onBreak = startBreak(session, 5, NOW + MINUTE);
    expect(getBlockState('instagram', base({ activeSession: onBreak }), NOW + 2 * MINUTE).blocked).toBe(false);
  });

  it('blocks during an active schedule', () => {
    const schedule: Schedule = {
      id: 'w', name: 'Work', emoji: '', days: [1], startMinutes: 540, endMinutes: 720,
      blockListIds: ['social'], difficulty: 'deep', enabled: true,
    };
    const state = getBlockState('tiktok', base({ schedules: [schedule] }), NOW);
    expect(state).toMatchObject({ blocked: true, reason: 'schedule', difficulty: 'deep', sourceLabel: 'Work' });
  });

  it('blocks once the daily limit is used up, until midnight', () => {
    const ctx = base({ limits: [{ id: 'l', appId: 'netflix', dailyLimitMinutes: 30, enabled: true }], usageToday: { netflix: 30 } });
    const state = getBlockState('netflix', ctx, NOW);
    expect(state.reason).toBe('limit');
    expect(new Date(state.until!).getHours()).toBe(0);
    expect(getBlockState('netflix', { ...ctx, usageToday: { netflix: 29 } }, NOW).blocked).toBe(false);
  });

  it('never blocks allowlisted apps', () => {
    const list: BlockList = { ...social, categories: ['communication'] };
    const session = createSession({ id: 's', label: 'x', durationMinutes: 25, difficulty: 'deep', blockListIds: ['social'], now: NOW });
    const ctx = base({ blockLists: [list], activeSession: session });
    expect(getBlockState('messages', ctx, NOW).blocked).toBe(false);
    expect(getBlockState('whatsapp', ctx, NOW).blocked).toBe(true);
    expect(currentlyBlockedAppIds(ctx, NOW)).not.toContain('messages');
  });
});
