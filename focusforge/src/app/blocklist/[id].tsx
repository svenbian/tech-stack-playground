import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { CloseButton } from '@/components/CloseButton';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, CATEGORY_META, CATEGORY_ORDER } from '@/data/catalog';
import type { AppCategory } from '@/domain/types';
import { useFocusStore } from '@/store/focusStore';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const EMOJIS = ['💬', '🎮', '🎬', '🐇', '🛍️', '📰', '🌿', '🌙', '📚', '🎯'];

export default function BlockListEditor() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useFocusStore((s) => s.blockLists.find((l) => l.id === id));
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const upsert = useFocusStore((s) => s.upsertBlockList);
  const remove = useFocusStore((s) => s.deleteBlockList);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🌿');
  const [categories, setCategories] = useState<AppCategory[]>(existing?.categories ?? []);
  const [appIds, setAppIds] = useState<string[]>(existing?.appIds ?? []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => APP_CATALOG.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  const toggleCategory = (c: AppCategory) =>
    setCategories((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const toggleApp = (appId: string) =>
    setAppIds((ids) => (ids.includes(appId) ? ids.filter((x) => x !== appId) : [...ids, appId]));

  const save = () => {
    upsert({ id: existing?.id, name: name.trim() || 'My block list', emoji, categories, appIds });
    router.back();
  };

  return (
    <Screen
      title={existing ? 'Edit block list' : 'New block list'}
      right={<CloseButton />}
      edges={['top', 'bottom']}
      footer={
        <Button title="Save list" icon="checkmark" size="lg" disabled={categories.length === 0 && appIds.length === 0} onPress={save} />
      }>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name, e.g. Social Media"
        placeholderTextColor={t.textSubtle}
        style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
      />
      <View style={styles.wrap}>
        {EMOJIS.map((e) => (
          <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
        ))}
      </View>

      <Txt variant="heading">Whole categories</Txt>
      <Txt variant="label" tone="muted">
        Category blocks include new apps in that category automatically.
      </Txt>
      <View style={styles.wrap}>
        {CATEGORY_ORDER.map((c) => (
          <Chip
            key={c}
            label={`${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
            selected={categories.includes(c)}
            onPress={() => toggleCategory(c)}
          />
        ))}
      </View>

      <Txt variant="heading">Individual apps & sites</Txt>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={t.textSubtle}
        style={[styles.input, { backgroundColor: t.surface, borderColor: t.border, color: t.text }]}
      />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {filtered.map((app, i) => {
          const viaCategory = categories.includes(app.category);
          const allowed = allowlist.includes(app.id);
          return (
            <ListRow
              key={app.id}
              left={<AppIcon app={app} size={34} />}
              title={app.name}
              subtitle={
                allowed
                  ? 'Always allowed (allowlist)'
                  : viaCategory
                    ? `Included via ${CATEGORY_META[app.category].label}`
                    : app.kind === 'website'
                      ? app.domain
                      : CATEGORY_META[app.category].label
              }
              checked={viaCategory || appIds.includes(app.id)}
              onPress={viaCategory ? undefined : () => toggleApp(app.id)}
              last={i === filtered.length - 1}
            />
          );
        })}
      </Card>

      {existing ? (
        <Button
          title="Delete list"
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
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16 },
});
