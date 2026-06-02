import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StyleSheet, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Avatar } from '@/components/ui/Avatar';
import type { IndustryType, StartupStage } from '@/types/database';

const INDUSTRIES: { value: IndustryType; label: string }[] = [
  { value: 'ai_ml',       label: 'AI / ML'     },
  { value: 'fintech',     label: 'Fintech'      },
  { value: 'healthtech',  label: 'Healthtech'   },
  { value: 'edtech',      label: 'Edtech'       },
  { value: 'saas',        label: 'SaaS'         },
  { value: 'marketplace', label: 'Marketplace'  },
  { value: 'consumer',    label: 'Consumer'     },
  { value: 'deeptech',    label: 'Deep Tech'    },
  { value: 'climate',     label: 'Climate'      },
  { value: 'other',       label: 'Other'        },
];

const STAGES: { value: StartupStage; label: string }[] = [
  { value: 'idea',         label: 'Idea'       },
  { value: 'pre_seed',     label: 'Pre-Seed'   },
  { value: 'seed',         label: 'Seed'       },
  { value: 'series_a',     label: 'Series A'   },
  { value: 'series_b_plus',label: 'Series B+'  },
];

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, hint,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any; hint?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AAAAAA"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[s.fieldInput, multiline && { minHeight: 88, textAlignVertical: 'top' }]}
      />
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
    </View>
  );
}

function ChipRow<T extends string>({
  label, options, selected, multi,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | T[];
  multi?: boolean;
  onSelect: (v: T) => void;
}) {
  const sel = Array.isArray(selected) ? selected : [selected];
  return (
    <View style={s.chipSection}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.chips}>
        {options.map((o) => {
          const active = sel.includes(o.value);
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => onSelect(o.value)}
              style={[s.chip, active && s.chipActive]}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

async function uploadImage(uri: string, bucket: string, path: string): Promise<string> {
  const res  = await fetch(uri);
  const blob = await res.blob();
  const ext  = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

async function pickImage(aspect?: [number, number]): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Allow access to your photo library to pick an image.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export default function EditProfileModal() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const profile   = useAuthStore((s) => s.profile);
  const sp        = useAuthStore((s) => s.startupProfile);
  const ip        = useAuthStore((s) => s.investorProfile);
  const { setProfile, setStartupProfile, setInvestorProfile } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const isStartup = profile?.account_type === 'startup';

  const [saving, setSaving] = useState(false);
  const [avatarUri,  setAvatarUri]  = useState<string | null>(null);
  const [logoUri,    setLogoUri]    = useState<string | null>(null);
  const [coverUri,   setCoverUri]   = useState<string | null>(null);

  // Common profile fields
  const [fullName,  setFullName]  = useState(profile?.full_name  ?? '');
  const [bio,       setBio]       = useState(profile?.bio        ?? '');
  const [location,  setLocation]  = useState(profile?.location   ?? '');
  const [website,   setWebsite]   = useState(profile?.website    ?? '');

  // Startup fields
  const [companyName,  setCompanyName]  = useState(sp?.company_name  ?? '');
  const [tagline,      setTagline]      = useState(sp?.tagline        ?? '');
  const [description,  setDescription]  = useState(sp?.description    ?? '');
  const [industry,     setIndustry]     = useState<IndustryType>(sp?.industry  ?? 'other');
  const [stage,        setStage]        = useState<StartupStage>(sp?.stage     ?? 'idea');
  const [foundedYear,  setFoundedYear]  = useState(sp?.founded_year   ? String(sp.founded_year) : '');
  const [teamSize,     setTeamSize]     = useState(sp?.team_size      ? String(sp.team_size)     : '');
  const [spWebsite,    setSpWebsite]    = useState(sp?.website        ?? '');
  const [linkedinUrl,  setLinkedinUrl]  = useState(sp?.linkedin_url   ?? '');
  const [twitterUrl,   setTwitterUrl]   = useState(sp?.twitter_url    ?? '');
  const [mrr,          setMrr]          = useState(sp?.mrr            ? String(sp.mrr)           : '');
  const [arr,          setArr]          = useState(sp?.arr            ? String(sp.arr)            : '');
  const [usersCount,   setUsersCount]   = useState(sp?.users_count    ? String(sp.users_count)   : '');
  const [growthRate,   setGrowthRate]   = useState(sp?.growth_rate    ? String(sp.growth_rate)   : '');
  const [isRaising,    setIsRaising]    = useState(sp?.is_raising     ?? false);
  const [raisingAmt,   setRaisingAmt]   = useState(sp?.raising_amount ? String(sp.raising_amount): '');
  const [valuation,    setValuation]    = useState(sp?.valuation      ? String(sp.valuation)     : '');

  // Investor fields
  const [firmName,     setFirmName]     = useState(ip?.firm_name      ?? '');
  const [title,        setTitle]        = useState(ip?.title          ?? '');
  const [ipBio,        setIpBio]        = useState(ip?.bio            ?? '');
  const [ipLinkedin,   setIpLinkedin]   = useState(ip?.linkedin_url   ?? '');
  const [ipTwitter,    setIpTwitter]    = useState(ip?.twitter_url    ?? '');
  const [minInvest,    setMinInvest]    = useState(ip?.min_investment  ? String(ip.min_investment) : '');
  const [maxInvest,    setMaxInvest]    = useState(ip?.max_investment  ? String(ip.max_investment) : '');
  const [portfolioCnt, setPortfolioCnt] = useState(ip?.portfolio_count ? String(ip.portfolio_count): '');
  const [industries,   setIndustries]   = useState<IndustryType[]>(ip?.industries ?? []);
  const [stages,       setStages]       = useState<StartupStage[]>(ip?.stages     ?? []);

  function toggleIndustry(v: IndustryType) {
    setIndustries((prev) => prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]);
  }
  function toggleStage(v: StartupStage) {
    setStages((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      let avatarUrl  = profile.avatar_url;
      let logoUrl    = sp?.logo_url    ?? null;
      let coverUrl   = sp?.cover_url   ?? null;

      if (avatarUri)  avatarUrl = await uploadImage(avatarUri,  'profile-photos', `${profile.id}/avatar`);
      if (logoUri)    logoUrl   = await uploadImage(logoUri,    'logos',          `${profile.id}/logo`);
      if (coverUri)   coverUrl  = await uploadImage(coverUri,   'covers',         `${profile.id}/cover`);

      // Update base profile
      const { data: updatedProfile, error: pErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), bio: bio.trim() || null, location: location.trim() || null, website: website.trim() || null, avatar_url: avatarUrl })
        .eq('id', profile.id)
        .select('*')
        .single();
      if (pErr) throw pErr;
      if (updatedProfile) setProfile(updatedProfile as any);

      if (isStartup && sp) {
        const { data: updatedSp, error: sErr } = await supabase
          .from('startup_profiles')
          .update({
            company_name:   companyName.trim(),
            tagline:        tagline.trim(),
            description:    description.trim() || null,
            industry,
            stage,
            founded_year:   foundedYear ? parseInt(foundedYear, 10) : null,
            team_size:      teamSize    ? parseInt(teamSize, 10)    : null,
            website:        spWebsite.trim()   || null,
            linkedin_url:   linkedinUrl.trim() || null,
            twitter_url:    twitterUrl.trim()  || null,
            mrr:            mrr        ? parseFloat(mrr)        : null,
            arr:            arr        ? parseFloat(arr)        : null,
            users_count:    usersCount ? parseInt(usersCount, 10) : null,
            growth_rate:    growthRate ? parseFloat(growthRate)  : null,
            is_raising:     isRaising,
            raising_amount: raisingAmt ? parseFloat(raisingAmt) : null,
            valuation:      valuation  ? parseFloat(valuation)  : null,
            logo_url:       logoUrl,
            cover_url:      coverUrl,
          })
          .eq('profile_id', profile.id)
          .select('*')
          .single();
        if (sErr) throw sErr;
        if (updatedSp) setStartupProfile(updatedSp as any);
      }

      if (!isStartup && ip) {
        const { data: updatedIp, error: iErr } = await supabase
          .from('investor_profiles')
          .update({
            firm_name:      firmName.trim()    || null,
            title:          title.trim()       || null,
            bio:            ipBio.trim()       || null,
            linkedin_url:   ipLinkedin.trim()  || null,
            twitter_url:    ipTwitter.trim()   || null,
            min_investment: minInvest  ? parseFloat(minInvest)  : null,
            max_investment: maxInvest  ? parseFloat(maxInvest)  : null,
            portfolio_count:portfolioCnt ? parseInt(portfolioCnt, 10) : null,
            industries,
            stages,
          })
          .eq('profile_id', profile.id)
          .select('*')
          .single();
        if (iErr) throw iErr;
        if (updatedIp) setInvestorProfile(updatedIp as any);
      }

      showToast('Profile updated!', 'success');
      router.back();
    } catch (err: any) {
      showToast(err?.message ?? 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const avatarDisplay = avatarUri ?? profile?.avatar_url;
  const logoDisplay   = logoUri   ?? sp?.logo_url;
  const coverDisplay  = coverUri  ?? sp?.cover_url;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={s.headerBtn} disabled={saving}>
          {saving ? <ActivityIndicator color="#6DB882" size="small" /> : <Text style={s.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">

        {/* Photo / logo pickers */}
        <View style={s.photoPickers}>
          {/* Cover */}
          {isStartup && (
            <TouchableOpacity
              onPress={async () => { const u = await pickImage([16, 5]); if (u) setCoverUri(u); }}
              style={s.coverPicker}
            >
              {coverDisplay
                ? <Image source={{ uri: coverDisplay }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                : <View style={s.coverPicker} />}
              <View style={s.cameraOverlay}>
                <Ionicons name="camera" size={18} color="white" />
              </View>
            </TouchableOpacity>
          )}
          <View style={s.avatarSection}>
            <TouchableOpacity
              onPress={async () => { const u = await pickImage([1, 1]); if (u) setAvatarUri(u); }}
              style={s.avatarPickerWrap}
            >
              {isStartup
                ? (logoDisplay
                  ? <Image source={{ uri: logoDisplay }} style={s.logoImg} contentFit="cover" />
                  : <View style={[s.logoImg, { backgroundColor: '#2E4820' }]} />)
                : <Avatar uri={avatarDisplay} name={fullName} size={80} />}
              <View style={s.smallCameraOverlay}>
                <Ionicons name="camera" size={12} color="white" />
              </View>
            </TouchableOpacity>
            {isStartup && (
              <TouchableOpacity
                onPress={async () => { const u = await pickImage([1, 1]); if (u) setLogoUri(u); }}
                style={{ marginTop: 4 }}
              >
                <Text style={s.changePhotoText}>Change Logo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── BASICS ──────────────────────────────────────────────────── */}
        <SectionLabel label="BASICS" />
        <View style={s.card}>
          <Field label="Full Name"   value={fullName}  onChangeText={setFullName}  placeholder="Jane Smith" />
          <Field label="Bio"         value={bio}       onChangeText={setBio}       placeholder="A short bio about yourself" multiline />
          <Field label="Location"    value={location}  onChangeText={setLocation}  placeholder="San Francisco, CA" />
          <Field label="Website"     value={website}   onChangeText={setWebsite}   placeholder="https://yoursite.com" keyboardType="url" />
        </View>

        {isStartup && <>
          {/* ── COMPANY ─────────────────────────────────────────────── */}
          <SectionLabel label="COMPANY" />
          <View style={s.card}>
            <Field label="Company Name" value={companyName}  onChangeText={setCompanyName}  placeholder="Acme Inc." />
            <Field label="Tagline"      value={tagline}      onChangeText={setTagline}       placeholder="One sentence pitch" />
            <Field label="Description"  value={description}  onChangeText={setDescription}   placeholder="What problem are you solving? How? Why now?" multiline />
            <Field label="Website"      value={spWebsite}    onChangeText={setSpWebsite}     placeholder="https://yourstartup.com" keyboardType="url" />
            <Field label="LinkedIn"     value={linkedinUrl}  onChangeText={setLinkedinUrl}   placeholder="https://linkedin.com/company/..." keyboardType="url" />
            <Field label="Twitter / X"  value={twitterUrl}   onChangeText={setTwitterUrl}    placeholder="https://twitter.com/..." keyboardType="url" />
            <Field label="Founded Year" value={foundedYear}  onChangeText={setFoundedYear}   placeholder="2023" keyboardType="numeric" />
            <Field label="Team Size"    value={teamSize}     onChangeText={setTeamSize}       placeholder="8" keyboardType="numeric" />
          </View>

          <ChipRow label="Industry" options={INDUSTRIES} selected={industry} onSelect={(v) => setIndustry(v as IndustryType)} />
          <ChipRow label="Stage"    options={STAGES}     selected={stage}    onSelect={(v) => setStage(v as StartupStage)} />

          {/* ── TRACTION ────────────────────────────────────────────── */}
          <SectionLabel label="TRACTION & FINANCIALS" />
          <View style={s.card}>
            <Field label="MRR ($)"        value={mrr}         onChangeText={setMrr}         placeholder="15000"  keyboardType="numeric" hint="Monthly Recurring Revenue in USD" />
            <Field label="ARR ($)"        value={arr}         onChangeText={setArr}         placeholder="180000" keyboardType="numeric" hint="Annual Recurring Revenue in USD" />
            <Field label="Total Users"    value={usersCount}  onChangeText={setUsersCount}  placeholder="2500"   keyboardType="numeric" />
            <Field label="Growth Rate (%)"value={growthRate}  onChangeText={setGrowthRate}  placeholder="15"     keyboardType="numeric" hint="Month-over-month %" />
            <Field label="Valuation ($)"  value={valuation}   onChangeText={setValuation}   placeholder="10000000" keyboardType="numeric" />
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>Currently Raising</Text>
                <Text style={s.toggleDesc}>Show investors you are actively fundraising</Text>
              </View>
              <Switch
                value={isRaising} onValueChange={setIsRaising}
                trackColor={{ false: '#D0D0D0', true: '#6DB882' }} thumbColor="#FFF"
              />
            </View>
            {isRaising && (
              <Field label="Raise Target ($)" value={raisingAmt} onChangeText={setRaisingAmt} placeholder="2000000" keyboardType="numeric" />
            )}
          </View>
        </>}

        {!isStartup && <>
          {/* ── INVESTOR INFO ───────────────────────────────────────── */}
          <SectionLabel label="INVESTOR PROFILE" />
          <View style={s.card}>
            <Field label="Title"          value={title}       onChangeText={setTitle}       placeholder="Partner, Angel, GP..." />
            <Field label="Firm / Fund"    value={firmName}    onChangeText={setFirmName}    placeholder="Sequoia Capital" />
            <Field label="Bio"            value={ipBio}       onChangeText={setIpBio}       placeholder="Your investment philosophy..." multiline />
            <Field label="LinkedIn"       value={ipLinkedin}  onChangeText={setIpLinkedin}  placeholder="https://linkedin.com/in/..." keyboardType="url" />
            <Field label="Twitter / X"    value={ipTwitter}   onChangeText={setIpTwitter}   placeholder="https://twitter.com/..." keyboardType="url" />
            <Field label="Min Ticket ($)" value={minInvest}   onChangeText={setMinInvest}   placeholder="25000"  keyboardType="numeric" />
            <Field label="Max Ticket ($)" value={maxInvest}   onChangeText={setMaxInvest}   placeholder="500000" keyboardType="numeric" />
            <Field label="Portfolio Count"value={portfolioCnt}onChangeText={setPortfolioCnt}placeholder="12" keyboardType="numeric" hint="Number of companies you have invested in" />
          </View>

          <ChipRow label="Industries you invest in" options={INDUSTRIES} selected={industries} multi onSelect={(v) => toggleIndustry(v as IndustryType)} />
          <ChipRow label="Preferred stages"          options={STAGES}     selected={stages}     multi onSelect={(v) => toggleStage(v as StartupStage)} />
        </>}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F2F7F2' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2E4820', paddingHorizontal: 16, paddingBottom: 14,
  },
  headerBtn:  { minWidth: 60 },
  headerBtnText:{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerTitle:{ fontSize: 17, fontWeight: '800', color: 'white' },
  saveText:   { fontSize: 15, color: '#6DB882', fontWeight: '700' },

  photoPickers:{ backgroundColor: '#2E4820', paddingBottom: 20, alignItems: 'center' },
  coverPicker: {
    width: '100%', height: 100, backgroundColor: '#243D18',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  cameraOverlay:{
    position: 'absolute', bottom: 8, right: 8, width: 30, height: 30,
    borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSection:{ alignItems: 'center', marginTop: -20 },
  avatarPickerWrap:{ position: 'relative' },
  logoImg:    { width: 80, height: 80, borderRadius: 12, borderWidth: 3, borderColor: '#2E4820' },
  smallCameraOverlay:{
    position: 'absolute', bottom: 0, right: -4, width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#6DB882',
    alignItems: 'center', justifyContent: 'center',
  },
  changePhotoText:{ fontSize: 12, color: '#6DB882', fontWeight: '600', marginTop: 6 },

  sectionLabel:{
    fontSize: 11, fontWeight: '700', color: '#3A5C28',
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
  },
  card:       { backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DDE8DC' },
  field:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEF4EE' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#3A5C28', marginBottom: 5 },
  fieldInput: {
    fontSize: 15, color: '#1A1A1A',
    borderWidth: 1, borderColor: '#DDE8DC',
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F8FBF8',
  },
  fieldHint:  { fontSize: 11, color: '#7A9078', marginTop: 4 },

  chipSection:{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#DDE8DC', marginTop: 2 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#DDE8DC', backgroundColor: '#F8FBF8' },
  chipActive: { backgroundColor: '#2E4820', borderColor: '#2E4820' },
  chipText:   { fontSize: 13, fontWeight: '500', color: '#4A5C48' },
  chipTextActive:{ color: '#FFFFFF' },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EEF4EE' },
  toggleTitle:{ fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  toggleDesc: { fontSize: 12, color: '#7A9078', marginTop: 2 },
});
