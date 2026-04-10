'use client';

import { Suspense } from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}
