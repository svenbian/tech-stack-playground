import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
}

/** Selectable pill. Used for presets, categories and day pickers. */
export function Chip({ label, selected, onPress, icon, color }: ChipProps) {
  const t = useTheme();
  const accent = color ?? t.primary;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : t.surface,
          borderColor: selected ? accent : t.border,
        },
      ]}>
      {icon ? <Icon name={icon} size={16} color={selected ? t.onPrimary : t.textMuted} /> : null}
      <Txt variant="label" color={selected ? t.onPrimary : t.text}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
