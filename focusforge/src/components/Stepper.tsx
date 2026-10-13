import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

/** − value + control for durations and times. */
export function Stepper({ value, onChange, step = 5, min = 0, max = Infinity, format = String }: Props) {
  const t = useTheme();
  const btn = (icon: string, next: number, disabled: boolean, label: string) => (
    <PressableScale
      onPress={() => onChange(Math.max(min, Math.min(max, next)))}
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.btn, { backgroundColor: t.surfaceMuted }]}>
      <Icon name={icon} size={20} color={t.text} />
    </PressableScale>
  );
  return (
    <View style={styles.row}>
      {btn('remove', value - step, value <= min, 'Decrease')}
      <Txt variant="heading" style={styles.value}>
        {format(value)}
      </Txt>
      {btn('add', value + step, value >= max, 'Increase')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 96, textAlign: 'center' },
});
