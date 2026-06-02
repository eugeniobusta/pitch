import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { haptic } from '@/lib/haptics';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const handlePress = () => {
    haptic.medium();
    onPress();
  };

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
  ];

  const indicatorColor = (variant === 'outline' || variant === 'ghost') ? '#2E4820' : '#fff';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={containerStyle}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} size="small" />
      ) : (
        <>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    marginRight: 6,
  },

  // Variants
  variant_primary: {
    backgroundColor: '#2E4820',
    borderRadius: 8,
  },
  variant_secondary: {
    backgroundColor: '#6DB882',
    borderRadius: 8,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2E4820',
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  variant_danger: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
  },

  // Text variants
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#2E4820',
  },
  text_ghost: {
    color: '#2E4820',
  },
  text_danger: {
    color: '#FFFFFF',
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
  },

  // Text sizes
  textSize_sm: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSize_md: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSize_lg: {
    fontSize: 16,
    fontWeight: '700',
  },
});
