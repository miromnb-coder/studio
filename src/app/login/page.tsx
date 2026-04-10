'use client';

import { Suspense } from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
