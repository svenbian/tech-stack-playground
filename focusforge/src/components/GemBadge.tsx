import { StyleSheet, View } from 'react-native';

import type { GemDefinition } from '@/domain/gems';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './Txt';

/** A gem: glowing when unlocked, a soft outline with progress when still ahead. */
export function GemBadge({ gem, unlocked, progress }: { gem: GemDefinition; unlocked: boolean; progress: number }) {
  const t = useTheme();
  return (
    <View style={styles.wrap} accessibilityLabel={`${gem.name}. ${unlocked ? 'Unlocked' : `${Math.round(progress * 100)} percent`}. ${gem.description}`}>
      <View
        style={[
          styles.gem,
          unlocked
            ? { backgroundColor: gem.color + '33', borderColor: gem.color }
            : { backgroundColor: t.surfaceMuted, borderColor: t.border },
        ]}>
        <Txt style={{ fontSize: 28, opacity: unlocked ? 1 : 0.35, transform: [{ rotate: '-45deg' }] }}>{gem.emoji}</Txt>
      </View>
      <Txt variant="caption" center numberOfLines={1} tone={unlocked ? 'default' : 'subtle'}>
        {gem.name}
      </Txt>
      {!unlocked ? (
        <View style={[styles.bar, { backgroundColor: t.surfaceMuted }]}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: gem.color }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '30%', alignItems: 'center', gap: 6 },
  gem: { width: 64, height: 64, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  bar: { width: 56, height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});
