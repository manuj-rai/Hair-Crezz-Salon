/**
 * Tiny auth wrapper. In Supabase mode, uses real auth. In demo mode, accepts
 * a hardcoded demo login so the dashboard can be browsed in previews.
 */
import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

const DEMO_KEY = 'demo-admin';
const DEMO_EMAIL = 'demo@admin.com';
const DEMO_PASSWORD = 'demo';
const DEMO_USER = { email: DEMO_EMAIL };

export type AuthUser = { email: string };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) setUser({ email: data.user.email });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
          setUser(session?.user?.email ? { email: session.user.email } : null);
        });
        unsub = () => sub.subscription.unsubscribe();
      } else {
        setUser(localStorage.getItem(DEMO_KEY) ? DEMO_USER : null);
      }
      setLoading(false);
    })();
    return () => unsub?.();
  }, []);

  async function signIn(email: string, password: string) {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        localStorage.setItem(DEMO_KEY, '1');
        setUser(DEMO_USER);
      } else {
        throw new Error(`Demo login: use ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
      }
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem(DEMO_KEY);
    setUser(null);
  }

  return { user, loading, signIn, signOut, mode: isSupabaseConfigured ? 'supabase' : 'demo' as const };
}
