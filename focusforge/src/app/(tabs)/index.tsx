import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { DifficultyBadge } from '@/components/DifficultyPicker';
import { Icon } from '@/components/Icon';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, getApp } from '@/data/catalog';
import { ENCOURAGEMENTS, pickDaily } from '@/data/quotes';
import { limitProgress, resolveBlockedAppIds } from '@/domain/blocking';
import { GEMS } from '@/domain/gems';
import { activeWindow, nextStart } from '@/domain/schedule';
import { DURATION_PRESETS_MIN, isOnBreak, remainingMs, sessionProgress } from '@/domain/session';
import { scoreLabel } from '@/domain/stats';
import { formatClock, formatDuration, formatTimeOfDay, toDateKey } from '@/domain/time';
import { useNow } from '@/hooks/useNow';
import { useFocusStore } from '@/store/focusStore';
import { useActiveSession, useTodaySummary } from '@/store/selectors';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const t = useTheme();
  const now = useNow(1000);
  const name = useFocusStore((s) => s.settings.name);
  const today = useTodaySummary(now);
  const session = useActiveSession();

  return (
    <Screen
      title={`${greeting(now)}${name ? `, ${name}` : ''}`}
      subtitle={pickDaily(ENCOURAGEMENTS, now)}
      right={
        <View style={[styles.streak, { backgroundColor: t.warningSoft }]} accessibilityLabel={`${today.streak.current} day streak`}>
          <Txt style={{ fontSize: 16 }}>🔥</Txt>
          <Txt variant="bodyStrong" tone="warning">
            {today.streak.current}
          </Txt>
        </View>
      }>
      {session ? <ActiveSessionCard now={now} /> : <ScheduleStatusCard now={now} />}

      <Card style={styles.scoreCard}>
        <ProgressRing size={124} strokeWidth={12} progress={today.score / 100} color={t.primary}>
          <Txt variant="title">{today.score}</Txt>
          <Txt variant="caption" tone="muted">
            FOCUS SCORE
          </Txt>
        </ProgressRing>
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Txt variant="heading">{scoreLabel(today.score)}</Txt>
          <Stat icon="leaf" color={t.success} label="Focused" value={`${formatDuration(today.focusMinutes)} / ${formatDuration(today.goalMinutes)}`} />
          <Stat icon="phone-portrait-outline" color={t.textMuted} label="Other apps" value={formatDuration(today.distractedMinutes)} />
          <Stat icon="shield-checkmark-outline" color={t.primary} label="Mindful pauses" value={`${today.blockAttempts}`} />
        </View>
      </Card>

      {!session ? (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="heading">Start a focus session</Txt>
          <View style={styles.chips}>
            {DURATION_PRESETS_MIN.map((m) => (
              <Chip key={m} label={`${m} min`} onPress={() => router.push({ pathname: '/session/new', params: { minutes: m } })} />
            ))}
            <Chip label="Custom" icon="options-outline" onPress={() => router.push('/session/new')} />
          </View>
          <Button title="Focus now" icon="play" size="lg" onPress={() => router.push('/session/new')} />
        </Card>
      ) : null}

      <LimitsSection now={now} />
      <NextGemCard />

      <Card onPress={() => router.push('/simulator')} style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: t.primarySoft }]}>
          <Icon name="phone-portrait" size={22} color={t.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">Try your shield</Txt>
          <Txt variant="label" tone="muted">
            Open apps on a pretend phone to see blocking in action.
          </Txt>
        </View>
        <Icon name="chevron-forward" size={18} color={t.textSubtle} />
      </Card>
    </Screen>
  );
}

function Stat({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={16} color={color} />
      <Txt variant="label" tone="muted" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="label">{value}</Txt>
    </View>
  );
}

function ActiveSessionCard({ now }: { now: number }) {
  const t = useTheme();
  const session = useActiveSession()!;
  const blockLists = useFocusStore((s) => s.blockLists);
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const onBreak = isOnBreak(session, now);
  const c = t.difficulty[session.difficulty];
  const blockedCount = resolveBlockedAppIds(session.blockListIds, blockLists, APP_CATALOG, allowlist).size;

  return (
    <Card tint={c.soft} onPress={() => router.push('/session/active')} style={styles.row}>
      <ProgressRing size={76} strokeWidth={8} progress={sessionProgress(session, now)} color={c.main} trackColor={t.surface}>
        <Icon name={onBreak ? 'cafe' : 'leaf'} size={24} color={c.main} />
      </ProgressRing>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="caption" color={c.main}>
          {onBreak ? 'ON A BREAK' : 'FOCUSING NOW'}
        </Txt>
        <Txt variant="title">{formatClock(remainingMs(session, now))}</Txt>
        <Txt variant="label" tone="muted">
          {session.label} · {blockedCount} apps paused
        </Txt>
      </View>
      <Icon name="chevron-forward" size={18} color={c.main} />
    </Card>
  );
}

function ScheduleStatusCard({ now }: { now: number }) {
  const t = useTheme();
  const schedules = useFocusStore((s) => s.schedules);
  const active = schedules.find((s) => activeWindow(s, now));
  const minute = Math.floor(now / 60_000); // recompute "up next" once a minute, not every second
  const upcoming = useMemo(
    () =>
      schedules
        .map((s) => ({ s, at: nextStart(s, minute * 60_000) }))
        .filter((x): x is { s: (typeof schedules)[number]; at: number } => x.at !== null)
        .sort((a, b) => a.at - b.at)[0],
    [schedules, minute],
  );

  if (active) {
    const window = activeWindow(active, now)!;
    return (
      <Card tint={t.difficulty[active.difficulty].soft} onPress={() => router.push({ pathname: '/schedule/[id]', params: { id: active.id } })} style={styles.row}>
        <Txt style={{ fontSize: 30 }}>{active.emoji}</Txt>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="caption" color={t.difficulty[active.difficulty].main}>
            SCHEDULE ACTIVE
          </Txt>
          <Txt variant="bodyStrong">{active.name}</Txt>
          <Txt variant="label" tone="muted">
            Until {formatTimeOfDay(window.end)}
          </Txt>
        </View>
        <DifficultyBadge difficulty={active.difficulty} />
      </Card>
    );
  }
  if (!upcoming) {
    return (
      <Card onPress={() => router.push({ pathname: '/schedule/[id]', params: { id: 'new' } })} style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: t.successSoft }]}>
          <Icon name="calendar-outline" size={22} color={t.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">Make focus automatic</Txt>
          <Txt variant="label" tone="muted">
            Add a schedule, like Deep Work mornings or a calm bedtime.
          </Txt>
        </View>
        <Icon name="add" size={22} color={t.success} />
      </Card>
    );
  }
  const sameDay = toDateKey(upcoming.at) === toDateKey(now);
  return (
    <Card style={styles.row}>
      <Txt style={{ fontSize: 30 }}>{upcoming.s.emoji}</Txt>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="caption" tone="muted">
          UP NEXT
        </Txt>
        <Txt variant="bodyStrong">{upcoming.s.name}</Txt>
        <Txt variant="label" tone="muted">
          {sameDay ? 'Today' : new Date(upcoming.at).toLocaleDateString(undefined, { weekday: 'long' })} at {formatTimeOfDay(upcoming.at)}
        </Txt>
      </View>
      <DifficultyBadge difficulty={upcoming.s.difficulty} />
    </Card>
  );
}

function LimitsSection({ now }: { now: number }) {
  const t = useTheme();
  const limits = useFocusStore((s) => s.limits);
  const usage = useFocusStore((s) => s.usage);
  const usageToday = usage[toDateKey(now)] ?? {};
  const enabled = limits.filter((l) => l.enabled);
  if (enabled.length === 0) return null;

  return (
    <>
      <SectionHeader title="Daily limits" action="Manage" onAction={() => router.push({ pathname: '/blocks', params: { tab: 'limits' } })} />
      <Card style={{ gap: spacing.md }}>
        {enabled.map((l) => {
          const app = getApp(l.appId);
          if (!app) return null;
          const p = limitProgress(l, usageToday);
          const barColor = p.reached ? t.textSubtle : p.ratio > 0.8 ? t.warning : t.success;
          return (
            <View key={l.id} style={styles.row}>
              <AppIcon app={app} size={34} muted={p.reached} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Txt variant="label">{app.name}</Txt>
                  <Txt variant="caption" tone="muted">
                    {p.reached ? 'Resting until tomorrow' : `${formatDuration(p.remainingMinutes)} left`}
                  </Txt>
                </View>
                <View style={[styles.bar, { backgroundColor: t.surfaceMuted }]}>
                  <View style={[styles.bar, { width: `${p.ratio * 100}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function NextGemCard() {
  const t = useTheme();
  const unlocked = useFocusStore((s) => s.unlockedGems);
  const count = Object.keys(unlocked).length;
  const next = GEMS.find((g) => !unlocked[g.id]);
  return (
    <Card onPress={() => router.push('/insights')} style={styles.row}>
      <View style={[styles.iconBubble, { backgroundColor: t.primarySoft }]}>
        <Txt style={{ fontSize: 22 }}>{next ? next.emoji : '🏆'}</Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{count} of {GEMS.length} gems collected</Txt>
        <Txt variant="label" tone="muted">
          {next ? `Next: ${next.name}. ${next.description}` : 'You’ve collected them all. Incredible.'}
        </Txt>
      </View>
      <Icon name="chevron-forward" size={18} color={t.textSubtle} />
    </Card>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconBubble: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3 },
});
