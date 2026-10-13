import { Text, type TextProps } from 'react-native';

import { type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Variant = keyof typeof type;
type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger' | 'inverse';

export interface TxtProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  color?: string;
  center?: boolean;
}

/** Themed text with a small type scale. */
export function Txt({ variant = 'body', tone = 'default', color, center, style, ...rest }: TxtProps) {
  const t = useTheme();
  const tones: Record<Tone, string> = {
    default: t.text,
    muted: t.textMuted,
    subtle: t.textSubtle,
    primary: t.primary,
    success: t.success,
    warning: t.warning,
    danger: t.danger,
    inverse: t.onPrimary,
  };
  return (
    <Text
      style={[type[variant], { color: color ?? tones[tone] }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
