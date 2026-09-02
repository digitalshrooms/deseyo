import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import emailjs from '@emailjs/browser';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, username: string, levelTag?: 'L1' | 'L2') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
  sendEmailChangeCode: (newEmail: string) => Promise<{ error?: string }>;
  confirmEmailChange: (newEmail: string, code: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether the initial getSession() has completed so onAuthStateChange
  // doesn't set loading=false a second time and cause a flicker
  const initializedRef = useRef(false);

  const fetchUserData = async (userId: string): Promise<User | null> => {
    console.log('[Auth] fetchUserData uid=', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] fetchUserData error:', error.message);
      return null;
    }
    if (data) {
      console.log('[Auth] user loaded — sub_status:', (data as any).subscription_status, ' onboarding:', (data as any).onboarding_completed);
      setUser(data as User);
    }
    return (data as User) ?? null;
  };

  const ensureUserRecord = async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    if (window.location.pathname === '/auth/callback') return;
    const existing = await fetchUserData(authUser.id);
    if (existing) return;

    const meta = authUser.user_metadata || {};
    const fullName = (meta.full_name || meta.name || '').trim();
    const nameParts = fullName.split(' ');
    const firstName = meta.given_name || nameParts[0] || '';
    const lastName = meta.family_name || nameParts.slice(1).join(' ') || '';
    const email = meta.email || authUser.email || '';
    const rawUsername = meta.given_name
      ? `${(meta.given_name || '').toLowerCase()}${(meta.family_name || '').toLowerCase()}`
      : email.split('@')[0];
    const username = rawUsername.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || `user${authUser.id.slice(0, 6)}`;

    const { error } = await supabase.from('users').insert([{
      id: authUser.id,
      name: fullName || email,
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      subscription_plan: 'Basic',
      progress: { completedLessons: [], totalCompleted: 0, lastLessonId: '' },
      onboarding_completed: false,
      current_plan: 'Restart',
      current_week: 1,
      current_day: 1,
      last_activity_date: new Date().toISOString(),
    }]);
    if (error) console.error('[Auth] ensureUserRecord error:', error.message);
    await fetchUserData(authUser.id);
  };

  useEffect(() => {
    // Step 1: Get the current session synchronously on mount
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          await fetchUserData(s.user.id);
        }
      } catch (err) {
        console.error('[Auth] init error:', err);
      } finally {
        initializedRef.current = true;
        setLoading(false);
      }
    };

    init();

    // Step 2: Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      (async () => {
        console.log('[Auth] authStateChange event:', event, 'has session:', !!s);
        setSession(s);

        if (s?.user) {
          if (event === 'SIGNED_IN') {
            await ensureUserRecord(s.user);
          } else {
            await fetchUserData(s.user.id);
          }
        } else {
          setUser(null);
        }

        // Only call setLoading after init() has already set it to false once.
        // This prevents a double-loading-spinner on first render.
        if (initializedRef.current) {
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string,
    levelTag: 'L1' | 'L2' = 'L1',
  ) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError };

    if (authData.user) {
      const { error: userError } = await supabase.from('users').insert([{
        id: authData.user.id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        subscription_plan: 'Basic',
        level_tag: levelTag,
        progress: { completedLessons: [], totalCompleted: 0, lastLessonId: '' },
        onboarding_completed: false,
        current_plan: 'Restart',
        current_week: 1,
        current_day: 1,
        last_activity_date: new Date().toISOString(),
      }]);
      if (userError) return { error: userError };

      // Prefer session from signUp response; fall back to getSession()
      const activeSession = authData.session ?? (await supabase.auth.getSession()).data.session;
      if (activeSession) {
        setSession(activeSession);
        await fetchUserData(authData.user.id);
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') };
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (!error) await fetchUserData(user.id);
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const sendEmailChangeCode = async (newEmail: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Není přihlášen žádný uživatel.' };

    const normalised = newEmail.toLowerCase().trim();

    // Block if new email is same as current
    if (normalised === user.email?.toLowerCase()) {
      return { error: 'Nový email je stejný jako stávající.' };
    }

    // Check email not already taken in users table
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalised)
      .maybeSingle();
    if (existing) return { error: 'Tento email je již používán jiným účtem.' };

    // Rate-limit: max 3 codes per hour for this email
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalised)
      .gte('created_at', windowStart);
    if ((count ?? 0) >= 3) {
      return { error: 'Překročen limit odesílání. Zkuste to znovu za hodinu.' };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from('verification_codes')
      .insert({ email: normalised, code, expires_at: expiresAt });
    if (dbErr) return { error: 'Nepodařilo se uložit kód.' };

    // Send via EmailJS (same service as registration)
    const EMAILJS_SERVICE_ID = 'service_h264krr';
    const EMAILJS_TEMPLATE_ID = 'template_a577xkm';
    const EMAILJS_PUBLIC_KEY = 'saGOmdFFdZT_Ravmd';

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: normalised,
          to_name: user.name || user.email || '',
          verification_code: code,
          code1: code[0], code2: code[1], code3: code[2],
          code4: code[3], code5: code[4], code6: code[5],
        },
        EMAILJS_PUBLIC_KEY
      );
    } catch {
      return { error: 'Nepodařilo se odeslat ověřovací email.' };
    }

    return {};
  };

  const confirmEmailChange = async (newEmail: string, code: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Není přihlášen žádný uživatel.' };

    const normalised = newEmail.toLowerCase().trim();

    // Call edge function — uses Admin API so Supabase sends NO confirmation email
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ new_email: normalised, code: code.trim() }),
      }
    );
    const json = await res.json();
    if (!res.ok) return { error: json.error || 'Nepodařilo se změnit email.' };

    await fetchUserData(user.id);
    return {};
  };

  // Always fetches a fresh DB snapshot. Call this after any payment or critical
  // DB update so that route guards immediately see the updated subscription_status.
  const refreshUser = async () => {
    console.log('[Auth] refreshUser called');
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    if (freshSession?.user) {
      setSession(freshSession);
      await fetchUserData(freshSession.user.id);
    } else {
      console.warn('[Auth] refreshUser: no active session');
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
      updateUser,
      updatePassword,
      refreshUser,
      sendEmailChangeCode,
      confirmEmailChange,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
