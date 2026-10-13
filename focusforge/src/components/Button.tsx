import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Overrides the primary colour (e.g. difficulty tint). */
  color?: string;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  color,
  size = 'md',
  style,
}: ButtonProps) {
  const t = useTheme();
  const main = color ?? (variant === 'danger' ? t.danger : t.primary);
  const bg =
    variant === 'primary' || variant === 'danger' ? main : variant === 'secondary' ? t.surfaceMuted : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? t.onPrimary : variant === 'secondary' ? t.text : main;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      style={[styles.base, size === 'lg' && styles.lg, { backgroundColor: bg }, style]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Txt variant="bodyStrong" color={fg}>
            {title}
          </Txt>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: { minHeight: 58 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
