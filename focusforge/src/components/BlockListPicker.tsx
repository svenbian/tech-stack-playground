import { router } from 'expo-router';
import { View } from 'react-native';

import { APP_CATALOG } from '@/data/catalog';
import { resolveBlockedAppIds } from '@/domain/blocking';
import { useFocusStore } from '@/store/focusStore';
import { Button } from './Button';
import { Card } from './Card';
import { ListRow } from './ListRow';
import { Txt } from './Txt';

/** Multi-select of the user's block lists, with a shortcut to create one. */
export function BlockListPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const lists = useFocusStore((s) => s.blockLists);
  const allowlist = useFocusStore((s) => s.settings.allowlist);

  if (lists.length === 0) {
    return (
      <Card style={{ gap: 12 }}>
        <Txt tone="muted">You don’t have any block lists yet. A list groups the apps you’d like to pause.</Txt>
        <Button title="Create a block list" icon="add" variant="secondary" onPress={() => router.push('/blocklist/new')} />
      </Card>
    );
  }

  return (
    <Card padded={false} style={{ paddingHorizontal: 16 }}>
      {lists.map((l, i) => {
        const count = resolveBlockedAppIds([l.id], lists, APP_CATALOG, allowlist).size;
        const isOn = selected.includes(l.id);
        return (
          <ListRow
            key={l.id}
            left={<View style={{ width: 34, alignItems: 'center' }}><Txt style={{ fontSize: 22 }}>{l.emoji}</Txt></View>}
            title={l.name}
            subtitle={`${count} app${count === 1 ? '' : 's'}`}
            checked={isOn}
            onPress={() => onChange(isOn ? selected.filter((x) => x !== l.id) : [...selected, l.id])}
            last={i === lists.length - 1}
          />
        );
      })}
    </Card>
  );
}
