import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', session?.user?.id],
    queryFn: async () => {
      // Step 1: conversations + connection-based participant info
      const { data: convs } = await supabase
        .from('conversations')
        .select(`
          id, created_at, investor_id, startup_id, connection_id,
          connection:connections(
            id, status,
            investor:profiles!connections_investor_id_fkey(id, full_name, avatar_url),
            startup:startup_profiles(company_name, logo_url, profile_id)
          ),
          investor_user:profiles!conversations_investor_id_fkey(id, full_name, avatar_url),
          messages(content, created_at, sender_id)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!convs?.length) return [];

      // Step 2: for direct convos (no connection), fetch startup info separately
      const directIds = convs
        .filter((c) => !c.connection_id && c.startup_id)
        .map((c) => c.startup_id as string);

      let startupMap: Record<string, { company_name: string; logo_url: string | null }> = {};
      if (directIds.length) {
        const { data: sp } = await supabase
          .from('startup_profiles')
          .select('profile_id, company_name, logo_url')
          .in('profile_id', directIds);
        if (sp) startupMap = Object.fromEntries(sp.map((s) => [s.profile_id, s]));
      }

      return convs.map((c) => ({ ...c, _startupInfo: startupMap[c.startup_id ?? ''] ?? null }));
    },
    enabled: !!session,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color="#2E4820" /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyBody}>
                {profile?.account_type === 'investor'
                  ? 'Connect with a startup or send a direct message to get started'
                  : 'Accepted connections and direct messages will appear here'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isInvestor = profile?.account_type === 'investor';
            const isDirect   = !item.connection_id;
            const conn       = item.connection as any;
            const invUser    = item.investor_user as any;
            const spInfo     = (item as any)._startupInfo;

            let otherName: string;
            let otherAvatar: string | undefined;

            if (isDirect) {
              if (isInvestor) {
                otherName   = spInfo?.company_name ?? 'Startup';
                otherAvatar = spInfo?.logo_url ?? undefined;
              } else {
                otherName   = invUser?.full_name ?? 'Investor';
                otherAvatar = invUser?.avatar_url ?? undefined;
              }
            } else {
              otherName   = isInvestor ? conn?.startup?.company_name ?? 'Startup' : conn?.investor?.full_name ?? 'Investor';
              otherAvatar = isInvestor ? conn?.startup?.logo_url : conn?.investor?.avatar_url;
            }

            const lastMsg = (item.messages as any[])
              ?.slice()
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/modals/conversation', params: { id: item.id } } as any)}
                style={styles.row}
                activeOpacity={0.7}
              >
                <Avatar uri={otherAvatar} name={otherName} size={44} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.rowName} numberOfLines={1}>{otherName}</Text>
                      {isDirect && (
                        <View style={styles.dmTag}>
                          <Text style={styles.dmTagText}>DM</Text>
                        </View>
                      )}
                    </View>
                    {lastMsg && (
                      <Text style={styles.rowTime}>
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.rowPreview} numberOfLines={1}>
                    {lastMsg ? lastMsg.content : 'Start the conversation'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F2F7F2' },
  header:     {
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
  },
  title:      { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { color: '#777', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptyBody:  { color: '#AAA', fontSize: 13, textAlign: 'center', marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB', gap: 12,
  },
  rowBody:   { flex: 1 },
  rowTop:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3,
  },
  nameWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowName:   { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flexShrink: 1 },
  dmTag:     {
    backgroundColor: '#E8F5EE', borderWidth: 1, borderColor: '#6DB882',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  dmTagText: { fontSize: 10, fontWeight: '700', color: '#2E4820', letterSpacing: 0.3 },
  rowTime:   { fontSize: 12, color: '#AAA', flexShrink: 0, marginLeft: 8 },
  rowPreview:{ fontSize: 13, color: '#777' },
});
