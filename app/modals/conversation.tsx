import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { haptic } from '@/lib/haptics';
import { Avatar } from '@/components/ui/Avatar';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: meta } = useQuery({
    queryKey: ['conversation-meta', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id, investor_id, startup_id, connection_id,
          investor_user:profiles!conversations_investor_id_fkey(id, full_name, avatar_url),
          connection:connections(
            investor:profiles!connections_investor_id_fkey(full_name, avatar_url),
            startup:startup_profiles(company_name, logo_url)
          )
        `)
        .eq('id', id!)
        .single();

      if (!data) return null;

      // For direct convos (no connection), fetch startup info separately
      let startupName: string | null = null;
      let startupLogoUrl: string | null = null;
      if (!data.connection_id && data.startup_id) {
        const { data: sp } = await supabase
          .from('startup_profiles')
          .select('company_name, logo_url')
          .eq('profile_id', data.startup_id)
          .single();
        startupName = sp?.company_name ?? null;
        startupLogoUrl = sp?.logo_url ?? null;
      }

      return { ...data, startupName, startupLogoUrl };
    },
    enabled: !!id,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id!)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    enabled: !!id,
    refetchInterval: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: session!.user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic.light();
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`messages-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['messages', id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // Resolve other party info
  const isInvestor = profile?.account_type === 'investor';
  const isDirect   = meta && !meta.connection_id;
  const conn       = (meta?.connection as any);
  const invUser    = (meta?.investor_user as any);

  let otherName       = '...';
  let subLabel        = 'Loading…';
  let otherAvatar: string | null = null;
  let otherProfileId: string | null = null;

  if (meta) {
    if (isDirect) {
      if (isInvestor) {
        otherName     = (meta as any).startupName ?? 'Startup';
        otherAvatar   = (meta as any).startupLogoUrl ?? null;
        otherProfileId = meta.startup_id ?? null;
      } else {
        otherName     = invUser?.full_name ?? 'Investor';
        otherAvatar   = invUser?.avatar_url ?? null;
        otherProfileId = meta.investor_id ?? null;
      }
      subLabel = 'Direct message';
    } else {
      if (isInvestor) {
        otherName     = conn?.startup?.company_name ?? '…';
        otherAvatar   = conn?.startup?.logo_url ?? null;
        otherProfileId = meta.startup_id ?? null;
      } else {
        otherName     = conn?.investor?.full_name ?? '…';
        otherAvatar   = conn?.investor?.avatar_url ?? null;
        otherProfileId = meta.investor_id ?? null;
      }
      subLabel = 'Connection';
    }
  }

  const otherProfilePath = isInvestor ? '/modals/startup-detail' : '/modals/investor-detail';

  function navigateToProfile() {
    if (!otherProfileId) return;
    router.push({ pathname: otherProfilePath, params: { id: otherProfileId } } as any);
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#2E4820" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.headerContent}
          onPress={navigateToProfile}
          disabled={!otherProfileId}
          activeOpacity={0.7}
        >
          <Avatar uri={otherAvatar} name={otherName} size={36} />
          <View style={s.headerText}>
            <Text style={s.headerName}>{otherName}</Text>
            <View style={s.subRow}>
              {isDirect && (
                <View style={s.dmBadge}>
                  <Text style={s.dmBadgeText}>DM</Text>
                </View>
              )}
              <Text style={s.headerSub}>{subLabel}</Text>
            </View>
          </View>
          {otherProfileId && (
            <Ionicons name="chevron-forward" size={14} color="#CCCCCC" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#2E4820" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={() => (
            <View style={s.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={44} color="#CCCCCC" />
              <Text style={s.emptyTitle}>No messages yet</Text>
              <Text style={s.emptyBody}>Send the first message!</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isMe = item.sender_id === session?.user?.id;
            return (
              <View style={[s.bubbleRow, isMe ? s.bubbleRowMe : s.bubbleRowThem]}>
                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>
                    {item.content}
                  </Text>
                  <Text style={[s.bubbleTime, isMe ? s.bubbleTimeMe : s.bubbleTimeThem]}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={s.textWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={1000}
            style={s.textInput}
          />
        </View>
        <TouchableOpacity
          onPress={() => text.trim() && sendMutation.mutate(text.trim())}
          disabled={!text.trim() || sendMutation.isPending}
          style={[s.sendBtn, text.trim() ? s.sendActive : s.sendInactive]}
        >
          {sendMutation.isPending
            ? <ActivityIndicator color="white" size="small" />
            : <Ionicons name="send" size={16} color={text.trim() ? 'white' : '#AAAAAA'} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB',
    paddingHorizontal: 12, paddingBottom: 12, gap: 8,
  },
  backBtn:        { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerText:     { flex: 1 },
  headerName:     { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  subRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  dmBadge:        {
    backgroundColor: '#E8F5EE', borderWidth: 1, borderColor: '#6DB882',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  dmBadgeText:    { fontSize: 9, fontWeight: '700', color: '#2E4820', letterSpacing: 0.3 },
  headerSub:      { fontSize: 12, color: '#AAAAAA' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent:    { padding: 14, paddingBottom: 8, flexGrow: 1 },
  emptyWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  emptyTitle:     { color: '#777', fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptyBody:      { color: '#AAA', fontSize: 13, marginTop: 4 },
  bubbleRow:      { flexDirection: 'row' },
  bubbleRowMe:    { justifyContent: 'flex-end' },
  bubbleRowThem:  { justifyContent: 'flex-start' },
  bubble:         { maxWidth: '78%', paddingHorizontal: 13, paddingVertical: 10 },
  bubbleMe:       { backgroundColor: '#2E4820', borderRadius: 10, borderBottomRightRadius: 2 },
  bubbleThem:     { backgroundColor: '#F0F0F0', borderRadius: 10, borderBottomLeftRadius: 2 },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  bubbleTextMe:   { color: '#FFF' },
  bubbleTextThem: { color: '#1A1A1A' },
  bubbleTime:     { fontSize: 11, marginTop: 4 },
  bubbleTimeMe:   { color: '#E8C9A0', opacity: 0.7 },
  bubbleTimeThem: { color: '#AAA' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  textWrap: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 6, borderWidth: 1,
    borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 8, minHeight: 40,
  },
  textInput:  { fontSize: 15, color: '#1A1A1A', maxHeight: 100 },
  sendBtn:    { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sendActive: { backgroundColor: '#2E4820' },
  sendInactive:{ backgroundColor: '#EBEBEB' },
});
