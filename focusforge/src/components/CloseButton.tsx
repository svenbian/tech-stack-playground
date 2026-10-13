import { router } from 'expo-router';

import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

/** Round "×" used at the top-right of modal screens. */
export function CloseButton({ onPress }: { onPress?: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      accessibilityLabel="Close"
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="close" size={20} color={t.textMuted} />
    </PressableScale>
  );
}
