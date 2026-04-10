'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/app/store/app-store';
import { upsertUserProfile } from '@/lib/auth/profile';

export function AuthSync() {
  const setUser = useAppStore((s) => s.setUser);
  const clearUser = useAppStore((s) => s.clearUser);

  useEffect(() => {
    const supabase = createClient();

    const hydrateUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        clearUser();
        return;
      }

      const profileState = await upsertUserProfile(supabase, user);

      setUser({
        id: user.id,
        email: profileState.email,
        name: profileState.fullName,
      });
    };

    void hydrateUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null) => {
      const authUser = session?.user;
      if (!authUser) {
        clearUser();
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        name: (authUser.user_metadata?.full_name as string | undefined) || authUser.email?.split('@')[0] || 'User',
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return null;
}
