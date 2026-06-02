import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

type SearchTab = 'startups' | 'investors';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('startups');

  const { data: startups = [], isLoading: loadingStartups } = useQuery({
    queryKey: ['search-startups', query],
    queryFn: async () => {
      let q = supabase
        .from('startup_profiles')
        .select('*, profile:profiles(full_name, avatar_url)')
        .eq('is_active', true)
        .order('views_count', { ascending: false })
        .limit(30);
      if (query.trim()) {
        q = q.ilike('company_name', `%${query.trim()}%`);
      }
      const { data } = await q;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: investors = [], isLoading: loadingInvestors } = useQuery({
    queryKey: ['search-investors', query],
    queryFn: async () => {
      let q = supabase
        .from('investor_profiles')
        .select('*, profile:profiles(full_name, avatar_url)')
        .order('connections_count', { ascending: false })
        .limit(30);
      if (query.trim()) {
        q = q.ilike('firm_name', `%${query.trim()}%`);
      }
      const { data } = await q;
      return data ?? [];
    },
    enabled: tab === 'investors',
    staleTime: 30_000,
  });

  const isLoading = tab === 'startups' ? loadingStartups : loadingInvestors;
  const data = tab === 'startups' ? startups : investors;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchInputWrap}>
          <Input
            placeholder="Search startups, investors..."
            value={query}
            onChangeText={setQuery}
            leftIcon="search-outline"
            rightIcon={query ? 'close-circle' : undefined}
            onRightIconPress={() => setQuery('')}
          />
        </View>
        {/* Underline Tabs */}
        <View style={styles.tabRow}>
          {(['startups', 'investors'] as SearchTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={styles.tabItem}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#2E4820" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => null}
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}
          renderItem={({ item }) =>
            tab === 'startups' ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/modals/startup-detail', params: { id: item.profile_id } })
                }
                style={styles.row}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.logo_url ?? '' }}
                  style={styles.startupLogo}
                  contentFit="cover"
                />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.company_name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{item.tagline}</Text>
                </View>
                <View style={styles.rowTags}>
                  <Badge label={item.industry.replace('_', ' ')} variant="green" />
                  <View style={{ height: 4 }} />
                  <Badge label={item.stage.replace('_', ' ')} variant="muted" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/modals/investor-detail', params: { id: item.profile_id } })
                }
                style={styles.row}
                activeOpacity={0.7}
              >
                <Avatar uri={item.profile?.avatar_url} name={item.profile?.full_name} size={40} />
                <View style={styles.rowBody}>
                  <View style={styles.investorNameRow}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{item.profile?.full_name}</Text>
                    {item.is_verified && (
                      <Ionicons name="checkmark-circle" size={14} color="#6DB882" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.title}{item.firm_name ? ` · ${item.firm_name}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchInputWrap: {
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 0,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AAAAAA',
    paddingVertical: 10,
  },
  tabLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2E4820',
    borderRadius: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    color: '#AAAAAA',
    marginTop: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: 12,
  },
  startupLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 13,
    color: '#777777',
  },
  rowTags: {
    alignItems: 'flex-end',
  },
  investorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
});
