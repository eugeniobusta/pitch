import React, { useState } from 'react';
import { TextInput, Text, View, TouchableOpacity, TextInputProps, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  const borderColor = error ? '#DC2626' : focused ? '#2E4820' : '#D0D0D0';

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.inputContainer, { borderColor }]}>
        {leftIcon && (
          <View style={styles.leftIconWrap}>
            <Ionicons name={leftIcon} size={16} color="#9A9A9A" />
          </View>
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : null,
            rightIcon || isPassword ? styles.inputWithRight : null,
            style,
          ]}
          placeholderTextColor="#AAAAAA"
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.rightIconWrap}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={16} color="#9A9A9A" />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconWrap}>
            <Ionicons name={rightIcon} size={16} color="#9A9A9A" />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 6,
  },
  leftIconWrap: {
    paddingLeft: 12,
  },
  rightIconWrap: {
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputWithLeft: {
    paddingLeft: 8,
  },
  inputWithRight: {
    paddingRight: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 4,
  },
});
