import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function StartupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const showToast = useUIStore((s) => s.showToast);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [mrr, setMrr] = useState('');
  const [isRaising, setIsRaising] = useState(true);
  const [raisingAmount, setRaisingAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!description.trim()) {
      showToast('Please add a description', 'error');
      return;
    }
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from('startup_profiles').update({
      description: description.trim(),
      website: website.trim() || null,
      team_size: teamSize ? parseInt(teamSize, 10) : null,
      founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
      mrr: mrr ? parseFloat(mrr) : null,
      is_raising: isRaising,
      raising_amount: raisingAmount ? parseFloat(raisingAmount) : null,
    }).eq('profile_id', session.user.id);
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      router.push('/(auth)/onboarding/startup/pitch-video');
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-card" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-forest-800 px-6 pb-8" style={{ paddingTop: insets.top + 16 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="#E8C9A0" />
          </TouchableOpacity>
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3].map((i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-accent' : 'bg-forest-600'}`} />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 2 of 3</Text>
          <Text className="text-3xl font-black text-white">More about</Text>
          <Text className="text-3xl font-black text-accent">your startup.</Text>
        </View>

        <View className="px-6 pt-8">
          <Text className="text-sm font-medium text-text-secondary mb-1.5">Description</Text>
          <View className="bg-surface-input rounded-2xl mb-4 p-4">
            <TextInput
              style={{ minHeight: 100, textAlignVertical: 'top', fontSize: 15, color: '#1A1A1A' }}
              onChangeText={setDescription}
              value={description}
              placeholder="What problem are you solving? How? Why now?"
              placeholderTextColor="#9A9A9A"
              multiline
              numberOfLines={4}
            />
          </View>

          <Input label="Website" placeholder="https://yourstartup.com" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" leftIcon="globe-outline" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Team Size" placeholder="5" value={teamSize} onChangeText={setTeamSize} keyboardType="numeric" leftIcon="people-outline" />
            </View>
            <View className="flex-1">
              <Input label="Founded Year" placeholder="2023" value={foundedYear} onChangeText={setFoundedYear} keyboardType="numeric" leftIcon="calendar-outline" />
            </View>
          </View>
          <Input label="Monthly Revenue (MRR)" placeholder="50000" value={mrr} onChangeText={setMrr} keyboardType="numeric" leftIcon="trending-up-outline" hint="In USD, optional" />

          <View className="flex-row items-center justify-between mb-4 bg-white rounded-2xl p-4">
            <View>
              <Text className="font-semibold text-text-primary">Currently Raising?</Text>
              <Text className="text-text-secondary text-sm">Show investors you're fundraising</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsRaising((v) => !v)}
              className={`w-12 h-7 rounded-full items-center justify-center ${isRaising ? 'bg-accent' : 'bg-gray-300'}`}
            >
              <View className={`w-5 h-5 bg-white rounded-full ${isRaising ? 'ml-auto mr-1' : 'ml-1'}`} />
            </TouchableOpacity>
          </View>

          {isRaising && (
            <Input label="Raising Amount" placeholder="500000" value={raisingAmount} onChangeText={setRaisingAmount} keyboardType="numeric" leftIcon="cash-outline" hint="Target raise in USD" />
          )}

          <Button label="Continue" onPress={handleNext} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
