import { View } from 'react-native';

import type { AppInfo } from '@/domain/types';
import { Icon } from './Icon';

/** Placeholder "app icon": a rounded square in the app's tint. Real icons come from the OS picker. */
export function AppIcon({ app, size = 40, muted }: { app: AppInfo; size?: number; muted?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: app.color,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: muted ? 0.35 : 1,
      }}>
      <Icon name={app.icon} size={size * 0.52} color="#FFFFFF" />
    </View>
  );
}
