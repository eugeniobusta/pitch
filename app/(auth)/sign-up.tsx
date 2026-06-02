import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Linking, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AccountType } from '@/types/database';

const ACCOUNT_TYPES: {
  value: AccountType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    value: 'startup',
    icon: 'rocket-outline',
    title: 'Startup Founder',
    desc: 'Post pitch videos and connect with investors',
  },
  {
    value: 'investor',
    icon: 'briefcase-outline',
    title: 'Investor',
    desc: 'Discover startups and make connections',
  },
];

type Step = 1 | 2 | 3; // 1 = role, 2 = credentials, 3 = verify email

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '' });

  function clearErrors() {
    setErrors({ fullName: '', email: '', password: '' });
  }

  function validateStep2() {
    const e = { fullName: '', email: '', password: '' };
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (password.length < 8) {
      e.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      e.password = 'Password must include at least one uppercase letter and one number';
    }
    setErrors(e);
    return !e.fullName && !e.email && !e.password;
  }

  async function handleSignUp() {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), account_type: accountType },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email') || msg.includes('already')) {
          setErrors((e) => ({ ...e, email: error.message }));
        } else if (msg.includes('password')) {
          setErrors((e) => ({ ...e, password: error.message }));
        } else {
          setErrors((e) => ({ ...e, email: error.message }));
        }
        return;
      }

      // If session is returned email confirmation is disabled — auth state
      // change fires automatically and AuthGuard navigates to onboarding.
      if (data.session) return;

      // Email confirmation required — show the verify step.
      setStep(3);
    } catch (err: any) {
      setErrors((e) => ({ ...e, email: err?.message ?? 'Something went wrong' }));
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 3: email verification ──────────────────────────────────────────
  if (step === 3) {
    return (
      <View style={[styles.verifyRoot, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.verifyCard}>
          <View style={styles.verifyIconWrap}>
            <Ionicons name="mail" size={32} color="#6DB882" />
          </View>

          <Text style={styles.verifyTitle}>Check your inbox</Text>
          <Text style={styles.verifyBody}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.verifyEmail}>{email}</Text>
          </Text>

          <View style={styles.verifySteps}>
            {[
              { icon: 'open-outline' as const, text: 'Open the email we just sent you' },
              { icon: 'checkmark-circle-outline' as const, text: 'Tap "Confirm your email"' },
              { icon: 'arrow-forward-circle-outline' as const, text: 'Come back and sign in' },
            ].map((s, i) => (
              <View key={i} style={styles.verifyStep}>
                <View style={styles.verifyStepNum}>
                  <Text style={styles.verifyStepNumText}>{i + 1}</Text>
                </View>
                <Ionicons name={s.icon} size={18} color="#3A5C28" style={{ marginHorizontal: 10 }} />
                <Text style={styles.verifyStepText}>{s.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.mailBtn}
            onPress={() => {
              Linking.openURL('message://').catch(() =>
                Linking.openURL('mailto:')
              );
            }}
          >
            <Ionicons name="mail-open-outline" size={18} color="white" />
            <Text style={styles.mailBtnText}>Open Mail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signinLink}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.signinLinkText}>I've confirmed — sign me in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Step 1: role selection ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.step1Header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#2E4820" />
          </TouchableOpacity>
          <Text style={styles.step1Title}>Join as...</Text>
          <Text style={styles.step1Sub}>Tell us how you will use Pitch</Text>
        </View>

        <View style={styles.cards}>
          {ACCOUNT_TYPES.map((type) => {
            const selected = accountType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => setAccountType(type.value)}
                activeOpacity={0.8}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
                  <Ionicons
                    name={type.icon}
                    size={24}
                    color={selected ? '#6DB882' : '#3A5C28'}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                    {type.title}
                  </Text>
                  <Text style={[styles.cardDesc, selected && styles.cardDescSelected]}>
                    {type.desc}
                  </Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color="#6DB882" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.step1Footer}>
          <Button
            label="Continue"
            onPress={() => {
              if (!accountType) return;
              setStep(2);
            }}
            disabled={!accountType}
            size="lg"
          />
          <View style={styles.switchRow}>
            <Text style={{ color: '#5A5A5A' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Step 2: credentials ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9F6F2' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#E8C9A0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create your{'\n'}account.</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{accountType}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            value={fullName}
            onChangeText={(v) => { setFullName(v); clearErrors(); }}
            autoCapitalize="words"
            leftIcon="person-outline"
            error={errors.fullName}
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); clearErrors(); }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(v) => { setPassword(v); clearErrors(); }}
            secureTextEntry
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Button
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F6F2',
  },
  step1Header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  step1Title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  step1Sub: {
    color: '#5A5A5A',
    marginTop: 4,
    fontSize: 14,
  },
  cards: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardSelected: {
    borderColor: '#3A5C28',
    backgroundColor: '#2E4820',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: '#F2EDE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: 'rgba(109,184,130,0.18)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  cardTitleSelected: {
    color: 'white',
  },
  cardDesc: {
    fontSize: 13,
    color: '#5A5A5A',
  },
  cardDescSelected: {
    color: 'rgba(232,201,160,0.75)',
  },
  step1Footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#F9F6F2',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchLink: {
    color: '#3A5C28',
    fontWeight: '700',
  },
  // Step 2 header
  header: {
    backgroundColor: '#2E4820',
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
    lineHeight: 46,
  },
  typeBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(109,184,130,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(109,184,130,0.3)',
  },
  typeBadgeText: {
    color: '#6DB882',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  // Step 3 — verify
  verifyRoot: {
    flex: 1,
    backgroundColor: '#F9F6F2',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  verifyCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  verifyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifyBody: {
    fontSize: 14,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  verifyEmail: {
    color: '#2E4820',
    fontWeight: '700',
  },
  verifySteps: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  verifyStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyStepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E4820',
  },
  verifyStepText: {
    fontSize: 14,
    color: '#3A3A3A',
    flex: 1,
  },
  mailBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E4820',
    paddingVertical: 15,
    borderRadius: 13,
    marginBottom: 12,
  },
  mailBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  signinLink: {
    paddingVertical: 10,
  },
  signinLinkText: {
    color: '#3A5C28',
    fontWeight: '600',
    fontSize: 14,
  },
});
