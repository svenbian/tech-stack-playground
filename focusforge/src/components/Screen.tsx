import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './Txt';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Standard page shell: safe area, background, large title, scrolling content, optional sticky footer. */
export function Screen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  edges = ['top'],
  footer,
  contentStyle,
}: ScreenProps) {
  const t = useTheme();
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Txt variant="title">{title}</Txt>
        {subtitle ? (
          <Txt tone="muted" style={{ marginTop: 4 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  ) : null;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: t.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // iOS: scroll content clear of the keyboard when a text field is focused.
          automaticallyAdjustKeyboardInsets>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>
          {header}
          {children}
        </View>
      )}
      {footer ? <View style={[styles.footer, { borderTopColor: t.border }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.md },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
