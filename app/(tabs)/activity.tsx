import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Avatar } from '@/components/ui/Avatar';
import type { Notification } from '@/types/database';

const ICON_CFG: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  connection_request:  { name: 'people-outline',      color: '#6DB882', bg: '#E8F5EE' },
  connection_accepted: { name: 'checkmark-circle',    color: '#2E4820', bg: '#D4EDD9' },
  message:             { name: 'chatbubble-outline',  color: '#C4944A', bg: '#FDF3E3' },
  pitch_viewed:        { name: 'eye-outline',          color: '#8B5E3C', bg: '#F5EDE5' },
};

export default function ActivityScreen() {
  const insets    = useSafeAreaInsets();
  const router    = useRouter();
  const session   = useAuthStore((s) => s.session);
  const profile   = useAuthStore((s) => s.profile);
  const setUnread = useUIStore((s) => s.setUnreadNotifications);
  const showToast = useUIStore((s) => s.showToast);
  const qc        = useQueryClient();

  // Track which connection_ids the user has already responded to (local only)
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  // ── Notifications + connection details in one query ──────────────────────
  const { data = { notifications: [] as Notification[], connMap: {} as Record<string, any> }, isLoading } = useQuery({
    queryKey: ['notifications-full', session?.user?.id],
    queryFn: async () => {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const notifications = (notifs ?? []) as Notification[];

      // Batch-fetch connection info for connection_request notifications
      const connIds = notifications
        .filter((n) => n.type === 'connection_request' && (n.data as any)?.connection_id)
        .map((n) => (n.data as any).connection_id as string);

      if (!connIds.length) return { notifications, connMap: {} };

      const { data: conns } = await supabase
        .from('connections')
        .select(`
          id, investor_id, startup_id, status,
          investor:profiles!connections_investor_id_fkey(full_name, avatar_url)
        `)
        .in('id', connIds);

      // Fetch startup profiles for the startup_ids
      const startupIds = (conns ?? []).map((c) => c.startup_id).filter(Boolean);
      let spMap: Record<string, { company_name: string; logo_url: string | null }> = {};
      if (startupIds.length) {
        const { data: sps } = await supabase
          .from('startup_profiles')
          .select('profile_id, company_name, logo_url')
          .in('profile_id', startupIds);
        spMap = Object.fromEntries((sps ?? []).map((s) => [s.profile_id, s]));
      }

      const connMap: Record<string, any> = {};
      for (const c of conns ?? []) {
        connMap[c.id] = { ...c, startupProfile: spMap[c.startup_id] ?? null };
      }

      return { notifications, connMap };
    },
    enabled: !!session,
  });

  const { notifications, connMap } = data;

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', session!.user.id)
        .is('read_at', null);
    },
    onSuccess: () => {
      setUnread(0);
      qc.invalidateQueries({ queryKey: ['notifications-full'] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase.from('connections').update({ status }).eq('id', connectionId);
      if (error) throw error;
    },
    onSuccess: async (_, vars) => {
      setRespondedIds((prev) => new Set([...prev, vars.connectionId]));
      showToast(
        vars.status === 'accepted' ? 'Connection accepted!' : 'Connection declined.',
        vars.status === 'accepted' ? 'success' : 'info',
      );
      qc.invalidateQueries({ queryKey: ['notifications-full'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['feed'] });

      if (vars.status === 'accepted') {
        // Wait briefly for the trigger to create the conversation, then navigate
        setTimeout(async () => {
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('connection_id', vars.connectionId)
            .maybeSingle();
          if (conv) {
            router.push({ pathname: '/modals/conversation', params: { id: conv.id } } as any);
          }
        }, 800);
      }
    },
    onError: (e: any) => showToast(e.message, 'error'),
  });

  useEffect(() => {
    setUnread(notifications.filter((n) => !n.read_at).length);
  }, [notifications]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Activity</Text>
        {notifications.some((n) => !n.read_at) && (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={s.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#2E4820" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <View style={s.empty}>
              <Ionicons name="notifications-outline" size={44} color="#9DB890" />
              <Text style={s.emptyTitle}>No notifications yet</Text>
              <Text style={s.emptyBody}>Connections, messages, and pitch views will appear here</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const cfg = ICON_CFG[item.type] ?? { name: 'notifications-outline' as any, color: '#9A9A9A', bg: '#F2F2F0' };
            const connId = (item.data as any)?.connection_id as string | undefined;
            const conn   = connId ? connMap[connId] : null;
            const isRequest = item.type === 'connection_request' && !!connId;
            const hasResponded = !!connId && respondedIds.has(connId);

            // Resolve requester info from connection
            const isStartupUser = profile?.account_type === 'startup';
            let requesterName   = '';
            let requesterAvatar: string | null = null;
            if (conn) {
              if (isStartupUser) {
                const inv = conn.investor as any;
                requesterName   = inv?.full_name ?? 'An investor';
                requesterAvatar = inv?.avatar_url ?? null;
              } else {
                const sp = conn.startupProfile;
                requesterName   = sp?.company_name ?? 'A startup';
                requesterAvatar = sp?.logo_url ?? null;
              }
            }

            const displayBody = (isRequest && requesterName)
              ? `${requesterName} wants to connect with you.`
              : item.body;

            return (
              <View style={[s.item, !item.read_at && s.itemUnread]}>
                {!item.read_at && <View style={s.unreadBar} />}

                {/* Requester avatar (for connection requests) or icon */}
                {isRequest && (requesterAvatar || requesterName) ? (
                  <View style={s.avatarWrap}>
                    {requesterAvatar
                      ? <Image source={{ uri: requesterAvatar }} style={s.requesterAvatar} contentFit="cover" />
                      : <Avatar uri={null} name={requesterName} size={40} />}
                    {/* Mini icon badge */}
                    <View style={[s.iconBadge, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.name} size={11} color={cfg.color} />
                    </View>
                  </View>
                ) : (
                  <View style={[s.iconBox, { backgroundColor: cfg.bg, borderColor: cfg.color + '33' }]}>
                    <Ionicons name={cfg.name} size={16} color={cfg.color} />
                  </View>
                )}

                <View style={s.body}>
                  <View style={s.top}>
                    <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.itemTime}>
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                  <Text style={s.itemBody} numberOfLines={2}>{displayBody}</Text>

                  {/* Accept / Decline — only for connection_request, hidden once responded */}
                  {isRequest && !hasResponded && (
                    <View style={s.actions}>
                      <TouchableOpacity
                        style={s.acceptBtn}
                        onPress={() => respondMutation.mutate({ connectionId: connId!, status: 'accepted' })}
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending
                          ? <ActivityIndicator color="white" size="small" />
                          : <Text style={s.acceptText}>Accept</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.declineBtn}
                        onPress={() => respondMutation.mutate({ connectionId: connId!, status: 'rejected' })}
                        disabled={respondMutation.isPending}
                      >
                        <Text style={s.declineText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {isRequest && hasResponded && (
                    <Text style={s.respondedLabel}>Responded</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F2F7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2E4820', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
  },
  title:        { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  markRead:     { fontSize: 13, fontWeight: '500', color: '#A8DDBA' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle:   { color: '#4A5C48', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptyBody:    { color: '#7A9078', fontSize: 13, textAlign: 'center', marginTop: 4 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#DDE8DC', gap: 12, position: 'relative',
  },
  itemUnread:   { backgroundColor: '#F8FCF8' },
  unreadBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#6DB882' },

  // Icon variants
  iconBox:      { width: 38, height: 38, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarWrap:   { position: 'relative', flexShrink: 0 },
  requesterAvatar:{ width: 40, height: 40, borderRadius: 20 },
  iconBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },

  body:         { flex: 1 },
  top:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  itemTitle:    { fontSize: 14, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  itemTime:     { fontSize: 12, color: '#7A9078', marginLeft: 8, flexShrink: 0 },
  itemBody:     { fontSize: 13, color: '#4A5C48', lineHeight: 18 },
  actions:      { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn:    { backgroundColor: '#2E4820', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6, minWidth: 80, alignItems: 'center' },
  acceptText:   { color: '#FFF', fontSize: 13, fontWeight: '700' },
  declineBtn:   { borderWidth: 1, borderColor: '#DDE8DC', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 6 },
  declineText:  { color: '#4A5C48', fontSize: 13, fontWeight: '500' },
  respondedLabel:{ fontSize: 12, color: '#7A9078', fontStyle: 'italic', marginTop: 8 },
});
