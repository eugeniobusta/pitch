import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import type { IndustryType, StartupStage } from '@/types/database';

const INDUSTRIES: { value: IndustryType; label: string }[] = [
  { value: 'ai_ml', label: 'AI / ML' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthtech', label: 'Healthtech' },
  { value: 'edtech', label: 'Edtech' },
  { value: 'saas', label: 'SaaS' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'deeptech', label: 'Deep Tech' },
  { value: 'climate', label: 'Climate' },
  { value: 'other', label: 'Other' },
];

const STAGES: { value: StartupStage; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b_plus', label: 'Series B+' },
];

export default function InvestorPreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const showToast = useUIStore((s) => s.showToast);
  const [industries, setIndustries] = useState<IndustryType[]>([]);
  const [stages, setStages] = useState<StartupStage[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleIndustry(v: IndustryType) {
    setIndustries((prev) => prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]);
  }
  function toggleStage(v: StartupStage) {
    setStages((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);
  }

  async function handleNext() {
    if (industries.length === 0 || stages.length === 0) {
      showToast('Select at least one industry and stage', 'error');
      return;
    }
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from('investor_profiles').update({ industries, stages }).eq('profile_id', session.user.id);
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      router.push('/(auth)/onboarding/investor/portfolio');
    }
  }

  return (
    <View className="flex-1 bg-surface-card">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}>
        <View className="bg-forest-800 px-6 pb-8" style={{ paddingTop: insets.top + 16 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="#E8C9A0" />
          </TouchableOpacity>
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-accent' : 'bg-forest-600'}`} />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 2 of 4</Text>
          <Text className="text-3xl font-black text-white">Investment</Text>
          <Text className="text-3xl font-black text-accent">preferences.</Text>
        </View>

        <View className="px-6 pt-8">
          <Text className="font-bold text-text-primary mb-3 text-base">Industries you invest in</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {INDUSTRIES.map((ind) => (
              <TouchableOpacity
                key={ind.value}
                onPress={() => toggleIndustry(ind.value)}
                className={`px-3 py-2 rounded-xl border ${industries.includes(ind.value) ? 'bg-forest-800 border-forest-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-medium ${industries.includes(ind.value) ? 'text-white' : 'text-text-primary'}`}>{ind.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-bold text-text-primary mb-3 text-base">Preferred stages</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {STAGES.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => toggleStage(s.value)}
                className={`px-4 py-2 rounded-xl border ${stages.includes(s.value) ? 'bg-forest-800 border-forest-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-medium ${stages.includes(s.value) ? 'text-white' : 'text-text-primary'}`}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label="Continue" onPress={handleNext} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </View>
  );
}
