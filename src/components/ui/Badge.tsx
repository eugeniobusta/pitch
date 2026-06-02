import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'green' | 'warm' | 'copper' | 'muted';
}

export function Badge({ label, variant = 'green' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[`variant_${variant}`]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  variant_green: {
    borderColor: '#6DB882',
    backgroundColor: 'transparent',
  },
  text_green: {
    color: '#2E4820',
  },

  variant_warm: {
    borderColor: '#C4944A',
    backgroundColor: 'transparent',
  },
  text_warm: {
    color: '#7D5A1E',
  },

  variant_copper: {
    borderColor: '#C4944A',
    backgroundColor: 'transparent',
  },
  text_copper: {
    color: '#7D5A1E',
  },

  variant_muted: {
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
  },
  text_muted: {
    color: '#777777',
  },
});
