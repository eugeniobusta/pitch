import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

export default function StartupBasicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const showToast = useUIStore((s) => s.showToast);
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState<IndustryType | null>(null);
  const [stage, setStage] = useState<StartupStage | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!companyName.trim() || !tagline.trim() || !industry || !stage) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from('startup_profiles').upsert({
      profile_id: session.user.id,
      company_name: companyName.trim(),
      tagline: tagline.trim(),
      industry,
      stage,
    }, { onConflict: 'profile_id' });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      router.push('/(auth)/onboarding/startup/details');
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-card" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-forest-800 px-6 pb-8" style={{ paddingTop: insets.top + 16 }}>
          {/* Progress */}
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3].map((i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-accent' : 'bg-forest-600'}`} />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 1 of 3</Text>
          <Text className="text-3xl font-black text-white">Tell us about</Text>
          <Text className="text-3xl font-black text-accent">your startup.</Text>
        </View>

        <View className="px-6 pt-8">
          <Input
            label="Company Name"
            placeholder="Acme Inc."
            value={companyName}
            onChangeText={setCompanyName}
            autoCapitalize="words"
          />
          <Input
            label="Tagline"
            placeholder="One sentence that sells your startup"
            value={tagline}
            onChangeText={setTagline}
            maxLength={120}
            hint={`${tagline.length}/120`}
          />

          <Text className="text-sm font-medium text-text-secondary mb-3">Industry</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {INDUSTRIES.map((ind) => (
              <TouchableOpacity
                key={ind.value}
                onPress={() => setIndustry(ind.value)}
                className={`px-3 py-2 rounded-xl border ${industry === ind.value ? 'bg-forest-800 border-forest-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-medium ${industry === ind.value ? 'text-white' : 'text-text-primary'}`}>
                  {ind.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-medium text-text-secondary mb-3">Stage</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {STAGES.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setStage(s.value)}
                className={`px-4 py-2 rounded-xl border ${stage === s.value ? 'bg-forest-800 border-forest-700' : 'border-gray-200 bg-white'}`}
              >
                <Text className={`text-sm font-medium ${stage === s.value ? 'text-white' : 'text-text-primary'}`}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label="Continue" onPress={handleNext} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
