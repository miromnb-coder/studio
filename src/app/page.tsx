import { redirect } from 'next/navigation';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export default async function RootPage(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  redirect('/chat');
}
