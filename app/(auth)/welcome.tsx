import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = [
  { n: '01', label: 'Film a 60-second pitch' },
  { n: '02', label: 'Investors swipe to discover you' },
  { n: '03', label: 'Connect and close the round' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top — brand */}
      <View style={styles.top}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.wordmark}>Pitch</Text>
      </View>

      {/* Middle — hero copy */}
      <View style={styles.hero}>
        <Text style={styles.heroLine1}>The fastest way</Text>
        <Text style={styles.heroLine2}>to get funded.</Text>

        <View style={styles.divider} />

        <Text style={styles.sub}>
          Founders post short pitch videos.{'\n'}
          Investors swipe. Deals happen.
        </Text>
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s.n} style={styles.step}>
            <Text style={styles.stepNum}>{s.n}</Text>
            <View style={styles.stepLine} />
            <Text style={styles.stepLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/(auth)/sign-up')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnSecondaryText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A2E0F',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#6DB882',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  heroLine1: {
    fontSize: 42,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 50,
    letterSpacing: -1,
  },
  heroLine2: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    lineHeight: 50,
    letterSpacing: -1,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#6DB882',
    borderRadius: 2,
    marginTop: 24,
    marginBottom: 20,
  },
  sub: {
    fontSize: 16,
    color: 'rgba(232,201,160,0.7)',
    lineHeight: 24,
  },
  steps: {
    gap: 14,
    marginBottom: 36,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6DB882',
    letterSpacing: 1,
    width: 22,
  },
  stepLine: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(109,184,130,0.3)',
  },
  stepLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  ctas: {
    gap: 10,
    paddingBottom: 12,
  },
  btnPrimary: {
    backgroundColor: '#6DB882',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  btnSecondary: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    fontSize: 15,
  },
});
