import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, AppColors, ColorScheme } from '@/lib/useTheme';
import { useThemeStore } from '@/store/themeStore';
import type { ColorScheme as CS } from '@/store/themeStore';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root:       { flex: 1, backgroundColor: c.bg },
    header:     {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c.header, paddingHorizontal: 16, paddingBottom: 16,
    },
    backBtn:    { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle:{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', flex: 1 },
    group:      { marginBottom: 0 },
    groupLabel: {
      fontSize: 11, fontWeight: '700', color: c.sectionLabel,
      letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 8,
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border, gap: 14,
    },
    rowIconBox: {
      width: 34, height: 34, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    rowText:    { flex: 1 },
    rowTitle:   { fontSize: 15, fontWeight: '600', color: c.text },
    rowDesc:    { fontSize: 12, color: c.textMuted, marginTop: 1 },
    chevron:    { opacity: 0.4 },
    // Appearance segmented control
    segment:    {
      flexDirection: 'row', margin: 16, backgroundColor: c.border,
      borderRadius: 10, padding: 3,
    },
    segBtn: {
      flex: 1, paddingVertical: 9, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    segBtnActive:{ backgroundColor: c.surface },
    segText:    { fontSize: 13, fontWeight: '600', color: c.textMuted },
    segTextActive:{ color: c.text },
    version:    {
      textAlign: 'center', fontSize: 12, color: c.textMuted,
      paddingVertical: 24,
    },
  });
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  desc?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}

function Row({ icon, iconColor, iconBg, title, desc, onPress, right, styles, colors }: RowProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={[styles.rowIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />)}
    </TouchableOpacity>
  );
}

const SCHEMES: { label: string; value: CS }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark',  value: 'dark'  },
  { label: 'System',value: 'system'},
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { colorScheme, setColorScheme } = useThemeStore();

  const [notifConn,    setNotifConn]    = useState(true);
  const [notifMsg,     setNotifMsg]     = useState(true);
  const [notifViews,   setNotifViews]   = useState(false);
  const [notifUpdates, setNotifUpdates] = useState(true);

  function openUrl(url: string) {
    if (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('mailto:')) {
      Alert.alert('Invalid link');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Could not open link'));
  }

  return (
    <View style={[styles.root, { paddingTop: 0 }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* ── APPEARANCE ────────────────────────────────────────────── */}
        <Text style={styles.groupLabel}>APPEARANCE</Text>
        <View style={{ backgroundColor: colors.surface }}>
          <View style={styles.segment}>
            {SCHEMES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.segBtn, colorScheme === s.value && styles.segBtnActive]}
                onPress={() => setColorScheme(s.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segText, colorScheme === s.value && styles.segTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────── */}
        <Text style={styles.groupLabel}>NOTIFICATIONS</Text>
        <Row icon="people-outline"     iconColor="#6DB882" iconBg="#E8F5EE" title="Connection requests"
          desc="When someone requests to connect"
          right={<Switch value={notifConn} onValueChange={setNotifConn} trackColor={{ false: colors.border, true: '#6DB882' }} thumbColor="#FFF" ios_backgroundColor={colors.border} />}
          onPress={undefined} styles={styles} colors={colors} />
        <Row icon="chatbubble-outline" iconColor="#C4944A" iconBg="#FDF3E3" title="New messages"
          desc="When you receive a new message"
          right={<Switch value={notifMsg} onValueChange={setNotifMsg} trackColor={{ false: colors.border, true: '#6DB882' }} thumbColor="#FFF" ios_backgroundColor={colors.border} />}
          onPress={undefined} styles={styles} colors={colors} />
        <Row icon="eye-outline"        iconColor="#8B5E3C" iconBg="#F5EDE5" title="Pitch views"
          desc="When investors view your pitch"
          right={<Switch value={notifViews} onValueChange={setNotifViews} trackColor={{ false: colors.border, true: '#6DB882' }} thumbColor="#FFF" ios_backgroundColor={colors.border} />}
          onPress={undefined} styles={styles} colors={colors} />
        <Row icon="megaphone-outline"  iconColor="#2E4820" iconBg="#E8F5EE" title="Product updates"
          desc="News and new features from Pitch"
          right={<Switch value={notifUpdates} onValueChange={setNotifUpdates} trackColor={{ false: colors.border, true: '#6DB882' }} thumbColor="#FFF" ios_backgroundColor={colors.border} />}
          onPress={undefined} styles={styles} colors={colors} />

        {/* ── LEGAL ─────────────────────────────────────────────────── */}
        <Text style={styles.groupLabel}>LEGAL</Text>
        <Row icon="shield-outline"         iconColor="#2E4820" iconBg="#E8F5EE" title="Privacy Policy"
          onPress={() => openUrl('https://pitch.app/privacy')} styles={styles} colors={colors} />
        <Row icon="document-text-outline"  iconColor="#2E4820" iconBg="#E8F5EE" title="Terms of Service"
          onPress={() => openUrl('https://pitch.app/terms')} styles={styles} colors={colors} />
        <Row icon="lock-closed-outline"    iconColor="#8B5E3C" iconBg="#F5EDE5" title="Data & Privacy"
          onPress={() => openUrl('https://pitch.app/data')} styles={styles} colors={colors} />

        {/* ── SUPPORT ───────────────────────────────────────────────── */}
        <Text style={styles.groupLabel}>SUPPORT</Text>
        <Row icon="mail-outline"           iconColor="#C4944A" iconBg="#FDF3E3" title="Send Feedback"
          onPress={() => openUrl('mailto:hello@pitch.app')} styles={styles} colors={colors} />
        <Row icon="star-outline"           iconColor="#C4944A" iconBg="#FDF3E3" title="Rate Pitch"
          onPress={() => Alert.alert('Thank you!', 'Rating will be available when the app is published.')} styles={styles} colors={colors} />

        {/* ── ABOUT ─────────────────────────────────────────────────── */}
        <Text style={styles.groupLabel}>ABOUT</Text>
        <Row icon="information-circle-outline" iconColor="#6DB882" iconBg="#E8F5EE"
          title="Version" desc="1.0.0 (build 1)" styles={styles} colors={colors} />

        <Text style={styles.version}>Pitch · Made for founders and investors</Text>
      </ScrollView>
    </View>
  );
}
