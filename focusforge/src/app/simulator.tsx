import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CloseButton } from '@/components/CloseButton';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, getApp } from '@/data/catalog';
import { getBlockState } from '@/domain/blocking';
import { formatDuration, toDateKey } from '@/domain/time';
import { useHaptics } from '@/hooks/useHaptics';
import { useNow } from '@/hooks/useNow';
import { blockingService } from '@/services/blocking';
import { useFocusStore } from '@/store/focusStore';
import { useBlockingContext } from '@/store/selectors';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * A pretend phone home screen. Tapping an app runs the same blocking resolver a
 * native shield would use: blocked apps show the mindful block screen, others
 * "open" so you can log simulated usage and watch daily limits kick in.
 */
export default function SimulatorScreen() {
  const t = useTheme();
  const now = useNow(1000);
  const ctx = useBlockingContext(now);
  const usage = useFocusStore((s) => s.usage);
  const recordUsage = useFocusStore((s) => s.recordUsage);
  const { tap } = useHaptics();
  const [openApp, setOpenApp] = useState<string | null>(null);
  const states = APP_CATALOG.map((app) => ({ app, state: getBlockState(app.id, ctx, now) }));
  const blockedCount = states.filter((s) => s.state.blocked).length;
  const current = openApp ? getApp(openApp) : undefined;
  const usedToday = current ? (usage[toDateKey(now)]?.[current.id] ?? 0) : 0;
  const currentState = current ? getBlockState(current.id, ctx, now) : undefined;

  const launch = (appId: string, blocked: boolean) => {
    tap();
    if (blocked) router.push({ pathname: '/blocked', params: { appId } });
    else setOpenApp(appId);
  };

  return (
    <Screen title="Try your shield" subtitle="Tap an app like you would on your phone." right={<CloseButton />}>
      <Card tint={t.primarySoft} style={styles.row}>
        <Icon name="shield-checkmark" size={22} color={t.primary} />
        <Txt variant="label" style={{ flex: 1 }}>
          {blockedCount} apps shielded right now via the {blockingService.name}.{' '}
          {blockedCount === 0 ? 'Start a session to see blocking in action.' : ''}
        </Txt>
      </Card>

      {current && !currentState?.blocked ? (
        <Card style={{ gap: spacing.md }}>
          <View style={styles.row}>
            <AppIcon app={current} size={44} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Using {current.name}</Txt>
              <Txt variant="label" tone="muted">
                {formatDuration(usedToday)} today. Add simulated time to test limits.
              </Txt>
            </View>
          </View>
          <View style={styles.row}>
            {[5, 15].map((m) => (
              <Button key={m} title={`+${m} min`} variant="secondary" onPress={() => recordUsage(current.id, m)} style={{ flex: 1 }} />
            ))}
            <Button title="Close" variant="ghost" onPress={() => setOpenApp(null)} />
          </View>
        </Card>
      ) : null}
      {current && currentState?.blocked ? (
        <Card tint={t.warningSoft} style={styles.row}>
          <Txt style={{ flex: 1 }}>{current.name} just hit its limit and is resting now. 🌙</Txt>
          <Button title="OK" variant="ghost" onPress={() => setOpenApp(null)} />
        </Card>
      ) : null}

      <View style={[styles.phone, { backgroundColor: t.surfaceMuted, borderColor: t.border }]}>
        {states.map(({ app, state }) => (
          <PressableScale key={app.id} onPress={() => launch(app.id, state.blocked)} style={styles.cell} accessibilityLabel={`${app.name}${state.blocked ? ', blocked' : ''}`}>
            <View>
              <AppIcon app={app} size={52} muted={state.blocked} />
              {state.blocked ? (
                <View style={[styles.lock, { backgroundColor: t.surface }]}>
                  <Icon name={state.reason === 'limit' ? 'hourglass' : 'lock-closed'} size={12} color={t.text} />
                </View>
              ) : null}
            </View>
            <Txt variant="caption" numberOfLines={1} tone={state.blocked ? 'subtle' : 'default'}>
              {app.name}
            </Txt>
          </PressableScale>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  phone: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.xl, borderWidth: 1, paddingVertical: spacing.lg, rowGap: spacing.lg },
  cell: { width: '25%', alignItems: 'center', gap: 6 },
  lock: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
