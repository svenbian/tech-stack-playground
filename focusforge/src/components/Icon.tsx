import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ionicons wrapper that accepts plain strings (catalog data stores icon names as strings). */
export function Icon({ name, size = 20, color }: { name: string; size?: number; color: ColorValue }) {
  return <Ionicons name={name as IconName} size={size} color={color} />;
}
