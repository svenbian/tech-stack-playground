import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { PressableScale } from './PressableScale';

interface CardProps extends ViewProps {
  onPress?: () => void;
  tint?: string;
  padded?: boolean;
}

/** Rounded surface with a soft shadow. Pass `onPress` to make it tappable. */
export function Card({ onPress, tint, padded = true, style, children, ...rest }: CardProps) {
  const t = useTheme();
  const cardStyle = [
    styles.card,
    padded && styles.padded,
    { backgroundColor: tint ?? t.surface, shadowColor: t.shadow, borderColor: t.border },
    style,
  ];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={cardStyle} scaleTo={0.985}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  padded: { padding: spacing.lg },
});
