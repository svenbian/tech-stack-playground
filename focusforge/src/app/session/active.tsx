import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { BreathingCircle } from '@/components/BreathingCircle';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { DifficultyBadge } from '@/components/DifficultyPicker';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, getApp } from '@/data/catalog';
import { ENCOURAGEMENTS, pickDaily } from '@/data/quotes';
import { resolveBlockedAppIds } from '@/domain/blocking';
import {
  BREAK_PRESETS_MIN,
  breaksRemaining,
  canEndEarly,
  canTakeBreak,
  currentBreak,
  DIFFICULTY_RULES,
  focusedMs,
  remainingMs,
  sessionEndsAt,
  sessionProgress,
} from '@/domain/session';
import { formatClock, formatDuration, formatTimeOfDay, MINUTE } from '@/domain/time';
import type { FocusSession } from '@/domain/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useNow } from '@/hooks/useNow';
import { useFocusStore } from '@/store/focusStore';
import { useActiveSession } from '@/store/selectors';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Pending = { kind: 'end' } | { kind: 'break'; minutes: number } | null;

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function ActiveSessionScreen() {
  const now = useNow(1000);
  const session = useActiveSession();
  // Remember which session we were showing, so we can celebrate it once it completes.
  const [shownId] = useState(() => useFocusStore.getState().activeSessionId);
  const finished = useFocusStore((s) => s.sessions.find((x) => x.id === shownId));

  if (!session) {
    return finished ? <SessionSummary session={finished} /> : <NoSession />;
  }
  return <RunningSession session={session} now={now} />;
}

function RunningSession({ session, now }: { session: FocusSession; now: number }) {
  const t = useTheme();
  const c = t.difficulty[session.difficulty];
  const blockLists = useFocusStore((s) => s.blockLists);
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const resumeFromBreak = useFocusStore((s) => s.resumeFromBreak);
  const [pending, setPending] = useState<Pending>(null);
  const brk = currentBreak(session, now);
  const blocked = [...resolveBlockedAppIds(session.blockListIds, blockLists, APP_CATALOG, allowlist)];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <PressableScale onPress={close} accessibilityLabel="Minimize" style={[styles.roundBtn, { backgroundColor: t.surfaceMuted }]}>
          <Icon name="chevron-down" size={22} color={t.textMuted} />
        </PressableScale>
        <DifficultyBadge difficulty={session.difficulty} />
      </View>

      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Txt variant="caption" color={c.main}>
          {brk ? 'ON A BREAK' : 'FOCUSING'}
        </Txt>
        <Txt variant="title" center>
          {session.label}
        </Txt>
      </View>

      <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
        {brk ? (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <BreathingCircle color={c.main} size={230} />
            <Txt variant="display">{formatClock(brk.startedAt + brk.durationMs - now)}</Txt>
            <Txt tone="muted" center>
              Enjoy your break. Blocking resumes automatically. Your focus time is paused, not lost.
            </Txt>
          </View>
        ) : (
          <ProgressRing size={270} strokeWidth={16} progress={sessionProgress(session, now)} color={c.main}>
            <Txt variant="display">{formatClock(remainingMs(session, now))}</Txt>
            <Txt tone="muted">ends {formatTimeOfDay(sessionEndsAt(session, now))}</Txt>
          </ProgressRing>
        )}
      </View>

      {brk ? (
        <Button title="Resume focus now" icon="leaf" color={c.main} size="lg" onPress={resumeFromBreak} />
      ) : pending ? (
        <FrictionPanel session={session} now={now} pending={pending} onCancel={() => setPending(null)} />
      ) : (
        <Controls session={session} now={now} onRequest={setPending} />
      )}

      {!brk ? (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="label" tone="muted">
            {blocked.length} apps are resting · {pickDaily(ENCOURAGEMENTS, now, 1)}
          </Txt>
          <View style={styles.iconRow}>
            {blocked.slice(0, 8).map((id) => {
              const app = getApp(id);
              return app ? <AppIcon key={id} app={app} size={30} muted /> : null;
            })}
            {blocked.length > 8 ? <Txt variant="label" tone="subtle">+{blocked.length - 8}</Txt> : null}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function Controls({ session, now, onRequest }: { session: FocusSession; now: number; onRequest: (p: Pending) => void }) {
  const t = useTheme();
  const [showBreaks, setShowBreaks] = useState(false);
  const breakCheck = canTakeBreak(session, now);
  const endCheck = canEndEarly(session);
  const left = breaksRemaining(session);

  if (session.difficulty === 'deep') {
    return (
      <Card tint={t.difficulty.deep.soft} style={[styles.row, { gap: spacing.md }]}>
        <Icon name="lock-closed" size={22} color={t.difficulty.deep.main} />
        <Txt style={{ flex: 1 }} tone="muted">
          Deep Focus is locked until the timer ends. You chose this for future you. Breathe, and keep going.
        </Txt>
      </Card>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {showBreaks && breakCheck.allowed ? (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="bodyStrong">How long a break?</Txt>
          <View style={styles.row}>
            {BREAK_PRESETS_MIN.map((m) => (
              <Chip key={m} label={`${m} min`} icon="cafe-outline" onPress={() => onRequest({ kind: 'break', minutes: m })} />
            ))}
            <View style={{ flex: 1 }} />
            <Button title="Cancel" variant="ghost" onPress={() => setShowBreaks(false)} />
          </View>
        </Card>
      ) : null}
      <View style={styles.row}>
        <Button
          title={left === null ? 'Take a break' : `Break · ${left} left`}
          icon="cafe-outline"
          variant="secondary"
          disabled={!breakCheck.allowed}
          onPress={() => setShowBreaks((v) => !v)}
          style={{ flex: 1 }}
        />
        <Button
          title="End early"
          icon="stop-circle-outline"
          variant="ghost"
          color={t.textMuted}
          disabled={!endCheck.allowed}
          onPress={() => onRequest({ kind: 'end' })}
          style={{ flex: 1 }}
        />
      </View>
      {!breakCheck.allowed ? (
        <Txt variant="caption" tone="subtle" center>
          {breakCheck.reason}
        </Txt>
      ) : null}
    </View>
  );
}

/**
 * Mindful friction: a short countdown before ending early or taking a break.
 * The point isn't to trap anyone. It's a moment to check in with intention.
 */
function FrictionPanel({
  session,
  now,
  pending,
  onCancel,
}: {
  session: FocusSession;
  now: number;
  pending: NonNullable<Pending>;
  onCancel: () => void;
}) {
  const t = useTheme();
  const rules = DIFFICULTY_RULES[session.difficulty];
  const delay = pending.kind === 'end' ? rules.endEarlyDelaySeconds : rules.breakDelaySeconds;
  const [left, setLeft] = useState(delay);
  const endSessionEarly = useFocusStore((s) => s.endSessionEarly);
  const takeBreak = useFocusStore((s) => s.takeBreak);
  const { warn, tap } = useHaptics();

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const focusedMin = Math.round(focusedMs(session, now) / MINUTE);
  const confirm = () => {
    if (pending.kind === 'end') {
      warn();
      endSessionEarly();
    } else {
      tap();
      takeBreak(pending.minutes);
      onCancel();
    }
  };

  return (
    <Card style={{ gap: spacing.md, alignItems: 'center' }}>
      <Txt variant="heading" center>
        {pending.kind === 'end' ? 'Are you sure you want to stop?' : `Take a ${pending.minutes}-minute break?`}
      </Txt>
      <Txt tone="muted" center>
        {pending.kind === 'end'
          ? `You’ve already focused for ${formatDuration(focusedMin)}. That counts no matter what you choose.`
          : 'Your apps will unlock for the break, then blocking resumes on its own.'}
      </Txt>
      {left > 0 ? (
        <View style={[styles.countdown, { backgroundColor: t.surfaceMuted }]}>
          <Txt variant="label" tone="muted">
            Take a slow breath… {left}
          </Txt>
        </View>
      ) : null}
      <View style={[styles.row, { alignSelf: 'stretch' }]}>
        <Button title={pending.kind === 'end' ? 'Keep focusing' : 'Not now'} onPress={onCancel} style={{ flex: 1 }} />
        <Button
          title={pending.kind === 'end' ? 'End session' : 'Start break'}
          variant="secondary"
          disabled={left > 0}
          onPress={confirm}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

function SessionSummary({ session }: { session: FocusSession }) {
  const t = useTheme();
  const c = t.difficulty[session.difficulty];
  const minutes = Math.round(focusedMs(session, session.endedAt ?? session.startedAt) / MINUTE);
  const completed = session.status === 'completed';
  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.bigEmoji, { backgroundColor: c.soft }]}>
        <Txt style={{ fontSize: 56 }}>{completed ? '🌿' : '🌱'}</Txt>
      </View>
      <Txt variant="title" center>
        {completed ? 'Session complete' : 'Every minute counts'}
      </Txt>
      <Txt tone="muted" center style={{ maxWidth: 320 }}>
        {completed
          ? `You gave ${formatDuration(minutes)} of real attention to “${session.label}”. That’s worth celebrating.`
          : `You focused for ${formatDuration(minutes)}. Stopping is okay. Come back whenever you’re ready.`}
      </Txt>
      <Button title="Back to today" icon="home-outline" size="lg" onPress={() => router.replace('/')} style={{ alignSelf: 'stretch', marginTop: spacing.xl }} />
    </Screen>
  );
}

function NoSession() {
  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <Txt variant="title" center>
        No session running
      </Txt>
      <Txt tone="muted" center>
        Start one whenever you’re ready.
      </Txt>
      <Button title="Start a session" icon="play" onPress={() => router.replace('/session/new')} />
      <Button title="Back" variant="ghost" onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  countdown: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  bigEmoji: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
});
