import { useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

/**
 * A Pressable that gently shrinks while pressed, for tactile, premium-feeling taps.
 * The style (including width/flex) goes on the Pressable itself, so it lays out
 * exactly like a View would.
 */
export function PressableScale({ style, scaleTo = 0.97, children, disabled, ...rest }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <AnimatedPressable
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      disabled={disabled}
      accessibilityRole="button"
      {...rest}
      style={[style, { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }]}>
      {children}
    </AnimatedPressable>
  );
}
