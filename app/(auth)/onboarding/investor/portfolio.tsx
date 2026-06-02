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

export default function InvestorPortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const showToast = useUIStore((s) => s.showToast);
  const [minInvestment, setMinInvestment] = useState('');
  const [maxInvestment, setMaxInvestment] = useState('');
  const [portfolioCount, setPortfolioCount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from('investor_profiles').update({
      min_investment: minInvestment ? parseFloat(minInvestment) : null,
      max_investment: maxInvestment ? parseFloat(maxInvestment) : null,
      portfolio_count: portfolioCount ? parseInt(portfolioCount, 10) : null,
    }).eq('profile_id', session.user.id);
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      router.push('/(auth)/onboarding/investor/verification');
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-card" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View className="bg-forest-800 px-6 pb-8" style={{ paddingTop: insets.top + 16 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="#E8C9A0" />
          </TouchableOpacity>
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-accent' : 'bg-forest-600'}`} />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 3 of 4</Text>
          <Text className="text-3xl font-black text-white">Portfolio &</Text>
          <Text className="text-3xl font-black text-accent">ticket size.</Text>
        </View>

        <View className="px-6 pt-8">
          <Text className="text-text-secondary mb-6">These help startups understand if you're the right fit for them.</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Min Investment ($)" placeholder="25000" value={minInvestment} onChangeText={setMinInvestment} keyboardType="numeric" leftIcon="arrow-down-outline" />
            </View>
            <View className="flex-1">
              <Input label="Max Investment ($)" placeholder="250000" value={maxInvestment} onChangeText={setMaxInvestment} keyboardType="numeric" leftIcon="arrow-up-outline" />
            </View>
          </View>
          <Input label="Portfolio Companies" placeholder="12" value={portfolioCount} onChangeText={setPortfolioCount} keyboardType="numeric" leftIcon="briefcase-outline" hint="Number of companies you've invested in" />
          <Button label="Continue" onPress={handleNext} loading={loading} size="lg" />
          <Button label="Skip" onPress={() => router.push('/(auth)/onboarding/investor/verification')} variant="ghost" size="md" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
