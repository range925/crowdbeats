'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SponsorIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sponsor/dashboard');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
