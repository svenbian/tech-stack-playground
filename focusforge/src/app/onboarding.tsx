import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { CATEGORY_META } from '@/data/catalog';
import { formatDuration } from '@/domain/time';
import type { AppCategory } from '@/domain/types';
import { useHaptics } from '@/hooks/useHaptics';
import { blockingService } from '@/services/blocking';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DISTRACTION_OPTIONS: AppCategory[] = ['social', 'entertainment', 'games', 'news', 'shopping'];
const BASELINES = [60, 120, 180, 240, 300];
const STEPS = 5;

/**
 * A five-step, kind onboarding: name → distractions → goals → schedules → permissions.
 * Ends with a ready-to-use block list (and optional schedules), so the very first
 * screen after onboarding is useful.
 */
export default function Onboarding() {
  const t = useTheme();
  const complete = useFocusStore((s) => s.completeOnboarding);
  const { tap, success } = useHaptics();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [distractions, setDistractions] = useState<AppCategory[]>(['social', 'entertainment']);
  const [goal, setGoal] = useState(120);
  const [baseline, setBaseline] = useState(180);
  const [work, setWork] = useState(true);
  const [sleep, setSleep] = useState(true);
  const [sample, setSample] = useState(true);

  const next = () => {
    tap();
    setStep((s) => Math.min(STEPS - 1, s + 1));
  };
  const finish = async () => {
    await blockingService.requestAuthorization();
    success();
    complete({
      name,
      distractions,
      dailyGoalMinutes: goal,
      baselineDistractionMinutes: baseline,
      addWorkSchedule: work,
      addSleepSchedule: sleep,
      withSampleData: sample,
    });
    // Stack.Protected in the root layout routes us to the tabs automatically.
  };

  const footer = (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.dots}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === step ? t.primary : t.border, width: i === step ? 22 : 8 }]} />
        ))}
      </View>
      {step < STEPS - 1 ? (
        <Button title={step === 0 ? 'Let’s begin' : 'Continue'} size="lg" onPress={next} disabled={step === 1 && distractions.length === 0} />
      ) : (
        <Button title="Start my calmer days" icon="leaf" size="lg" onPress={finish} />
      )}
      {step > 0 ? <Button title="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} /> : null}
    </View>
  );

  return (
    <Screen edges={['top', 'bottom']} footer={footer} contentStyle={{ paddingTop: spacing.xxl }}>
      {step === 0 ? (
        <>
          <View style={[styles.logo, { backgroundColor: t.primarySoft }]}>
            <Txt style={{ fontSize: 48 }}>🌿</Txt>
          </View>
          <Txt variant="title" center>
            Welcome to FocusForge
          </Txt>
          <Txt tone="muted" center>
            A calm space to protect your attention. Pause the apps that pull at you, focus on what matters, and celebrate
            every small win. No guilt, ever.
          </Txt>
          <Card style={{ marginTop: spacing.lg }}>
            <Txt variant="label" tone="muted">
              What should we call you? (optional)
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={t.textSubtle}
              style={{ fontSize: 18, color: t.text, paddingVertical: 8 }}
              autoFocus={false}
            />
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Txt variant="title">What tends to pull you away?</Txt>
          <Txt tone="muted">We’ll turn these into your first block list. You can change it anytime.</Txt>
          <View style={styles.wrap}>
            {DISTRACTION_OPTIONS.map((c) => (
              <Chip
                key={c}
                label={`${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
                selected={distractions.includes(c)}
                onPress={() => setDistractions((d) => (d.includes(c) ? d.filter((x) => x !== c) : [...d, c]))}
              />
            ))}
          </View>
          <Txt variant="label" tone="subtle">
            Phone, Messages, Maps and other essentials always stay available.
          </Txt>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Txt variant="title">Set a gentle goal</Txt>
          <Card style={{ gap: spacing.md, alignItems: 'center' }}>
            <Txt variant="bodyStrong">Daily focus goal</Txt>
            <Stepper value={goal} onChange={setGoal} step={15} min={15} max={480} format={formatDuration} />
            <Txt variant="label" tone="muted" center>
              Start small. You can raise it as it gets easier.
            </Txt>
          </Card>
          <Card style={{ gap: spacing.md }}>
            <Txt variant="bodyStrong">Roughly how long do you spend on distracting apps a day?</Txt>
            <View style={styles.wrap}>
              {BASELINES.map((b) => (
                <Chip key={b} label={b === 300 ? '5h+' : formatDuration(b)} selected={baseline === b} onPress={() => setBaseline(b)} />
              ))}
            </View>
            <Txt variant="label" tone="muted">
              We only use this to show how much time you’ve won back.
            </Txt>
          </Card>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Txt variant="title">Make focus automatic</Txt>
          <Txt tone="muted">Schedules switch blocking on by themselves, so you don’t have to rely on willpower.</Txt>
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              left={<Txt style={{ fontSize: 26 }}>☀️</Txt>}
              title="Deep Work Mornings"
              subtitle="Weekdays · 9:00 AM – 12:00 PM · Medium"
              toggle={{ value: work, onChange: setWork }}
            />
            <ListRow
              left={<Txt style={{ fontSize: 26 }}>🌙</Txt>}
              title="Wind Down"
              subtitle="Every day · 11:00 PM – 7:00 AM · Easy"
              toggle={{ value: sleep, onChange: setSleep }}
              last
            />
          </Card>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Txt variant="title">One last thing</Txt>
          <Card style={{ gap: spacing.sm }}>
            <Txt variant="bodyStrong">🔐 Screen Time permission</Txt>
            <Txt variant="label" tone="muted">
              On a real device FocusForge asks for Screen Time (iOS) or Accessibility (Android) access to pause apps.
              Your usage data never leaves your phone. This build runs in simulation mode, so nothing to approve yet.
            </Txt>
          </Card>
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              icon="sparkles-outline"
              title="Explore with sample data"
              subtitle="Fill Insights with two weeks of example history"
              toggle={{ value: sample, onChange: setSample }}
              last
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 110, height: 110, borderRadius: 36, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.sm },
  dot: { height: 8, borderRadius: radius.pill },
});
