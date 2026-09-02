import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

async function createUserRecord(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const meta = (authUser.user_metadata || {}) as Record<string, string>;
  const fullName = (meta.full_name || meta.name || '').trim();
  const nameParts = fullName.split(' ');
  const firstName = meta.given_name || nameParts[0] || '';
  const lastName = meta.family_name || nameParts.slice(1).join(' ') || '';
  // Prefer email from metadata (real Google email) over auth email which can be an OAuth token
  const email = meta.email || authUser.email || '';

  // Build username from real name or email local part — never from raw OAuth token strings
  const rawUsername = meta.given_name
    ? `${(meta.given_name || '').toLowerCase()}${(meta.family_name || '').toLowerCase()}`
    : email.split('@')[0];
  const baseUsername = rawUsername.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || `user${authUser.id.slice(0, 6)}`;

  // Ensure username uniqueness
  let username = baseUsername;
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('username', username);
  if ((count ?? 0) > 0) {
    username = `${baseUsername}${Math.floor(Math.random() * 9000) + 1000}`;
  }

  const { error } = await supabase.from('users').insert([{
    id: authUser.id,
    name: fullName || firstName || email.split('@')[0],
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

  return error;
}

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let handled = false;

    const handle = async (userId: string) => {
      if (handled) return;
      handled = true;

      const { data: existing } = await supabase
        .from('users')
        .select('id, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (!existing) {
        const { data: authUserData } = await supabase.auth.getUser();
        const authUser = authUserData?.user;
        if (!authUser) { navigate('/prihlaseni'); return; }

        const error = await createUserRecord(authUser);
        if (error) {
          console.error('Failed to create user record:', error);
        }
        // New OAuth user — must pick a plan and pay before accessing app
        navigate('/vyber-planu');
        return;
      }

      // Existing user — route based on subscription status
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .maybeSingle();

      const hasActiveSub = userData?.subscription_status === 'active';
      if (!hasActiveSub) {
        navigate('/vyber-planu');
      } else {
        navigate(existing.onboarding_completed ? '/moje-cesta' : '/onboarding');
      }
    };

    // Primary: listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        subscription.unsubscribe();
        handle(session.user.id);
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session at all — go back to auth
        subscription.unsubscribe();
        navigate('/prihlaseni');
      }
    });

    // Fallback: if session already active when component mounts (re-registration flow)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user && !handled) {
        subscription.unsubscribe();
        handle(data.session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="text-sm text-gray-500">Přihlašování...</p>
      </div>
    </div>
  );
};
