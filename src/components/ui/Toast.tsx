import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '@/store/uiStore';
import { Ionicons } from '@expo/vector-icons';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  return (
    <View
      style={{ top: insets.top + 16 }}
      className="absolute left-4 right-4 z-50 gap-2"
      pointerEvents="none"
    >
      {toasts.map((t) => (
        <View
          key={t.id}
          className={`
            flex-row items-center gap-3 px-4 py-3 rounded-2xl shadow-lg
            ${t.type === 'success' ? 'bg-forest-800' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}
          `}
        >
          <Ionicons
            name={t.type === 'success' ? 'checkmark-circle' : t.type === 'error' ? 'alert-circle' : 'information-circle'}
            size={20}
            color="white"
          />
          <Text className="text-white text-sm font-medium flex-1">{t.message}</Text>
        </View>
      ))}
    </View>
  );
}
