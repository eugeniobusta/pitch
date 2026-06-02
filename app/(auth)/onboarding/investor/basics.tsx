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

export default function InvestorBasicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const showToast = useUIStore((s) => s.showToast);
  const [firmName, setFirmName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!title.trim()) {
      showToast('Please add your title', 'error');
      return;
    }
    if (!session?.user) return;
    setLoading(true);
    const { error } = await supabase.from('investor_profiles').upsert({
      profile_id: session.user.id,
      firm_name: firmName.trim() || null,
      title: title.trim(),
      bio: bio.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    }, { onConflict: 'profile_id' });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      router.push('/(auth)/onboarding/investor/preferences');
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-card" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View className="bg-forest-800 px-6 pb-8" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row gap-1.5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? 'bg-accent' : 'bg-forest-600'}`} />
            ))}
          </View>
          <Text className="text-cream opacity-70 text-sm mb-1">Step 1 of 4</Text>
          <Text className="text-3xl font-black text-white">Your investor</Text>
          <Text className="text-3xl font-black text-accent">profile.</Text>
        </View>

        <View className="px-6 pt-8">
          <Input label="Firm / Fund Name" placeholder="Sequoia Capital" value={firmName} onChangeText={setFirmName} autoCapitalize="words" leftIcon="business-outline" />
          <Input label="Title *" placeholder="Partner, Angel Investor, GP..." value={title} onChangeText={setTitle} autoCapitalize="words" leftIcon="briefcase-outline" />
          <Input label="LinkedIn" placeholder="linkedin.com/in/yourname" value={linkedinUrl} onChangeText={setLinkedinUrl} keyboardType="url" autoCapitalize="none" leftIcon="logo-linkedin" />

          <Text className="text-sm font-medium text-text-secondary mb-1.5">Short Bio</Text>
          <View className="bg-surface-input rounded-2xl mb-6 p-4">
            <TextInput
              style={{ minHeight: 80, textAlignVertical: 'top', fontSize: 15, color: '#1A1A1A' }}
              onChangeText={setBio}
              value={bio}
              placeholder="Brief background and what you look for in investments..."
              placeholderTextColor="#9A9A9A"
              multiline
            />
          </View>

          <Button label="Continue" onPress={handleNext} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
