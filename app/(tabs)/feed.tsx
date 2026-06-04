import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, FlatList, Dimensions, TouchableOpacity,
  ActivityIndicator, ViewToken, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { useUIStore } from '@/store/uiStore';
import { haptic } from '@/lib/haptics';
import { Avatar } from '@/components/ui/Avatar';
import type { FeedItem } from '@/types/database';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function FeedCard({ item, isActive, isMuted }: { item: FeedItem; isActive: boolean; isMuted: boolean }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showInfo, setShowInfo] = useState(false);

  const player = useVideoPlayer(
    item.pitch_video_url ? { uri: item.pitch_video_url } : null,
    (p) => {
      p.loop = true;
      p.muted = isMuted;
      if (isActive) p.play();
    }
  );

  React.useEffect(() => {
    if (!player) return;
    player.muted = isMuted;
  }, [isMuted]);

  React.useEffect(() => {
    if (!player) return;
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user || !item.id) return;
      const { error } = await supabase.from('connections').insert({
        investor_id: session.user.id,
        startup_id: item.profile_id,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      haptic.success();
      showToast('Connection request sent!', 'success');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (e: any) => showToast(e.message, 'error'),
  });

  const isInvestor = profile?.account_type === 'investor';
  const canConnect = isInvestor && !item.is_connected && item.connection_status !== 'pending';

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      {/* Video / Thumbnail */}
      {item.pitch_video_url && Platform.OS !== 'web' ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: item.pitch_video_thumbnail ?? item.logo_url ?? '' }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />
      )}

      {/* Gradient overlay */}
      <View style={feedStyles.gradientWrap} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(26,46,15,0.97)']}
          style={{ flex: 1 }}
        />
      </View>

      {/* Right Actions */}
      <View style={feedStyles.rightActions}>
        <TouchableOpacity
          style={feedStyles.actionItem}
          onPress={() =>
            router.push({ pathname: '/modals/startup-detail', params: { id: item.profile_id } })
          }
        >
          <Avatar uri={item.logo_url} size={44} />
          <View style={feedStyles.addBadge}>
            <Ionicons name="add" size={10} color="white" />
          </View>
        </TouchableOpacity>

        {canConnect && (
          <TouchableOpacity
            style={feedStyles.actionItem}
            onPress={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            <View style={feedStyles.actionBtn}>
              {connectMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="people-outline" size={22} color="white" />
              )}
            </View>
            <Text style={feedStyles.actionLabel}>Connect</Text>
          </TouchableOpacity>
        )}

        {item.connection_status === 'pending' && (
          <View style={feedStyles.actionItem}>
            <View style={[feedStyles.actionBtn, { backgroundColor: '#C4944A' }]}>
              <Ionicons name="time-outline" size={22} color="white" />
            </View>
            <Text style={feedStyles.actionLabel}>Pending</Text>
          </View>
        )}

        {item.is_connected && (
          <View style={feedStyles.actionItem}>
            <View style={[feedStyles.actionBtn, { backgroundColor: 'rgba(46,72,32,0.7)' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#6DB882" />
            </View>
            <Text style={feedStyles.actionLabel}>Connected</Text>
          </View>
        )}

        <TouchableOpacity style={feedStyles.actionItem} onPress={() => setShowInfo((v) => !v)}>
          <View style={[feedStyles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name="information-circle-outline" size={22} color="white" />
          </View>
          <Text style={feedStyles.actionLabel}>Info</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={feedStyles.bottomInfo}>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/modals/startup-detail', params: { id: item.profile_id } })
          }
        >
          <View style={feedStyles.companyRow}>
            <Image
              source={{ uri: item.logo_url ?? '' }}
              style={feedStyles.companyLogo}
              contentFit="cover"
            />
            <Text style={feedStyles.companyName}>{item.company_name}</Text>
          </View>
          <Text style={feedStyles.tagline} numberOfLines={2}>
            {item.tagline}
          </Text>
        </TouchableOpacity>

        <View style={feedStyles.tagsRow}>
          <View style={feedStyles.tag}>
            <Text style={feedStyles.tagText}>
              {item.industry?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={feedStyles.tag}>
            <Text style={feedStyles.tagText}>
              {item.stage?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {item.is_raising && item.raising_amount && (
            <View style={[feedStyles.tag, feedStyles.tagAmber]}>
              <Text style={[feedStyles.tagText, { color: '#E8C9A0' }]}>
                RAISING {formatCurrency(item.raising_amount).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {showInfo && (
          <View style={feedStyles.infoPanel}>
            <Text style={feedStyles.infoPanelText} numberOfLines={4}>
              {item.description}
            </Text>
            {item.mrr && (
              <Text style={feedStyles.infoPanelMrr}>
                MRR: {formatCurrency(item.mrr)}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const { activeIndex, isMuted, setActiveIndex, toggleMute } = useFeedStore();
  const router = useRouter();

  const { data: feedItems = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ['feed', session?.user?.id],
    queryFn: async () => {
      if (profile?.account_type === 'investor' && session?.user) {
        const { data } = await supabase.rpc('get_personalized_feed', {
          p_investor_id: session.user.id,
          p_limit: 20,
          p_offset: 0,
        });
        return (data ?? []) as FeedItem[];
      }
      const { data } = await supabase
        .from('startup_profiles')
        .select('*, profile:profiles(id, full_name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []) as any[];
    },
    enabled: !!session,
  });

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <View style={feedStyles.loadingWrap}>
        <ActivityIndicator color="#6DB882" size="large" />
        <Text style={feedStyles.loadingText}>Loading pitches...</Text>
      </View>
    );
  }

  if (!feedItems.length) {
    return (
      <View style={feedStyles.emptyWrap}>
        <Ionicons name="videocam-outline" size={56} color="#3A5C28" />
        <Text style={feedStyles.emptyTitle}>No pitches yet</Text>
        <Text style={feedStyles.emptyBody}>Check back soon for new startup pitches</Text>
      </View>
    );
  }

  return (
    <View style={feedStyles.screen}>
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FeedCard item={item} isActive={index === activeIndex} isMuted={isMuted} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
      />

      {/* Top HUD */}
      <View
        style={[feedStyles.hud, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Text style={feedStyles.hudTitle}>Pitch</Text>
        <View style={feedStyles.hudRight}>
          <TouchableOpacity
            onPress={toggleMute}
            style={feedStyles.hudBtn}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={18}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            style={feedStyles.hudBtn}
          >
            <Ionicons name="options-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A1A06',
  },
  gradientWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  // Right action buttons
  rightActions: {
    position: 'absolute',
    right: 14,
    bottom: 140,
    alignItems: 'center',
    gap: 18,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#6DB882',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6DB882',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 88,
    left: 14,
    right: 72,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  companyLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  tagline: {
    color: '#E8C9A0',
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 10,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagAmber: {
    borderColor: 'rgba(196,148,74,0.5)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  infoPanel: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  infoPanelText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 19,
  },
  infoPanelMrr: {
    fontSize: 13,
    color: '#2E4820',
    fontWeight: '700',
    marginTop: 6,
  },
  // HUD
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hudTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hudBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#0A1A06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#E8C9A0',
    marginTop: 12,
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: '#0A1A06',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    color: '#E8C9A0',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 14,
  },
});
