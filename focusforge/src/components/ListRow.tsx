import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  icon?: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  checked?: boolean;
  last?: boolean;
}

/** Settings-style row: icon, title/subtitle, then a value, chevron, switch or checkmark. */
export function ListRow({ title, subtitle, left, icon, value, onPress, toggle, checked, last }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={toggle ? () => toggle.onChange(!toggle.value) : onPress}
      disabled={!onPress && !toggle}
      accessibilityRole={toggle ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={toggle ? { checked: toggle.value } : checked !== undefined ? { selected: checked } : undefined}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { opacity: 0.6 },
      ]}>
      {left ??
        (icon ? (
          <View style={[styles.iconWrap, { backgroundColor: t.primarySoft }]}>
            <Icon name={icon} size={18} color={t.primary} />
          </View>
        ) : null)}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {subtitle ? (
          <Txt variant="label" tone="muted" style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? <Txt tone="muted">{value}</Txt> : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: t.primary, false: t.surfaceMuted }}
          thumbColor="#FFFFFF"
        />
      ) : null}
      {checked !== undefined ? (
        <Icon name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={checked ? t.primary : t.textSubtle} />
      ) : null}
      {onPress && !toggle && checked === undefined ? <Icon name="chevron-forward" size={18} color={t.textSubtle} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
