'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MoneySaverPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/money');
  }, [router]);

  return null;
}
