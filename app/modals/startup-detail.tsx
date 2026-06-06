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
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { haptic } from '@/lib/haptics';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
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

export default function StartupDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const { data: startup, isLoading } = useQuery({
    queryKey: ['startup', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('startup_profiles')
        .select('*, profile:profiles(id, full_name, avatar_url)')
        .eq('profile_id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: connection } = useQuery({
    queryKey: ['connection', id, session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .eq('investor_id', session!.user.id)
        .eq('startup_id', id!)
        .maybeSingle();
      return data;
    },
    enabled: !!session && profile?.account_type === 'investor',
  });

  const { data: likeStatus } = useQuery({
    queryKey: ['like-status', id, session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('startup_likes')
        .select('id')
        .eq('investor_id', session!.user.id)
        .eq('startup_id', id!)
        .maybeSingle();
      return { is_liked: !!data };
    },
    enabled: !!session && !!id && profile?.account_type === 'investor',
  });

  const isLiked = likeStatus?.is_liked ?? false;

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('connections').insert({
        investor_id: session!.user.id,
        startup_id: id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic.success();
      showToast('Connection request sent!', 'success');
      queryClient.invalidateQueries({ queryKey: ['connection', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (e: any) => showToast(e.message, 'error'),
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const { error } = await supabase.from('startup_likes')
          .delete()
          .eq('investor_id', session!.user.id)
          .eq('startup_id', id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('startup_likes')
          .insert({ investor_id: session!.user.id, startup_id: id });
        if (error) throw error;
      }
    },
    onMutate: () => haptic.light(),
    onSuccess: () => {
      showToast(isLiked ? 'Removed from saved' : 'Startup saved!', isLiked ? 'info' : 'success');
      queryClient.invalidateQueries({ queryKey: ['like-status', id] });
      queryClient.invalidateQueries({ queryKey: ['startup', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (e: any) => showToast(e.message, 'error'),
  });

  const [dmLoading, setDmLoading] = React.useState(false);

  async function handleDirectMessage() {
    if (!session?.user || !startup) return;
    setDmLoading(true);
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('investor_id', session.user.id)
        .eq('startup_id', startup.profile_id)
        .is('connection_id', null)
        .maybeSingle();

      if (existing) {
        router.push({ pathname: '/modals/conversation', params: { id: existing.id } } as any);
        return;
      }

      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ investor_id: session.user.id, startup_id: startup.profile_id })
        .select('id')
        .single();

      if (error) { showToast(error.message, 'error'); return; }
      router.push({ pathname: '/modals/conversation', params: { id: newConv.id } } as any);
    } finally {
      setDmLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color="#2E4820" size="large" />
      </View>
    );
  }

  if (!startup) return null;

  const isInvestor = profile?.account_type === 'investor';
  const isOwner = session?.user?.id === startup.profile_id;

  const hasTraction = startup.mrr || startup.arr || startup.users_count || startup.growth_rate;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Cover header */}
        <View style={s.cover}>
          {startup.cover_url ? (
            <Image
              source={{ uri: startup.cover_url }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : null}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.closeBtn, { top: insets.top + 10 }]}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Logo + raising badge */}
        <View style={s.logoRow}>
          {startup.logo_url ? (
            <Image source={{ uri: startup.logo_url }} style={s.logo} contentFit="cover" />
          ) : (
            <Avatar uri={null} name={startup.company_name} size={64} />
          )}
          {startup.is_raising && (
            <View style={s.raisingPill}>
              <Ionicons name="trending-up" size={12} color="#C4944A" />
              <Text style={s.raisingText}>
                Raising{startup.raising_amount ? `  ${formatCurrency(startup.raising_amount)}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Name + tagline */}
        <View style={s.nameBlock}>
          <Text style={s.companyName}>{startup.company_name}</Text>
          <Text style={s.tagline}>{startup.tagline}</Text>
          <View style={s.tagsRow}>
            <Badge label={startup.industry.replace('_', ' ')} variant="green" />
            <Badge label={startup.stage.replace('_', ' ')} variant="warm" />
            {startup.founded_year && (
              <Badge label={`Est. ${startup.founded_year}`} variant="muted" />
            )}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{formatCount(startup.connections_count ?? 0)}</Text>
              <Text style={s.statLabel}>Connections</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{formatCount(startup.views_count ?? 0)}</Text>
              <Text style={s.statLabel}>Views</Text>
            </View>
            <View style={s.statSep} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: '#E74C3C' }]}>{formatCount(startup.likes_count ?? 0)}</Text>
              <Text style={s.statLabel}>Saves</Text>
            </View>
          </View>
        </View>

        <Divider />

        {/* Details property rows */}
        <View style={s.section}>
          <SectionLabel label="DETAILS" />
          <View style={s.propTable}>
            <PropertyRow label="Industry" value={startup.industry?.replace('_', ' ')} />
            <PropertyRow label="Stage" value={startup.stage?.replace('_', ' ')} />
            <PropertyRow label="Founded" value={startup.founded_year} />
            <PropertyRow
              label="Team"
              value={startup.team_size ? `${startup.team_size} people` : null}
            />
            <PropertyRow
              label="Website"
              value={startup.website?.replace(/^https?:\/\//, '')}
            />
          </View>
        </View>

        <Divider />

        {/* Traction */}
        {hasTraction && (
          <>
            <View style={s.section}>
              <SectionLabel label="TRACTION" />
              <View style={s.tractionGrid}>
                {startup.mrr && (
                  <View style={s.tractionCell}>
                    <Text style={[s.tractionValue, { color: '#C4944A' }]}>{formatCurrency(startup.mrr)}</Text>
                    <Text style={s.tractionLabel}>MRR</Text>
                  </View>
                )}
                {startup.arr && (
                  <View style={s.tractionCell}>
                    <Text style={[s.tractionValue, { color: '#C4944A' }]}>{formatCurrency(startup.arr)}</Text>
                    <Text style={s.tractionLabel}>ARR</Text>
                  </View>
                )}
                {startup.users_count && (
                  <View style={s.tractionCell}>
                    <Text style={[s.tractionValue, { color: '#2E4820' }]}>{startup.users_count.toLocaleString()}</Text>
                    <Text style={s.tractionLabel}>Users</Text>
                  </View>
                )}
                {startup.growth_rate && (
                  <View style={s.tractionCell}>
                    <Text style={[s.tractionValue, { color: '#6DB882' }]}>+{startup.growth_rate}%</Text>
                    <Text style={s.tractionLabel}>Growth</Text>
                  </View>
                )}
              </View>
            </View>
            <Divider />
          </>
        )}

        {/* About */}
        {startup.description && (
          <>
            <View style={s.section}>
              <SectionLabel label="ABOUT" />
              <Text style={s.bodyText}>{startup.description}</Text>
            </View>
            <Divider />
          </>
        )}

        {/* Links */}
        {(startup.website || startup.linkedin_url) && (
          <>
            <View style={s.section}>
              <SectionLabel label="LINKS" />
              {startup.website && (
                <TouchableOpacity
                  onPress={() => safeOpenUrl(startup.website)}
                  style={s.linkRow}
                >
                  <Ionicons name="globe-outline" size={16} color="#2E4820" />
                  <Text style={s.linkText}>
                    {startup.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}
              {startup.linkedin_url && (
                <TouchableOpacity
                  onPress={() => safeOpenUrl(startup.linkedin_url)}
                  style={s.linkRow}
                >
                  <Ionicons name="logo-linkedin" size={16} color="#2E4820" />
                  <Text style={s.linkText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
            </View>
            <Divider />
          </>
        )}
      </ScrollView>

      {/* CTA for investors */}
      {isInvestor && !isOwner && (
        <View style={[s.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.ctaRow}>
            {/* Save / Like button */}
            <TouchableOpacity
              style={[s.saveBtn, isLiked && s.saveBtnActive]}
              onPress={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#E74C3C' : '#2E4820'}
              />
            </TouchableOpacity>

            {/* Primary action */}
            <View style={{ flex: 1 }}>
              {startup.allow_direct_messages ? (
                <Button
                  label="Send a Message"
                  onPress={handleDirectMessage}
                  loading={dmLoading}
                  variant="primary"
                  size="lg"
                  icon={<Ionicons name="chatbubble-outline" size={16} color="white" />}
                />
              ) : connection?.status === 'accepted' ? (
                <Button
                  label="Message"
                  onPress={() => router.push('/(tabs)/messages')}
                  variant="primary"
                  size="lg"
                  icon={<Ionicons name="chatbubble-outline" size={16} color="white" />}
                />
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
          </View>
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
  cover: {
    height: 120,
    backgroundColor: '#2E4820',
  },
  closeBtn: {
    position: 'absolute',
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -32,
    marginBottom: 12,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#F7F7F5',
  },
  raisingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#C4944A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  raisingText: {
    fontSize: 12,
    color: '#7D5A1E',
    fontWeight: '600',
  },
  nameBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  companyName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#AAAAAA',
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: '#EBEBEB',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
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
  tractionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  tractionCell: {
    width: '50%',
    paddingVertical: 10,
    paddingRight: 16,
  },
  tractionValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E4820',
    marginBottom: 2,
  },
  tractionLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  bodyText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 21,
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
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(247,247,245,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveBtn: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveBtnActive: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF5F5',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FDF6EC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8C9A0',
  },
  pendingText: {
    fontSize: 14,
    color: '#7D5A1E',
    fontWeight: '600',
  },
});
