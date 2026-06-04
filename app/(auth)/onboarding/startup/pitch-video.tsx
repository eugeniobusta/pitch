import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';

export default function PitchVideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const { setStartupProfile, setProfile } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to pick a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function handleUpload() {
    if (!videoUri || !session?.user) return;
    setUploading(true);
    try {
      const allowedVideoExts = new Set(['mp4', 'mov', 'webm']);
      const rawExt = videoUri.split('.').pop()?.toLowerCase() ?? 'mp4';
      const ext = allowedVideoExts.has(rawExt) ? rawExt : 'mp4';
      const path = `${session.user.id}/pitch.${ext}`;
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('pitch-videos')
        .upload(path, blob, { upsert: true, contentType: `video/${ext}` });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('pitch-videos').getPublicUrl(path);
      await supabase.from('startup_profiles').update({
        pitch_video_url: publicUrl,
        is_active: true,
      }).eq('profile_id', session.user.id);

      await supabase.from('profiles').update({ is_onboarded: true }).eq('id', session.user.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      const { data: startupProfile } = await supabase.from('startup_profiles').select('*').eq('profile_id', session.user.id).single();
      if (profile) setProfile(profile as any);
      if (startupProfile) setStartupProfile(startupProfile as any);
      showToast('Your pitch is live!', 'success');
    } catch (err: any) {
      showToast(err.message ?? 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSkip() {
    if (!session?.user) return;
    await supabase.from('profiles').update({ is_onboarded: true }).eq('id', session.user.id);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) setProfile(profile as any);
    Alert.alert(
      'Profile Inactive',
      "Your profile is saved, but won't appear in the investor feed until you upload a pitch video. You can add one anytime from your Profile tab.",
      [{ text: 'Got it', style: 'default' }],
    );
  }

  return (
    <View className="flex-1 bg-surface-card" style={{ paddingTop: insets.top }}>
      <View className="bg-forest-800 px-6 pb-8 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="#E8C9A0" />
        </TouchableOpacity>
        <View className="flex-row gap-1.5 mb-6">
          {[1, 2, 3].map((i) => (
            <View key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-accent' : 'bg-forest-600'}`} />
          ))}
        </View>
        <Text className="text-cream opacity-70 text-sm mb-1">Step 3 of 3 — Almost done!</Text>
        <Text className="text-3xl font-black text-white">Upload your</Text>
        <Text className="text-3xl font-black text-accent">60-second pitch.</Text>
      </View>

      <View className="flex-1 px-6 pt-8">
        <TouchableOpacity
          onPress={pickVideo}
          className={`h-64 rounded-3xl border-2 border-dashed items-center justify-center mb-8 ${videoUri ? 'border-accent bg-forest-900' : 'border-gray-300 bg-white'}`}
        >
          {videoUri ? (
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={56} color="#6DB882" />
              <Text className="text-white font-semibold mt-3">Video selected</Text>
              <Text className="text-cream opacity-60 text-sm mt-1">Tap to change</Text>
            </View>
          ) : (
            <View className="items-center">
              <Ionicons name="videocam-outline" size={56} color="#C4C4C4" />
              <Text className="text-text-secondary font-semibold mt-3">Choose Video</Text>
              <Text className="text-text-muted text-sm mt-1">Max 60 seconds recommended</Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="gap-3">
          {videoUri && (
            <Button
              label={uploading ? 'Uploading...' : 'Upload & Launch'}
              onPress={handleUpload}
              loading={uploading}
              size="lg"
              variant="secondary"
            />
          )}
          <Button
            label={videoUri ? 'Pick Different Video' : 'Choose from Library'}
            onPress={pickVideo}
            size="lg"
            variant={videoUri ? 'outline' : 'primary'}
          />
          <Button label="Skip for now" onPress={handleSkip} size="md" variant="ghost" />
        </View>
      </View>
    </View>
  );
}
