import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';

export default function InvestorVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const { setInvestorProfile, setProfile } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const [isAccredited, setIsAccredited] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (!session?.user) return;
    setLoading(true);
    await supabase.from('investor_profiles').update({ is_accredited: isAccredited }).eq('profile_id', session.user.id);
    await supabase.from('profiles').update({ is_onboarded: true }).eq('id', session.user.id);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    const { data: investorProfile } = await supabase.from('investor_profiles').select('*').eq('profile_id', session.user.id).single();
    if (profile) setProfile(profile as any);
    if (investorProfile) setInvestorProfile(investorProfile as any);
    setLoading(false);
    showToast('Welcome to Pitch!', 'success');
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
              <View key={i} className="h-1 flex-1 rounded-full bg-accent" />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 4 of 4 — Final step</Text>
          <Text className="text-3xl font-black text-white">Accredited</Text>
          <Text className="text-3xl font-black text-accent">investor?</Text>
        </View>

        <View className="px-6 pt-8">
          <View className="bg-amber-50 rounded-3xl p-5 mb-8 border border-amber-200">
            <Text className="font-bold text-warm text-base mb-2">What is an accredited investor?</Text>
            <Text className="text-text-secondary text-sm leading-5">
              In the US, an accredited investor has annual income exceeding $200K or a net worth over $1M (excluding primary residence). This self-attestation is required by law for certain investment activities.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsAccredited((v) => !v)}
            className={`flex-row items-center p-5 rounded-3xl border-2 mb-8 ${isAccredited ? 'border-forest-700 bg-forest-800' : 'border-gray-200 bg-white'}`}
          >
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${isAccredited ? 'bg-accent border-accent' : 'border-gray-400'}`}>
              {isAccredited && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <View className="flex-1">
              <Text className={`font-semibold ${isAccredited ? 'text-white' : 'text-text-primary'}`}>
                I confirm I am an accredited investor
              </Text>
              <Text className={`text-sm mt-0.5 ${isAccredited ? 'text-cream opacity-70' : 'text-text-secondary'}`}>
                I meet the SEC criteria stated above
              </Text>
            </View>
          </TouchableOpacity>

          <Button label="Launch Pitch" onPress={handleFinish} loading={loading} size="lg" variant="secondary" />
          <Button label="Skip verification" onPress={handleFinish} variant="ghost" size="md" />
        </View>
      </ScrollView>
    </View>
  );
}
