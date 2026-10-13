import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { GemBadge } from '@/components/GemBadge';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, CATEGORY_META } from '@/data/catalog';
import { GEMS } from '@/domain/gems';
import { computeStreaks, focusMinutesByDay } from '@/domain/stats';
import { formatDuration, fromDateKey, toDateKey, WEEKDAY_SHORT } from '@/domain/time';
import { useNow } from '@/hooks/useNow';
import { useFocusStore } from '@/store/focusStore';
import { useWeeklyReport } from '@/store/selectors';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Metric = 'focus' | 'screen';

export default function InsightsScreen() {
  const t = useTheme();
  const now = useNow(60_000);
  const report = useWeeklyReport(now);
  const [metric, setMetric] = useState<Metric>('focus');
  const sessions = useFocusStore((s) => s.sessions);
  const unlocked = useFocusStore((s) => s.unlockedGems);
  const blockLists = useFocusStore((s) => s.blockLists);
  const schedules = useFocusStore((s) => s.schedules);
  const limits = useFocusStore((s) => s.limits);
  const attempts = useFocusStore((s) => s.blockAttempts);

  const gemSnapshot = useMemo(() => {
    const byDay = focusMinutesByDay(sessions, now);
    const streaks = computeStreaks(byDay, now);
    return {
      sessions,
      totalFocusMinutes: Object.values(byDay).reduce((a, b) => a + b, 0),
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      blockLists,
      schedules,
      limits,
      totalBlockAttempts: Object.values(attempts).reduce((a, b) => a + b, 0),
    };
  }, [sessions, now, blockLists, schedules, limits, attempts]);
  const streak = gemSnapshot.currentStreak;

  const todayKey = toDateKey(now);
  const bars = report.days.map((d) => ({
    label: WEEKDAY_SHORT[fromDateKey(d.key).getDay()].slice(0, 2),
    value: metric === 'focus' ? d.focusMinutes : d.distractedMinutes,
    highlight: d.key === todayKey,
  }));
  const hasData = report.totalFocusMinutes > 0 || report.totalDistractedMinutes > 0;
  const maxCategory = Math.max(1, ...report.categories.map((c) => c.minutes));

  return (
    <Screen title="Insights" subtitle="Your week, gently summarized.">
      {!hasData ? (
        <EmptyState
          emoji="🌱"
          title="Your story starts here"
          message="Finish a focus session and your insights will start to grow. No pressure: one session is a great start."
          actionLabel="Start focusing"
          onAction={() => router.push('/session/new')}
        />
      ) : (
        <>
          <View style={styles.grid}>
            <Tile emoji="🌿" label="Focused" value={formatDuration(report.totalFocusMinutes)} tint={t.successSoft} />
            <Tile emoji="⏱️" label="Time saved" value={formatDuration(report.timeSavedMinutes)} tint={t.primarySoft} />
            <Tile emoji="🔥" label="Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} sub={`Best: ${report.longestStreak}`} tint={t.warningSoft} />
            <Tile emoji="✨" label="Avg. score" value={`${report.averageScore}`} sub={`${report.sessionsCompleted} sessions`} tint={t.difficulty.deep.soft} />
          </View>

          <Card style={{ gap: spacing.lg }}>
            <Segmented
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'focus', label: 'Focus time' },
                { value: 'screen', label: 'Other apps' },
              ]}
            />
            <BarChart bars={bars} color={metric === 'focus' ? t.success : t.primary} format={formatDuration} />
            <Txt variant="label" tone="muted" center>
              {metric === 'focus'
                ? `${formatDuration(report.totalFocusMinutes / 7)} focused per day on average`
                : `${formatDuration(report.totalDistractedMinutes / 7)} a day on other apps. You chose focus ${report.blockAttempts} times this week.`}
            </Txt>
          </Card>

          {report.topDistractions.length ? (
            <>
              <SectionHeader title="Top distractions" />
              <Card style={{ gap: spacing.md }}>
                {report.topDistractions.map(({ app, minutes }, i) => (
                  <View key={app.id} style={styles.row}>
                    <Txt variant="label" tone="subtle" style={{ width: 16 }}>
                      {i + 1}
                    </Txt>
                    <AppIcon app={app} size={34} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {app.name}
                    </Txt>
                    <Txt tone="muted">{formatDuration(minutes)}</Txt>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <SectionHeader title="By category" />
          <Card style={{ gap: spacing.md }}>
            {report.categories.map((c) => (
              <View key={c.category} style={{ gap: 6 }}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Txt variant="label">
                    {CATEGORY_META[c.category].emoji} {CATEGORY_META[c.category].label}
                  </Txt>
                  <Txt variant="label" tone="muted">
                    {formatDuration(c.minutes)}
                  </Txt>
                </View>
                <View style={[styles.bar, { backgroundColor: t.surfaceMuted }]}>
                  <View style={[styles.bar, { width: `${(c.minutes / maxCategory) * 100}%`, backgroundColor: t.primary, opacity: 0.7 }]} />
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionHeader title={`Gems · ${Object.keys(unlocked).length}/${GEMS.length}`} />
      <Card style={styles.gems}>
        {GEMS.map((g) => (
          <GemBadge key={g.id} gem={g} unlocked={!!unlocked[g.id]} progress={g.progress(gemSnapshot)} />
        ))}
      </Card>
      <Txt variant="caption" tone="subtle" center>
        Screen time here is simulated. On a device it comes from Screen Time / UsageStatsManager ({APP_CATALOG.length} sample apps).
      </Txt>
    </Screen>
  );
}

function Tile({ emoji, label, value, sub, tint }: { emoji: string; label: string; value: string; sub?: string; tint: string }) {
  return (
    <Card tint={tint} style={styles.tile}>
      <Txt style={{ fontSize: 20 }}>{emoji}</Txt>
      <Txt variant="heading">{value}</Txt>
      <Txt variant="caption" tone="muted">
        {label.toUpperCase()}
        {sub ? ` · ${sub}` : ''}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '47%', flexGrow: 1, gap: 4, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bar: { height: 6, borderRadius: 3 },
  gems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.xl, paddingVertical: spacing.xl },
});
