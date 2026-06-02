import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  function clearErrors() {
    setErrors({ email: '', password: '' });
  }

  function validate() {
    const e = { email: '', password: '' };
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return !e.email && !e.password;
  }

  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const msg = error.message;
        if (
          msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('credentials') ||
          msg.toLowerCase().includes('password')
        ) {
          setErrors({ email: '', password: 'Incorrect email or password' });
        } else if (msg.toLowerCase().includes('email')) {
          setErrors({ email: msg, password: '' });
        } else {
          setErrors({ email: '', password: msg });
        }
      }
      // On success: onAuthStateChange fires → profile loads → AuthGuard navigates
    } catch (err: any) {
      setErrors({ email: '', password: err?.message ?? 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9F6F2' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#E8C9A0" />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome{'\n'}back.</Text>
          <Text style={styles.subtitle}>Sign in to your Pitch account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); clearErrors(); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={(v) => { setPassword(v); clearErrors(); }}
            secureTextEntry
            autoComplete="password"
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          {/* Inline combined error state */}
          {(errors.email || errors.password) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#D0382B" />
              <Text style={styles.errorBannerText}>
                {errors.email || errors.password}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button label="Sign In" onPress={handleSignIn} loading={loading} size="lg" />

          <View style={styles.switchRow}>
            <Text style={{ color: '#5A5A5A' }}>No account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
              <Text style={styles.switchLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2E4820',
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
    lineHeight: 48,
  },
  subtitle: {
    color: 'rgba(232,201,160,0.6)',
    fontSize: 14,
    marginTop: 6,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    marginTop: -8,
  },
  errorBannerText: {
    color: '#D0382B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    color: '#3A5C28',
    fontWeight: '600',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchLink: {
    color: '#3A5C28',
    fontWeight: '700',
  },
});
