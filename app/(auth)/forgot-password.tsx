import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useUIStore((s) => s.showToast);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      showToast('Enter your email address', 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setSent(true);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-card" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ paddingTop: insets.top + 16 }} className="px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Ionicons name="arrow-back" size={24} color="#2E4820" />
        </TouchableOpacity>

        {sent ? (
          <View className="items-center pt-16">
            <View className="w-20 h-20 bg-forest-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={40} color="#2E4820" />
            </View>
            <Text className="text-2xl font-bold text-text-primary text-center">Check your email</Text>
            <Text className="text-text-secondary text-center mt-3 mb-8">
              We sent a reset link to {email}
            </Text>
            <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/sign-in')} />
          </View>
        ) : (
          <>
            <Text className="text-3xl font-black text-text-primary">Reset your</Text>
            <Text className="text-3xl font-black text-forest-700">password.</Text>
            <Text className="text-text-secondary mt-2 mb-8">
              Enter your email and we'll send you a reset link.
            </Text>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Button label="Send Reset Link" onPress={handleReset} loading={loading} size="lg" />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
