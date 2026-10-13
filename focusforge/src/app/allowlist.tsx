import { AppIcon } from '@/components/AppIcon';
import { Card } from '@/components/Card';
import { CloseButton } from '@/components/CloseButton';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { APP_CATALOG, CATEGORY_META } from '@/data/catalog';
import { useFocusStore } from '@/store/focusStore';
import { spacing } from '@/theme/tokens';

/** Essential apps that are never blocked, whatever the session, schedule or difficulty. */
export default function AllowlistScreen() {
  const allowlist = useFocusStore((s) => s.settings.allowlist);
  const toggle = useFocusStore((s) => s.toggleAllowlisted);

  return (
    <Screen
      title="Always allowed"
      subtitle="These stay open even in Deep Focus. Keep it to what you truly need."
      right={<CloseButton />}
      edges={['top', 'bottom']}>
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {APP_CATALOG.map((app, i) => (
          <ListRow
            key={app.id}
            left={<AppIcon app={app} size={34} />}
            title={app.name}
            subtitle={CATEGORY_META[app.category].label}
            toggle={{ value: allowlist.includes(app.id), onChange: () => toggle(app.id) }}
            last={i === APP_CATALOG.length - 1}
          />
        ))}
      </Card>
    </Screen>
  );
}
