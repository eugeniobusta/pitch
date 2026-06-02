import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { safeOpenUrl } from '@/lib/safeUrl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { haptic } from '@/lib/haptics';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function Divider() {
  return <View style={s.divider} />;
}

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <View style={s.propRow}>
      <Text style={s.propLabel}>{label}</Text>
      <Text style={s.propValue}>{value}</Text>
    </View>
  );
}

export default function InvestorDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const showToast = useUIStore((s) => s.showToast);
  const qc = useQueryClient();

  const isStartup = profile?.account_type === 'startup';

  const { data: investor, isLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('investor_profiles')
        .select('*, profile:profiles(*)')
        .eq('profile_id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  // Connection between the current startup user and this investor
  const { data: connection } = useQuery({
    queryKey: ['connection-startup', id, session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .eq('investor_id', id!)
        .eq('startup_id', session!.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!session && isStartup,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('connections').insert({
        investor_id: id,
        startup_id: session!.user.id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic.success();
      showToast('Connection request sent!', 'success');
      qc.invalidateQueries({ queryKey: ['connection-startup', id] });
    },
    onError: (e: any) => showToast(e.message, 'error'),
  });

  if (isLoading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color="#2E4820" size="large" />
      </View>
    );
  }
  if (!investor) return null;

  const investorProfile = investor.profile as any;

  const ticketSize =
    investor.min_investment || investor.max_investment
      ? `${investor.min_investment ? formatCurrency(investor.min_investment) : '—'} — ${investor.max_investment ? formatCurrency(investor.max_investment) : '—'}`
      : null;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="close" size={20} color="rgba(232,201,160,0.8)" />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <Avatar uri={investorProfile?.avatar_url} name={investorProfile?.full_name} size={72} />
            <View style={s.headerText}>
              <View style={s.nameRow}>
                <Text style={s.nameText}>{investorProfile?.full_name}</Text>
                {investor.is_verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#6DB882"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              <Text style={s.titleText}>{investor.title}</Text>
              {investor.firm_name && (
                <Text style={s.firmText}>{investor.firm_name}</Text>
              )}
            </View>
          </View>

          {/* Stats compact row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{investor.portfolio_count ?? 0}</Text>
              <Text style={s.statLabel}>Investments</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{investor.connections_count ?? 0}</Text>
              <Text style={s.statLabel}>Connections</Text>
            </View>
          </View>
        </View>

        {/* Details property rows */}
        <View style={s.section}>
          <SectionLabel label="DETAILS" />
          <View style={s.propTable}>
            <PropertyRow label="Title" value={investor.title} />
            <PropertyRow label="Firm" value={investor.firm_name} />
            <PropertyRow label="Ticket" value={ticketSize} />
            <PropertyRow label="Portfolio" value={investor.portfolio_count} />
          </View>
        </View>

        <Divider />

        {/* Bio */}
        {investor.bio && (
          <>
            <View style={s.section}>
              <SectionLabel label="ABOUT" />
              <Text style={s.bodyText}>{investor.bio}</Text>
            </View>
            <Divider />
          </>
        )}

        {/* Investment focus */}
        {investor.industries?.length > 0 && (
          <>
            <View style={s.section}>
              <SectionLabel label="INVESTMENT FOCUS" />
              <View style={s.tagsRow}>
                {investor.industries.map((ind: string) => (
                  <Badge key={ind} label={ind.replace('_', ' ')} variant="green" />
                ))}
              </View>
              {investor.stages?.length > 0 && (
                <>
                  <Text style={[s.sectionLabel, { marginTop: 14 }]}>STAGES</Text>
                  <View style={s.tagsRow}>
                    {investor.stages.map((st: string) => (
                      <Badge key={st} label={st.replace('_', ' ')} variant="muted" />
                    ))}
                  </View>
                </>
              )}
            </View>
            <Divider />
          </>
        )}

        {/* Links */}
        {investor.linkedin_url && (
          <>
            <View style={s.section}>
              <SectionLabel label="LINKS" />
              <TouchableOpacity
                onPress={() => safeOpenUrl(investor.linkedin_url)}
                style={s.linkRow}
              >
                <Ionicons name="logo-linkedin" size={16} color="#2E4820" />
                <Text style={s.linkText}>LinkedIn Profile</Text>
              </TouchableOpacity>
            </View>
            <Divider />
          </>
        )}
      </ScrollView>

      {/* CTA for startup users */}
      {isStartup && (
        <View style={[s.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
          {connection?.status === 'accepted' ? (
            <View style={s.connectedRow}>
              <Ionicons name="checkmark-circle" size={18} color="#6DB882" />
              <Text style={s.connectedText}>Connected — message from the Messages tab</Text>
            </View>
          ) : connection?.status === 'pending' ? (
            <View style={s.pendingRow}>
              <Ionicons name="time-outline" size={18} color="#C4944A" />
              <Text style={s.pendingText}>Connection request pending</Text>
            </View>
          ) : (
            <Button
              label="Request Connection"
              onPress={() => connectMutation.mutate()}
              loading={connectMutation.isPending}
              variant="secondary"
              size="lg"
            />
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F7F2',
  },
  header: {
    backgroundColor: '#2E4820',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeBtn: {
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 14,
    color: '#E8C9A0',
    opacity: 0.9,
    marginBottom: 2,
  },
  firmText: {
    fontSize: 13,
    color: '#E8C9A0',
    opacity: 0.65,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#E8C9A0',
    opacity: 0.7,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#AAAAAA',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  propTable: {},
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F0',
  },
  propLabel: {
    width: 110,
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  propValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  bodyText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F0',
  },
  linkText: {
    fontSize: 14,
    color: '#2E4820',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
  },
  ctaBar: {
    backgroundColor: 'rgba(247,247,245,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0D9A0',
  },
  pendingText: {
    fontSize: 14,
    color: '#7D5A1E',
    fontWeight: '500',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#F0FAF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8DFC5',
  },
  connectedText: {
    fontSize: 13,
    color: '#2E4820',
    fontWeight: '500',
    flex: 1,
  },
});
