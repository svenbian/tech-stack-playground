import { useColorScheme } from 'react-native';

import { useFocusStore } from '@/store/focusStore';
import { darkPalette, lightPalette, type Palette } from './tokens';

export function useIsDark(): boolean {
  const system = useColorScheme();
  const pref = useFocusStore((s) => s.settings.theme);
  return pref === 'system' ? system === 'dark' : pref === 'dark';
}

export function useTheme(): Palette {
  return useIsDark() ? darkPalette : lightPalette;
}
