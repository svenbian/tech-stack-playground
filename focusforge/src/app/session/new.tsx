import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BlockListPicker } from '@/components/BlockListPicker';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { CloseButton } from '@/components/CloseButton';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { DIFFICULTY_RULES, DURATION_PRESETS_MIN } from '@/domain/session';
import { formatDuration } from '@/domain/time';
import type { Difficulty } from '@/domain/types';
import { useHaptics } from '@/hooks/useHaptics';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const LABEL_IDEAS = ['Deep work', 'Study', 'Writing', 'Reading', 'Creative time'];

export default function NewSessionScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ minutes?: string }>();
  const defaultDifficulty = useFocusStore((s) => s.settings.defaultDifficulty);
  const blockLists = useFocusStore((s) => s.blockLists);
  const startSession = useFocusStore((s) => s.startSession);
  const { success } = useHaptics();

  const [minutes, setMinutes] = useState(() => Number(params.minutes) || 25);
  const [label, setLabel] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [listIds, setListIds] = useState<string[]>(() => blockLists.map((l) => l.id));

  const start = () => {
    startSession({ label: label.trim() || 'Focus time', durationMinutes: minutes, difficulty, blockListIds: listIds });
    success();
    router.replace('/session/active');
  };

  const c = t.difficulty[difficulty];

  return (
    <Screen
      title="New focus session"
      subtitle="Choose a length, a level, and what to pause."
      right={<CloseButton />}
      edges={['top', 'bottom']}
      footer={
        <Button
          title={`Start ${formatDuration(minutes)} · ${DIFFICULTY_RULES[difficulty].label}`}
          icon="play"
          size="lg"
          color={c.main}
          disabled={listIds.length === 0}
          onPress={start}
        />
      }>
      <Card style={{ gap: spacing.lg, alignItems: 'center' }}>
        <View style={styles.chips}>
          {DURATION_PRESETS_MIN.map((m) => (
            <Chip key={m} label={`${m} min`} selected={minutes === m} onPress={() => setMinutes(m)} />
          ))}
        </View>
        <Stepper value={minutes} onChange={setMinutes} step={5} min={5} max={240} format={formatDuration} />
      </Card>

      <Txt variant="heading">What are you focusing on?</Txt>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Focus time"
        placeholderTextColor={t.textSubtle}
        maxLength={40}
        style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
      />
      <View style={styles.chips}>
        {LABEL_IDEAS.map((idea) => (
          <Chip key={idea} label={idea} selected={label === idea} onPress={() => setLabel(idea)} />
        ))}
      </View>

      <Txt variant="heading">Difficulty</Txt>
      <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      {difficulty === 'deep' ? (
        <Txt variant="label" tone="muted">
          🔒 Deep Focus can’t be paused or ended early. Calls and allowlisted apps still work.
        </Txt>
      ) : null}

      <Txt variant="heading">Pause these</Txt>
      <BlockListPicker selected={listIds} onChange={setListIds} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16 },
});
