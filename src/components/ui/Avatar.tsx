import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const fontSize = size * 0.38;

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-forest-700 overflow-hidden items-center justify-center"
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text style={{ fontSize, color: '#E8C9A0' }} className="font-bold">
          {initials}
        </Text>
      )}
    </View>
  );
}
