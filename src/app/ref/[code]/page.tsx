'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      localStorage.setItem('referrer_code', code);
      localStorage.setItem('referrer_timestamp', Date.now().toString());
    }
    router.replace('/');
  }, [code, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-1">Redirecting...</p>
      </div>
    </div>
  );
}
