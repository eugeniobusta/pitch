import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuthStore } from '@/store/authStore';
import { useSignOut } from '@/features/auth/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function PropertyRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.propRow}>
      <Text style={styles.propLabel}>{label}</Text>
      <Text style={styles.propValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const startupProfile = useAuthStore((s) => s.startupProfile);
  const investorProfile = useAuthStore((s) => s.investorProfile);
  const signOut = useSignOut();
  const showToast = useUIStore((s) => s.showToast);
  const router = useRouter();
  const isStartup = profile?.account_type === 'startup';

  const [allowDM, setAllowDM] = useState(startupProfile?.allow_direct_messages ?? false);

  async function toggleDirectMessages(value: boolean) {
    setAllowDM(value);
    const { error } = await supabase
      .from('startup_profiles')
      .update({ allow_direct_messages: value })
      .eq('profile_id', profile?.id ?? '');
    if (error) {
      setAllowDM(!value);
      showToast('Failed to update setting', 'error');
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header band */}
      <View style={[styles.headerBand, { paddingTop: insets.top }]}>
        <View style={styles.headerBg} />
      </View>

      {/* Avatar + name block */}
      <View style={styles.identityBlock}>
        <View style={styles.avatarRow}>
          {isStartup && startupProfile?.logo_url ? (
            <Image
              source={{ uri: startupProfile.logo_url }}
              style={styles.logoAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarWrap}>
              <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={72} />
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/modals/edit-profile' as any)}>
            <Ionicons name="create-outline" size={14} color="#2E4820" style={{ marginRight: 4 }} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {isStartup ? (
          <>
            <Text style={styles.nameText}>{startupProfile?.company_name}</Text>
            <Text style={styles.subText}>{startupProfile?.tagline}</Text>
          </>
        ) : (
          <>
            <Text style={styles.nameText}>{profile?.full_name}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.subText}>
                {investorProfile?.title}
                {investorProfile?.firm_name ? `  ·  ${investorProfile.firm_name}` : ''}
              </Text>
              {investorProfile?.is_verified && (
                <Ionicons name="checkmark-circle" size={14} color="#6DB882" style={{ marginLeft: 4 }} />
              )}
            </View>
          </>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {isStartup ? (
            <>
              <Text style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2E4820' }]}>{startupProfile?.connections_count ?? 0}</Text>
                <Text style={styles.statLabel}> Connections</Text>
              </Text>
              <Text style={styles.statDivider}>|</Text>
              <Text style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#6DB882' }]}>{startupProfile?.views_count ?? 0}</Text>
                <Text style={styles.statLabel}> Views</Text>
              </Text>
              {!!startupProfile?.mrr && (
                <>
                  <Text style={styles.statDivider}>|</Text>
                  <Text style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#C4944A' }]}>{formatCurrency(startupProfile.mrr)}</Text>
                    <Text style={styles.statLabel}> MRR</Text>
                  </Text>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2E4820' }]}>{investorProfile?.connections_count ?? 0}</Text>
                <Text style={styles.statLabel}> Connections</Text>
              </Text>
              <Text style={styles.statDivider}>|</Text>
              <Text style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#6DB882' }]}>{investorProfile?.portfolio_count ?? 0}</Text>
                <Text style={styles.statLabel}> Portfolio</Text>
              </Text>
            </>
          )}
        </View>
      </View>

      <Divider />

      {/* About section */}
      <View style={styles.section}>
        <SectionLabel label="ABOUT" />
        <Text style={styles.bodyText}>
          {isStartup
            ? startupProfile?.description ?? 'No description yet.'
            : investorProfile?.bio ?? profile?.bio ?? 'No bio yet.'}
        </Text>
      </View>

      <Divider />

      {/* Details section (Notion property rows) */}
      {isStartup && startupProfile && (
        <>
          <View style={styles.section}>
            <SectionLabel label="DETAILS" />
            <View style={styles.propTable}>
              <PropertyRow label="Industry" value={startupProfile.industry?.replace('_', ' ')} />
              <PropertyRow label="Stage" value={startupProfile.stage?.replace('_', ' ')} />
              <PropertyRow label="Team" value={startupProfile.team_size ? `${startupProfile.team_size} people` : null} />
              <PropertyRow label="Founded" value={startupProfile.founded_year} />
              <PropertyRow label="Website" value={startupProfile.website?.replace(/^https?:\/\//, '')} />
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* Investor details */}
      {!isStartup && investorProfile && (
        <>
          <View style={styles.section}>
            <SectionLabel label="DETAILS" />
            <View style={styles.propTable}>
              <PropertyRow
                label="Ticket"
                value={
                  investorProfile.min_investment || investorProfile.max_investment
                    ? `${investorProfile.min_investment ? formatCurrency(investorProfile.min_investment) : '—'} — ${investorProfile.max_investment ? formatCurrency(investorProfile.max_investment) : '—'}`
                    : null
                }
              />
              <PropertyRow label="Portfolio" value={investorProfile.portfolio_count} />
              <PropertyRow label="Connections" value={investorProfile.connections_count} />
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* Raising section */}
      {isStartup && startupProfile?.is_raising && (
        <>
          <View style={styles.section}>
            <SectionLabel label="FUNDRAISE" />
            <View style={styles.raisingBar}>
              <Ionicons name="trending-up" size={14} color="#C4944A" />
              <Text style={styles.raisingText}>
                Currently raising{startupProfile.raising_amount ? `  ·  ${formatCurrency(startupProfile.raising_amount)}` : ''}
              </Text>
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* Investment focus */}
      {!isStartup && investorProfile?.industries?.length ? (
        <>
          <View style={styles.section}>
            <SectionLabel label="INVESTMENT FOCUS" />
            <View style={styles.tagsRow}>
              {investorProfile.industries.map((ind) => (
                <Badge key={ind} label={ind.replace('_', ' ')} variant="green" />
              ))}
            </View>
            {investorProfile.stages?.length ? (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>STAGES</Text>
                <View style={styles.tagsRow}>
                  {investorProfile.stages.map((s) => (
                    <Badge key={s} label={s.replace('_', ' ')} variant="muted" />
                  ))}
                </View>
              </>
            ) : null}
          </View>
          <Divider />
        </>
      ) : null}

      {/* Messaging settings — startup only */}
      {isStartup && (
        <>
          <Divider />
          <View style={styles.section}>
            <SectionLabel label="MESSAGING" />
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Permit direct messages</Text>
                <Text style={styles.toggleDesc}>
                  Investors can message you without sending a connection request first
                </Text>
              </View>
              <Switch
                value={allowDM}
                onValueChange={toggleDirectMessages}
                trackColor={{ false: '#D0D0D0', true: '#6DB882' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D0D0D0"
              />
            </View>
          </View>
        </>
      )}

      {/* Settings link */}
      <Divider />
      <TouchableOpacity style={styles.settingsRow} onPress={() => router.push('/settings' as any)}>
        <Ionicons name="settings-outline" size={18} color="#2E4820" />
        <Text style={styles.settingsRowText}>Settings</Text>
        <Ionicons name="chevron-forward" size={16} color="#7A9078" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* Sign out */}
      <Divider />
      <View style={styles.section}>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },
  headerBand: {
    backgroundColor: '#2E4820',
    height: 140,
  },
  headerBg: {
    flex: 1,
    backgroundColor: '#2E4820',
  },
  identityBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -36,
    marginBottom: 10,
  },
  avatarWrap: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 40,
  },
  logoAvatar: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subText: {
    fontSize: 14,
    color: '#777777',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 0,
  },
  statItem: {
    fontSize: 14,
  },
  statValue: {
    fontWeight: '700',
    color: '#1A1A1A',
    fontSize: 14,
  },
  statLabel: {
    color: '#777777',
    fontSize: 14,
  },
  statDivider: {
    color: '#D0D0D0',
    marginHorizontal: 10,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#DDE8DC',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3A5C28',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 21,
  },
  propTable: {
    // no extra styles needed
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F0',
  },
  propLabel: {
    width: 100,
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  propValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  raisingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#C4944A',
    paddingLeft: 10,
    paddingVertical: 6,
  },
  raisingText: {
    fontSize: 14,
    color: '#7D5A1E',
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signOutText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: '#777777',
    lineHeight: 17,
  },
});
