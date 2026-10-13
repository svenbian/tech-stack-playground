import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { currentlyBlockedAppIds } from '@/domain/blocking';
import { blockingService } from '@/services/blocking';
import { useFocusStore } from '@/store/focusStore';
import { useBlockingContext } from '@/store/selectors';
import { useNow } from './useNow';

/**
 * Background "engine" mounted once in the root layout:
 *  1. ticks the session state machine (complete due sessions, auto-resume after breaks)
 *  2. keeps the BlockingService shield in sync with the current rules
 */
export function useAppWatchers() {
  const tick = useFocusStore((s) => s.tick);
  const hydrated = useFocusStore((s) => s.hydrated);
  const now = useNow(1000);

  useEffect(() => {
    if (hydrated) tick(now);
  }, [hydrated, now, tick]);

  // Catch up immediately when returning from the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useFocusStore.getState().tick();
    });
    return () => sub.remove();
  }, []);

  const ctx = useBlockingContext(now);
  const blockedKey = currentlyBlockedAppIds(ctx, now).join(',');
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || blockedKey === lastKey.current) return;
    lastKey.current = blockedKey;
    const appIds = blockedKey ? blockedKey.split(',') : [];
    blockingService
      .applyShield({ appIds, title: 'Time to focus', subtitle: 'This app is resting for now.' })
      .catch(() => {});
  }, [blockedKey, hydrated]);
}
