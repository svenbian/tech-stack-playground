import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useFocusStore } from '@/store/focusStore';

/** Soft haptic feedback that respects the user's setting (no-op on web). */
export function useHaptics() {
  const enabled = useFocusStore((s) => s.settings.haptics);
  const active = enabled && Platform.OS !== 'web';

  const tap = useCallback(() => {
    if (active) Haptics.selectionAsync().catch(() => {});
  }, [active]);
  const success = useCallback(() => {
    if (active) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [active]);
  const warn = useCallback(() => {
    if (active) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [active]);

  return { tap, success, warn };
}
