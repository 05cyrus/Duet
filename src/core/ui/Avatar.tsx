import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

/** Avatar with graceful initials fallback (0 network cost when no uri). */
export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const theme = useTheme();
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" color="primary">
        {initials}
      </Text>
    </View>
  );
}
