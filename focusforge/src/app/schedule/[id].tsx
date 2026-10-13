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
import { isOvernight, scheduleLengthMinutes } from '@/domain/schedule';
import { formatDuration, formatMinutesOfDay, WEEKDAY_LETTER } from '@/domain/time';
import type { Difficulty } from '@/domain/types';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TEMPLATES = [
  { name: 'Work hours', emoji: '💼', days: [1, 2, 3, 4, 5], start: 9 * 60, end: 17 * 60 },
  { name: 'Deep Work Mornings', emoji: '☀️', days: [1, 2, 3, 4, 5], start: 8 * 60, end: 11 * 60 },
  { name: 'Sleep', emoji: '🌙', days: [0, 1, 2, 3, 4, 5, 6], start: 23 * 60, end: 7 * 60 },
  { name: 'Family dinner', emoji: '🍲', days: [0, 1, 2, 3, 4, 5, 6], start: 18 * 60, end: 20 * 60 },
];

const EMOJIS = ['☀️', '💼', '🌙', '📚', '🍲', '🧘', '🎯', '🌿'];

export default function ScheduleEditor() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useFocusStore((s) => s.schedules.find((x) => x.id === id));
  const blockLists = useFocusStore((s) => s.blockLists);
  const upsert = useFocusStore((s) => s.upsertSchedule);
  const remove = useFocusStore((s) => s.deleteSchedule);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '☀️');
  const [days, setDays] = useState<number[]>(existing?.days ?? [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(existing?.startMinutes ?? 9 * 60);
  const [end, setEnd] = useState(existing?.endMinutes ?? 17 * 60);
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? 'medium');
  const [listIds, setListIds] = useState<string[]>(existing?.blockListIds ?? blockLists.map((l) => l.id));

  const applyTemplate = (tpl: (typeof TEMPLATES)[number]) => {
    setName(tpl.name);
    setEmoji(tpl.emoji);
    setDays(tpl.days);
    setStart(tpl.start);
    setEnd(tpl.end);
  };

  const save = () => {
    upsert({
      id: existing?.id,
      name: name.trim() || 'Focus block',
      emoji,
      days,
      startMinutes: start,
      endMinutes: end,
      difficulty,
      blockListIds: listIds,
      enabled: existing?.enabled ?? true,
    });
    router.back();
  };

  const wrap = (m: number) => (m + 1440) % 1440;
  const length = scheduleLengthMinutes({ startMinutes: start, endMinutes: end });

  return (
    <Screen
      title={existing ? 'Edit schedule' : 'New schedule'}
      right={<CloseButton />}
      edges={['top', 'bottom']}
      footer={<Button title="Save schedule" icon="checkmark" size="lg" disabled={days.length === 0 || listIds.length === 0 || start === end} onPress={save} />}>
      {!existing ? (
        <View style={styles.wrap}>
          {TEMPLATES.map((tpl) => (
            <Chip key={tpl.name} label={`${tpl.emoji} ${tpl.name}`} onPress={() => applyTemplate(tpl)} selected={name === tpl.name} />
          ))}
        </View>
      ) : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name, e.g. Deep Work"
        placeholderTextColor={t.textSubtle}
        style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
      />
      <View style={styles.wrap}>
        {EMOJIS.map((e) => (
          <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
        ))}
      </View>

      <Txt variant="heading">When</Txt>
      <Card style={{ gap: spacing.lg }}>
        <View style={styles.daysRow}>
          {WEEKDAY_LETTER.map((letter, d) => {
            const on = days.includes(d);
            return (
              <Chip
                key={d}
                label={letter}
                selected={on}
                onPress={() => setDays((ds) => (on ? ds.filter((x) => x !== d) : [...ds, d].sort()))}
              />
            );
          })}
        </View>
        <View style={styles.timeRow}>
          <Txt variant="label" tone="muted" style={styles.timeLabel}>
            Starts
          </Txt>
          <Stepper value={start} onChange={(v) => setStart(wrap(v))} step={15} min={-15} max={1440} format={formatMinutesOfDay} />
        </View>
        <View style={styles.timeRow}>
          <Txt variant="label" tone="muted" style={styles.timeLabel}>
            Ends
          </Txt>
          <Stepper value={end} onChange={(v) => setEnd(wrap(v))} step={15} min={-15} max={1440} format={formatMinutesOfDay} />
        </View>
        <Txt variant="label" tone="muted" center>
          {start === end
            ? 'Start and end can’t be the same.'
            : `${formatDuration(length)} of focus${isOvernight({ startMinutes: start, endMinutes: end }) ? ', running overnight 🌙' : ''}`}
        </Txt>
      </Card>

      <Txt variant="heading">Difficulty</Txt>
      <DifficultyPicker value={difficulty} onChange={setDifficulty} />

      <Txt variant="heading">Pause these</Txt>
      <BlockListPicker selected={listIds} onChange={setListIds} />

      {existing ? (
        <Button
          title="Delete schedule"
          variant="ghost"
          color={t.danger}
          icon="trash-outline"
          onPress={() => {
            remove(existing.id);
            router.back();
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { width: 56 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16 },
});
