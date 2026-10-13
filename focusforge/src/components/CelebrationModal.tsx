import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';

import { gemById } from '@/domain/gems';
import { useHaptics } from '@/hooks/useHaptics';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Button } from './Button';
import { Txt } from './Txt';

/** Global modal that celebrates newly unlocked gems, one at a time. */
export function CelebrationModal() {
  const t = useTheme();
  const queue = useFocusStore((s) => s.celebrationQueue);
  const dismiss = useFocusStore((s) => s.dismissCelebration);
  const { success } = useHaptics();
  const gem = queue.length ? gemById(queue[0]) : undefined;
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!gem) return;
    success();
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }).start();
  }, [gem, pop, success]);

  if (!gem) return null;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const rotate = pop.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: t.surface }]}>
          <Txt variant="caption" tone="primary" center>
            NEW GEM UNLOCKED
          </Txt>
          <Animated.View
            style={[styles.gem, { backgroundColor: gem.color + '33', borderColor: gem.color, transform: [{ scale }, { rotate }] }]}>
            <Animated.Text style={{ fontSize: 46, transform: [{ rotate: '-45deg' }] }}>{gem.emoji}</Animated.Text>
          </Animated.View>
          <Txt variant="title" center>
            {gem.name}
          </Txt>
          <Txt tone="muted" center>
            {gem.description}
          </Txt>
          <Txt tone="muted" center style={{ marginTop: spacing.xs }}>
            Beautiful work. This is what showing up looks like. 🌱
          </Txt>
          <Button title="Keep going" onPress={dismiss} style={{ alignSelf: 'stretch', marginTop: spacing.md }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,17,21,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sheet: { width: '100%', maxWidth: 380, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  gem: {
    width: 110,
    height: 110,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
});
