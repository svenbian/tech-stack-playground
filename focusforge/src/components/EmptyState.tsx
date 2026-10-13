import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { Button } from './Button';
import { Card } from './Card';
import { Txt } from './Txt';

interface Props {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly empty state: explains what the section is for and offers the next step. */
export function EmptyState({ emoji, title, message, actionLabel, onAction }: Props) {
  const t = useTheme();
  return (
    <Card style={styles.card}>
      <View style={[styles.bubble, { backgroundColor: t.primarySoft }]}>
        <Txt style={{ fontSize: 30 }}>{emoji}</Txt>
      </View>
      <Txt variant="heading" center>
        {title}
      </Txt>
      <Txt tone="muted" center>
        {message}
      </Txt>
      {actionLabel ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  bubble: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
