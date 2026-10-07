import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PLATFORM_POLICIES_REGISTRY, PolicyType } from '@crowdbeats/contracts';
import { PolicyDetailView } from '@/components/legal/PolicyDetailView';
import fs from 'fs';
import path from 'path';

const SLUG_TO_POLICY_MAP: Record<string, { type: PolicyType; file: string }> = {
  'terms': { type: PolicyType.TERMS_OF_SERVICE, file: 'TERMS_OF_SERVICE.md' },
  'aup': { type: PolicyType.ACCEPTABLE_USE_POLICY, file: 'ACCEPTABLE_USE_POLICY.md' },
  'creator-monetization': { type: PolicyType.CREATOR_MONETIZATION_POLICY, file: 'CREATOR_MONETIZATION_POLICY.md' },
  'dmca': { type: PolicyType.DMCA_COPYRIGHT_POLICY, file: 'DMCA_COPYRIGHT_POLICY.md' },
  'report-abuse': { type: PolicyType.REPORTING_AND_COMPLAINTS_POLICY, file: 'REPORTING_AND_COMPLAINTS_POLICY.md' },
  'law-enforcement': { type: PolicyType.LAW_ENFORCEMENT_GUIDELINES, file: 'LAW_ENFORCEMENT_GUIDELINES.md' },
  'privacy': { type: PolicyType.PRIVACY_POLICY, file: 'PRIVACY_POLICY.md' },
  'refunds': { type: PolicyType.REFUND_DISPUTE_POLICY, file: 'REFUND_DISPUTE_POLICY.md' },
};

interface PageProps {
  params: Promise<{ policy: string }>;
}

// Pre-render all 8 legal policy pages as static HTML at build time.
// This makes them ○ (static) instead of ƒ (dynamic) so they get
// proper HTML files in dist/ and work correctly on Firebase static hosting.
export function generateStaticParams() {
  return Object.keys(SLUG_TO_POLICY_MAP).map((slug) => ({ policy: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { policy: slug } = await params;
  const entry = SLUG_TO_POLICY_MAP[slug];
  if (!entry) return { title: 'Policy Not Found' };

  const meta = PLATFORM_POLICIES_REGISTRY[entry.type];
  return {
    title: `${meta.title} — Crowdbeats Compliance`,
    description: meta.summary,
    alternates: {
      canonical: meta.canonicalUrl,
    },
  };
}

export default async function PolicyDetailPage({ params }: PageProps) {
  const { policy: slug } = await params;
  const entry = SLUG_TO_POLICY_MAP[slug];

  if (!entry) {
    notFound();
  }

  const meta = PLATFORM_POLICIES_REGISTRY[entry.type];

  // Load policy markdown from docs/legal (also copied to public/docs/legal for static hosting)
  let content = '';
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'public', 'docs', 'legal', entry.file),
      path.resolve(process.cwd(), 'docs', 'legal', entry.file),
      path.resolve(process.cwd(), '..', '..', 'docs', 'legal', entry.file),
      path.resolve(process.cwd(), 'apps', 'web', '..', '..', 'docs', 'legal', entry.file),
    ];
    for (const cp of candidatePaths) {
      if (fs.existsSync(cp)) {
        content = fs.readFileSync(cp, 'utf8');
        break;
      }
    }
  } catch (err) {
    console.error('Error reading policy document:', err);
  }

  const fallbackContent = `# ${meta.title}\n\n**Effective Date:** ${meta.effectiveDate}\n**Version:** ${meta.version}\n**Jurisdiction:** San Francisco, California\n\n${meta.summary}\n\nCanonical URL: ${meta.canonicalUrl}`;

  return <PolicyDetailView meta={meta} content={content || fallbackContent} />;
}
