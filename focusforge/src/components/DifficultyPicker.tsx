import { StyleSheet, View } from 'react-native';

import { DIFFICULTY_RULES } from '@/domain/session';
import type { Difficulty } from '@/domain/types';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

const ICONS: Record<Difficulty, string> = { easy: 'leaf-outline', medium: 'hourglass-outline', deep: 'lock-closed-outline' };
const ORDER: Difficulty[] = ['easy', 'medium', 'deep'];

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {ORDER.map((d) => {
        const selected = d === value;
        const c = t.difficulty[d];
        return (
          <PressableScale
            key={d}
            onPress={() => onChange(d)}
            accessibilityState={{ selected }}
            style={[styles.option, { borderColor: selected ? c.main : t.border, backgroundColor: selected ? c.soft : t.surface }]}>
            <View style={[styles.icon, { backgroundColor: c.soft }]}>
              <Icon name={ICONS[d]} size={20} color={c.main} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{DIFFICULTY_RULES[d].label}</Txt>
              <Txt variant="label" tone="muted">
                {DIFFICULTY_RULES[d].tagline}
              </Txt>
            </View>
            <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? c.main : t.textSubtle} />
          </PressableScale>
        );
      })}
    </View>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const t = useTheme();
  const c = t.difficulty[difficulty];
  return (
    <View style={[styles.badge, { backgroundColor: c.soft }]}>
      <Icon name={ICONS[difficulty]} size={12} color={c.main} />
      <Txt variant="caption" color={c.main}>
        {DIFFICULTY_RULES[difficulty].label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
});
