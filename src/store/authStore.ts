import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile, StartupProfile, InvestorProfile, AccountType } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  startupProfile: StartupProfile | null;
  investorProfile: InvestorProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setStartupProfile: (p: StartupProfile | null) => void;
  setInvestorProfile: (p: InvestorProfile | null) => void;
  setLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
  accountType: AccountType | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  startupProfile: null,
  investorProfile: null,
  isLoading: true,
  isInitialized: false,
  get accountType() {
    return get().profile?.account_type ?? null;
  },
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setStartupProfile: (startupProfile) => set({ startupProfile }),
  setInvestorProfile: (investorProfile) => set({ investorProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () =>
    set({
      session: null,
      profile: null,
      startupProfile: null,
      investorProfile: null,
      isLoading: false,
    }),
}));
