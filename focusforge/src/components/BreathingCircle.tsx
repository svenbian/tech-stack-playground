import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Txt } from './Txt';

/**
 * A 4-7-8-inspired breathing guide (inhale 4s, hold 4s, exhale 6s), slowed a
 * little to feel comfortable. The circle grows and shrinks with the breath.
 */
const PHASES = [
  { label: 'Breathe in', ms: 4000, to: 1 },
  { label: 'Hold', ms: 4000, to: 1 },
  { label: 'Breathe out', ms: 6000, to: 0 },
] as const;

export function BreathingCircle({ color, size = 200 }: { color: string; size?: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const run = () => {
      if (cancelled) return;
      const p = PHASES[i % PHASES.length];
      setPhase(i % PHASES.length);
      Animated.timing(progress, {
        toValue: p.to,
        duration: p.ms,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        i++;
        run();
      });
    };
    run();
    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const haloScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.12, transform: [{ scale: haloScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.28, transform: [{ scale }] },
        ]}
      />
      <Txt variant="bodyStrong" color={color} accessibilityLiveRegion="polite">
        {PHASES[phase].label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({ circle: { position: 'absolute' } });
