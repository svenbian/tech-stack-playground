import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { DIFFICULTY_RULES } from '@/domain/session';
import { formatDuration } from '@/domain/time';
import type { Difficulty, ThemePreference } from '@/domain/types';
import { blockingService } from '@/services/blocking';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const t = useTheme();
  const settings = useFocusStore((s) => s.settings);
  const update = useFocusStore((s) => s.updateSettings);
  const loadSampleData = useFocusStore((s) => s.loadSampleData);
  const resetAll = useFocusStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen title="Settings">
      <Card style={{ gap: spacing.sm }}>
        <Txt variant="label" tone="muted">
          What should we call you?
        </Txt>
        <TextInput
          value={settings.name}
          onChangeText={(name) => update({ name })}
          placeholder="Your name"
          placeholderTextColor={t.textSubtle}
          style={{ fontSize: 18, color: t.text, paddingVertical: 6 }}
        />
      </Card>

      <SectionHeader title="Focus" />
      <Card style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Txt variant="bodyStrong">Daily focus goal</Txt>
          <Stepper value={settings.dailyGoalMinutes} onChange={(v) => update({ dailyGoalMinutes: v })} step={15} min={15} max={600} format={formatDuration} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Txt variant="bodyStrong">Default difficulty</Txt>
          <Segmented<Difficulty>
            value={settings.defaultDifficulty}
            onChange={(defaultDifficulty) => update({ defaultDifficulty })}
            options={(['easy', 'medium', 'deep'] as const).map((d) => ({ value: d, label: DIFFICULTY_RULES[d].label }))}
          />
        </View>
      </Card>
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow
          icon="checkmark-done-outline"
          title="Always allowed"
          subtitle={`${settings.allowlist.length} essential apps never get blocked`}
          onPress={() => router.push('/allowlist')}
        />
        <ListRow
          icon="phone-portrait-outline"
          title="Try your shield"
          subtitle="See blocking on a simulated phone"
          onPress={() => router.push('/simulator')}
          last
        />
      </Card>

      <SectionHeader title="Appearance" />
      <Card style={{ gap: spacing.md }}>
        <Segmented<ThemePreference>
          value={settings.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <ListRow
          icon="pulse-outline"
          title="Haptic feedback"
          toggle={{ value: settings.haptics, onChange: (haptics) => update({ haptics }) }}
          last
        />
      </Card>

      <SectionHeader title="Device blocking" />
      <Card style={{ gap: spacing.sm }}>
        <Txt variant="bodyStrong">Running in {blockingService.isNative ? 'native' : 'simulation'} mode</Txt>
        <Txt variant="label" tone="muted">
          Real blocking needs Apple’s Screen Time API on iOS and an Accessibility Service on Android. Both require a custom
          development build, not Expo Go. See docs/NATIVE_BLOCKING.md.
        </Txt>
      </Card>

      <SectionHeader title="Data" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow icon="sparkles-outline" title="Load sample data" subtitle="Two weeks of example history" onPress={loadSampleData} />
        <ListRow
          icon="refresh-outline"
          title="Reset everything"
          subtitle="Clears all data and restarts onboarding"
          onPress={() => setConfirmReset(true)}
          last
        />
      </Card>
      {confirmReset ? (
        <Card tint={t.dangerSoft} style={{ gap: spacing.md, borderRadius: radius.lg }}>
          <Txt variant="bodyStrong">Start fresh?</Txt>
          <Txt variant="label" tone="muted">
            This removes your sessions, lists, schedules and gems from this device.
          </Txt>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="Cancel" variant="secondary" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Button title="Reset" variant="danger" onPress={resetAll} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <Txt variant="caption" tone="subtle" center>
        FocusForge 1.0 · Made with care, not guilt. 🌿
      </Txt>
    </Screen>
  );
}
