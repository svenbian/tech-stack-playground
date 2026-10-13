import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DifficultyBadge } from '@/components/DifficultyPicker';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, CATEGORY_META, getApp } from '@/data/catalog';
import { limitProgress, resolveBlockedAppIds } from '@/domain/blocking';
import { formatScheduleDays, formatScheduleTime, isScheduleActive } from '@/domain/schedule';
import { formatDuration, toDateKey } from '@/domain/time';
import { useNow } from '@/hooks/useNow';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Tab = 'lists' | 'schedules' | 'limits';

export default function BlocksScreen() {
  // The selected tab lives in the URL (?tab=limits), so other screens can deep-link to it.
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const tab: Tab = params.tab ?? 'lists';
  const setTab = (next: Tab) => router.setParams({ tab: next });

  return (
    <Screen title="Blocks" subtitle="Decide what rests, and when.">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'lists', label: 'Block lists' },
          { value: 'schedules', label: 'Schedules' },
          { value: 'limits', label: 'Limits' },
        ]}
      />
      {tab === 'lists' ? <ListsTab /> : tab === 'schedules' ? <SchedulesTab /> : <LimitsTab />}
    </Screen>
  );
}

function ListsTab() {
  const t = useTheme();
  const lists = useFocusStore((s) => s.blockLists);
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const create = () => router.push({ pathname: '/blocklist/[id]', params: { id: 'new' } });

  if (lists.length === 0) {
    return (
      <EmptyState
        emoji="🧺"
        title="No block lists yet"
        message="Group the apps that pull you away, like Social Media or Games, and reuse them in any session or schedule."
        actionLabel="Create a block list"
        onAction={create}
      />
    );
  }
  return (
    <>
      {lists.map((l) => {
        const ids = [...resolveBlockedAppIds([l.id], lists, APP_CATALOG, allowlist)];
        return (
          <Card key={l.id} onPress={() => router.push({ pathname: '/blocklist/[id]', params: { id: l.id } })} style={{ gap: spacing.md }}>
            <View style={styles.row}>
              <View style={[styles.emoji, { backgroundColor: t.primarySoft }]}>
                <Txt style={{ fontSize: 22 }}>{l.emoji}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{l.name}</Txt>
                <Txt variant="label" tone="muted" numberOfLines={1}>
                  {[...l.categories.map((c) => CATEGORY_META[c].label), l.appIds.length ? `${l.appIds.length} picked apps` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Empty list'}
                </Txt>
              </View>
              <Txt variant="label" tone="muted">
                {ids.length} apps
              </Txt>
            </View>
            <View style={styles.icons}>
              {ids.slice(0, 9).map((id) => {
                const app = getApp(id);
                return app ? <AppIcon key={id} app={app} size={28} /> : null;
              })}
            </View>
          </Card>
        );
      })}
      <Button title="New block list" icon="add" variant="secondary" onPress={create} />
    </>
  );
}

function SchedulesTab() {
  const t = useTheme();
  const now = useNow(30_000);
  const schedules = useFocusStore((s) => s.schedules);
  const toggle = useFocusStore((s) => s.toggleSchedule);
  const create = () => router.push({ pathname: '/schedule/[id]', params: { id: 'new' } });

  if (schedules.length === 0) {
    return (
      <EmptyState
        emoji="🗓️"
        title="Focus on autopilot"
        message="Schedules turn on blocking at the same time each day, like Work 9–5 or Sleep 11pm–7am. No willpower needed."
        actionLabel="Create a schedule"
        onAction={create}
      />
    );
  }
  return (
    <>
      {schedules.map((s) => {
        const active = isScheduleActive(s, now);
        return (
          <Card key={s.id} onPress={() => router.push({ pathname: '/schedule/[id]', params: { id: s.id } })} style={styles.row}>
            <View style={[styles.emoji, { backgroundColor: t.difficulty[s.difficulty].soft }]}>
              <Txt style={{ fontSize: 22 }}>{s.emoji}</Txt>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.row}>
                <Txt variant="bodyStrong" style={{ flexShrink: 1 }}>
                  {s.name}
                </Txt>
                {active ? (
                  <View style={[styles.live, { backgroundColor: t.successSoft }]}>
                    <Txt variant="caption" tone="success">
                      ACTIVE
                    </Txt>
                  </View>
                ) : null}
              </View>
              <Txt variant="label" tone="muted">
                {formatScheduleTime(s)}
              </Txt>
              <View style={styles.row}>
                <Txt variant="caption" tone="subtle">
                  {formatScheduleDays(s.days)}
                </Txt>
                <DifficultyBadge difficulty={s.difficulty} />
              </View>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={(v) => toggle(s.id, v)}
              trackColor={{ true: t.primary, false: t.surfaceMuted }}
              thumbColor="#FFFFFF"
              accessibilityLabel={`${s.name} enabled`}
            />
          </Card>
        );
      })}
      <Button title="New schedule" icon="add" variant="secondary" onPress={create} />
    </>
  );
}

function LimitsTab() {
  const t = useTheme();
  const now = useNow(30_000);
  const limits = useFocusStore((s) => s.limits);
  const usage = useFocusStore((s) => s.usage);
  const toggle = useFocusStore((s) => s.toggleLimit);
  const usageToday = usage[toDateKey(now)] ?? {};
  const create = () => router.push({ pathname: '/limit/[id]', params: { id: 'new' } });

  if (limits.length === 0) {
    return (
      <EmptyState
        emoji="⏳"
        title="Gentle daily limits"
        message="Give an app a daily allowance, like Instagram for 30 minutes. When it’s used up, the app rests until midnight."
        actionLabel="Add a limit"
        onAction={create}
      />
    );
  }
  return (
    <>
      {limits.map((l) => {
        const app = getApp(l.appId);
        if (!app) return null;
        const p = limitProgress(l, usageToday);
        return (
          <Card key={l.id} onPress={() => router.push({ pathname: '/limit/[id]', params: { id: l.id } })} style={{ gap: spacing.md }}>
            <View style={styles.row}>
              <AppIcon app={app} size={40} muted={!l.enabled} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{app.name}</Txt>
                <Txt variant="label" tone="muted">
                  {formatDuration(p.usedMinutes)} of {formatDuration(l.dailyLimitMinutes)} today
                </Txt>
              </View>
              <Switch
                value={l.enabled}
                onValueChange={(v) => toggle(l.id, v)}
                trackColor={{ true: t.primary, false: t.surfaceMuted }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`${app.name} limit enabled`}
              />
            </View>
            <View style={[styles.bar, { backgroundColor: t.surfaceMuted }]}>
              <View
                style={[styles.bar, { width: `${p.ratio * 100}%`, backgroundColor: p.reached ? t.textSubtle : p.ratio > 0.8 ? t.warning : t.success }]}
              />
            </View>
          </Card>
        );
      })}
      <Button title="Add a limit" icon="add" variant="secondary" onPress={create} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  live: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  bar: { height: 6, borderRadius: 3 },
});
