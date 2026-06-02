import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useAuthInit() {
  const store = useAuthStore();

  useEffect(() => {
    let settled = false;

    // Marks the app ready to route — called only once.
    function settle() {
      if (settled) return;
      settled = true;
      store.setLoading(false);
      store.setInitialized(true);
    }

    // Absolute failsafe — always unblock after 3 s even if Supabase stalls.
    const failsafe = setTimeout(settle, 3000);

    // Loads base profile (determines routing).
    // Extended profile (startup/investor) fetched in background — never blocks.
    function loadProfile(userId: string) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data: profile }) => {
          if (!profile) return;
          store.setProfile(profile as any);
          if (profile.account_type === 'startup') {
            supabase
              .from('startup_profiles')
              .select('*')
              .eq('profile_id', userId)
              .single()
              .then(({ data }) => { if (data) store.setStartupProfile(data as any); });
          } else if (profile.account_type === 'investor') {
            supabase
              .from('investor_profiles')
              .select('*')
              .eq('profile_id', userId)
              .single()
              .then(({ data }) => { if (data) store.setInvestorProfile(data as any); });
          }
        })
        .catch(() => {});
    }

    // getSession resolves immediately from local storage — no network needed.
    // We call settle() right away, then load the profile in the background.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        store.setSession(session);
        if (session) loadProfile(session.user.id); // fire-and-forget
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(failsafe);
        settle(); // called as soon as getSession() returns, not waiting for profile
      });

    // Handles sign-in / sign-out / token refresh after init.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        store.setSession(session);
        if (session) {
          loadProfile(session.user.id); // fire-and-forget
        } else {
          store.reset();
        }
        settle(); // also settle here in case getSession() somehow didn't
      },
    );

    return () => {
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);
}

export function useSignOut() {
  const reset = useAuthStore((s) => s.reset);
  return async () => {
    await supabase.auth.signOut();
    reset();
  };
}
