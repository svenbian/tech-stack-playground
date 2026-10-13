import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { CloseButton } from '@/components/CloseButton';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { APP_CATALOG, CATEGORY_META, getApp } from '@/data/catalog';
import { DISTRACTING_CATEGORIES } from '@/domain/stats';
import { formatDuration } from '@/domain/time';
import { useFocusStore } from '@/store/focusStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PRESETS = [15, 30, 45, 60];

export default function LimitEditor() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useFocusStore((s) => s.limits.find((l) => l.id === id));
  const limits = useFocusStore((s) => s.limits);
  const upsert = useFocusStore((s) => s.upsertLimit);
  const remove = useFocusStore((s) => s.deleteLimit);

  const [appId, setAppId] = useState<string | undefined>(existing?.appId);
  const [minutes, setMinutes] = useState(existing?.dailyLimitMinutes ?? 30);
  const taken = new Set(limits.filter((l) => l.id !== existing?.id).map((l) => l.appId));
  const candidates = APP_CATALOG.filter((a) => DISTRACTING_CATEGORIES.includes(a.category) && !taken.has(a.id));
  const app = appId ? getApp(appId) : undefined;

  const save = () => {
    if (!appId) return;
    upsert({ id: existing?.id, appId, dailyLimitMinutes: minutes, enabled: existing?.enabled ?? true });
    router.back();
  };

  return (
    <Screen
      title={existing ? 'Edit limit' : 'New daily limit'}
      subtitle="When the time’s up, the app rests until midnight."
      right={<CloseButton />}
      edges={['top', 'bottom']}
      footer={<Button title="Save limit" icon="checkmark" size="lg" disabled={!appId} onPress={save} />}>
      <Card style={{ alignItems: 'center', gap: spacing.lg }}>
        {app ? <AppIcon app={app} size={56} /> : <Txt style={{ fontSize: 40 }}>⏳</Txt>}
        <Txt variant="heading">{app ? `${app.name}: ${formatDuration(minutes)} a day` : 'Pick an app below'}</Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
          {PRESETS.map((p) => (
            <Chip key={p} label={formatDuration(p)} selected={minutes === p} onPress={() => setMinutes(p)} />
          ))}
        </View>
        <Stepper value={minutes} onChange={setMinutes} step={5} min={5} max={240} format={formatDuration} />
      </Card>

      {!existing ? (
        <>
          <Txt variant="heading">App</Txt>
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {candidates.map((a, i) => (
              <ListRow
                key={a.id}
                left={<AppIcon app={a} size={34} />}
                title={a.name}
                subtitle={CATEGORY_META[a.category].label}
                checked={appId === a.id}
                onPress={() => setAppId(a.id)}
                last={i === candidates.length - 1}
              />
            ))}
          </Card>
        </>
      ) : (
        <Button
          title="Delete limit"
          variant="ghost"
          color={t.danger}
          icon="trash-outline"
          onPress={() => {
            remove(existing.id);
            router.back();
          }}
        />
      )}
    </Screen>
  );
}
