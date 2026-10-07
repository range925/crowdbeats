import React from 'react';
import type { Metadata } from 'next';
import { getUserStatementData } from '@/lib/compliance/userDataExport';
import { StatementDocumentView } from '@/components/compliance/StatementDocumentView';

interface PageProps {
  searchParams: Promise<{
    uid?: string;
    role?: 'fan' | 'artist' | 'band_member' | 'sponsor' | 'venue' | 'admin';
    year?: string;
    name?: string;
    email?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { uid, year } = await searchParams;
  const taxYear = year ? parseInt(year, 10) : 2026;
  return {
    title: `Official Account & Tax Statement (${taxYear}) — Crowdbeats LLC`,
    description: 'Official account disclosure, tip receipts, creator earnings, and IRS tax compliance document.',
  };
}

export default async function StatementPdfPage({ searchParams }: PageProps) {
  const { uid, role, year, name, email } = await searchParams;
  const taxYear = year ? parseInt(year, 10) : 2026;

  const data = getUserStatementData({
    uid: uid || 'usr_self',
    role: role || 'artist',
    taxYear,
    fullName: name,
    email: email,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', padding: '32px 16px' }}>
      <StatementDocumentView data={data} showActions={true} />
    </div>
  );
}
