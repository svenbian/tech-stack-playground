import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { BreathingCircle } from '@/components/BreathingCircle';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { getApp } from '@/data/catalog';
import { GENTLE_MESSAGES, MINDFUL_QUOTES, pickRandom } from '@/data/quotes';
import { getBlockState } from '@/domain/blocking';
import { formatTimeOfDay } from '@/domain/time';
import type { BlockState } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { useFocusStore } from '@/store/focusStore';
import { useBlockingContext } from '@/store/selectors';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * The mindful block screen. On iOS the real equivalent is a ShieldConfiguration
 * extension; on Android it's an overlay launched by the AccessibilityService.
 * Both would deep-link here (focusforge://blocked?appId=…) for the full experience.
 */
export default function BlockedScreen() {
  const t = useTheme();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const app = getApp(appId ?? '');
  const now = useNow(1000);
  const ctx = useBlockingContext(now);
  const state = app ? getBlockState(app.id, ctx, now) : { blocked: false };
  const recordBlockAttempt = useFocusStore((s) => s.recordBlockAttempt);
  const [quote] = useState(() => pickRandom(MINDFUL_QUOTES));
  const [message] = useState(() => pickRandom(GENTLE_MESSAGES));

  // Each shield view counts as a mindful pause (feeds the "Calm Resolve" gem).
  useEffect(() => {
    recordBlockAttempt();
  }, [recordBlockAttempt]);

  const accent = state.difficulty ? t.difficulty[state.difficulty].main : t.primary;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ alignItems: 'center', paddingTop: spacing.xxl }}>
      {app ? <AppIcon app={app} size={64} muted /> : null}
      <Txt variant="title" center>
        {app ? `${app.name} is resting` : 'This app is resting'}
      </Txt>
      <Txt tone="muted" center>
        {reasonText(state)}
      </Txt>

      <View style={{ marginVertical: spacing.lg }}>
        <BreathingCircle color={accent} size={200} />
      </View>

      <Txt variant="bodyStrong" center style={{ maxWidth: 320 }}>
        {message}
      </Txt>
      <View style={[styles.quote, { borderColor: t.border }]}>
        <Txt tone="muted" center style={{ fontStyle: 'italic' }}>
          “{quote.text}”
        </Txt>
        {quote.author ? (
          <Txt variant="caption" tone="subtle" center>
            {quote.author}
          </Txt>
        ) : null}
      </View>

      <Button title="Close app" icon="checkmark" size="lg" color={accent} onPress={leave} style={{ alignSelf: 'stretch' }} />
      {state.reason === 'session' && state.difficulty !== 'deep' ? (
        <Button
          title="I need a break"
          variant="ghost"
          color={t.textMuted}
          onPress={() => router.replace('/session/active')}
        />
      ) : null}
      {state.difficulty === 'deep' ? (
        <Txt variant="caption" tone="subtle" center>
          Deep Focus: no exceptions until the timer ends. You’ve got this.
        </Txt>
      ) : null}
    </Screen>
  );
}

function reasonText(state: BlockState): string {
  switch (state.reason) {
    case 'session':
      return `You’re in “${state.sourceLabel}” until ${formatTimeOfDay(state.until!)}.`;
    case 'schedule':
      return `${state.sourceLabel} is on until ${formatTimeOfDay(state.until!)}.`;
    case 'limit':
      return `You’ve used today’s ${state.sourceLabel?.replace(' daily limit', '')}. It’ll be back tomorrow.`;
    default:
      return 'It’s not blocked right now, but taking a pause is never a bad idea.';
  }
}

const styles = StyleSheet.create({
  quote: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.lg, gap: spacing.xs, alignSelf: 'stretch', marginVertical: spacing.sm },
});
