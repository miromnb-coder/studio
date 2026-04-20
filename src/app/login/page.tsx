import { Suspense } from 'react';
import { KivoAuthScreen } from '@/components/auth/KivoAuthScreen';

function LoginPageContent() {
  return <KivoAuthScreen />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
