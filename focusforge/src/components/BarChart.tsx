import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';
import { Txt } from './Txt';

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Lightweight vertical bar chart built from Views (no chart library needed). */
export function BarChart({ bars, height = 140, color, format }: { bars: Bar[]; height?: number; color?: string; format?: (v: number) => string }) {
  const t = useTheme();
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel={bars.map((b) => `${b.label} ${format ? format(b.value) : b.value}`).join(', ')}>
      {bars.map((b, i) => (
        <View key={`${b.label}-${i}`} style={styles.col}>
          <View style={[styles.track, { height, backgroundColor: t.surfaceMuted }]}>
            <View
              style={[
                styles.fill,
                {
                  height: Math.max(4, (b.value / max) * height),
                  backgroundColor: color ?? t.primary,
                  opacity: b.highlight ? 1 : 0.55,
                },
              ]}
            />
          </View>
          <Txt variant="caption" tone={b.highlight ? 'default' : 'subtle'}>
            {b.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  track: { width: '100%', borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 10 },
});
