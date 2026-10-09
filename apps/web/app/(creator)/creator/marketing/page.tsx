/**
 * Crowdbeats V2 — Creator Marketing & Direct Tipping Tools
 *
 * Implements:
 * - Persistent canonical tipping QR code pointing to https://crowdbeats.app/tip/${creatorId}
 * - Immutable performer identifier display that survives stage name changes
 * - Interactive QR preview with high-res PNG download & direct tip link copying
 * - Embeddable widget HTML
 * - Educational clarity on Permanent Tipping QR vs 90s Rotating Live Session QR
 */

'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/lib/hooks/useAuth';
import { buildCanonicalTipUrl } from '@crowdbeats/contracts';

export default function CreatorMarketingPage() {
  const { uid, displayName } = useAuth();
  const creatorId = uid || 'artist';
  const canonicalTipUrl = buildCanonicalTipUrl(creatorId);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const embedCode = `<iframe src="https://crowdbeats.app/embed/tip/${encodeURIComponent(creatorId)}" width="320" height="480" frameborder="0"></iframe>`;

  useEffect(() => {
    QRCode.toDataURL(canonicalTipUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [canonicalTipUrl]);

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(canonicalTipUrl, {
        width: 1200,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      const link = document.createElement('a');
      link.download = `crowdbeats-qr-${creatorId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main
      role="main"
      aria-label="Creator Marketing and QR Tools"
      style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto', fontFamily: 'var(--cb-font-body)' }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Marketing & Distribution Tools
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Generate direct tipping QR codes, share permanent web tip links, and embed tip buttons for your solo performances.
        </p>
      </div>

      {/* Main Direct Tipping QR Code & Links Section */}
      <section
        style={{
          background: 'var(--surface-card)',
          padding: 28,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📱</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Direct Tipping QR Code & Links
          </h2>
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          Share your QR code so fans can open your tipping page directly.
        </p>

        {/* Permanent Tipping Guarantee Callout */}
        <div
          style={{
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Immutable Performer Identifier
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Your tipping QR code is permanent and tied to your immutable performer account (
              <code style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>{creatorId}</code>
              ). Even if you change your stage name, fans will always reach your tipping page directly.
            </p>
          </div>
        </div>

        {/* QR Code Preview & Direct Actions Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) 1fr',
            gap: 28,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          {/* QR Code Graphic Card */}
          <div
            style={{
              background: '#FFFFFF',
              padding: 20,
              borderRadius: 16,
              border: '2px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Direct Tipping QR for ${displayName || 'Creator'}`}
                style={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block', borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: 13,
                }}
              >
                Rendering QR Code…
              </div>
            )}
            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Crowdbeats Direct Tip
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              {displayName ? `Tipping ${displayName}` : 'Persistent Tip Link'}
            </div>
          </div>

          {/* Action Details & Buttons */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                Canonical Direct Tip URL
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  readOnly
                  value={canonicalTipUrl}
                  style={{
                    flex: 1,
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => copyToClipboard(canonicalTipUrl, 'link')}
                style={{
                  background: copiedLink ? '#10B981' : 'var(--accent-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 22px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s ease',
                }}
              >
                <span>{copiedLink ? '✓' : '🔗'}</span>
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Direct Tip Link'}
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={isDownloading || !qrDataUrl}
                style={{
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 22px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isDownloading || !qrDataUrl ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s ease',
                }}
              >
                <span>💾</span>
                {isDownloading ? 'Preparing PNG…' : 'Download QR Code'}
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              💡 <strong>Pro Tip:</strong> Print this QR code on stickers, acrylic signs, mic stands, or business cards.
              Fans scan with standard smartphone cameras to tip via Google Pay or Card.
            </div>
          </div>
        </div>

        {/* Clear Distinction: Permanent QR vs 90s Live Stage QR */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              📌 Permanent Direct QR (This Code)
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Permanent URL for printed merchandise, banners, and social bios. Never expires and is permanently tied
              to your immutable creator UID.
            </p>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              ⏱️ 90-Second Dynamic Live Stage QR
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Presented live on your mobile stage screen during active gigs. Rotates with cryptographic nonces to
              protect audience members from camera fraud and replay attacks.
            </p>
          </div>
        </div>
      </section>

      {/* Embed Widget Section */}
      <section
        style={{
          background: 'var(--surface-card)',
          padding: 24,
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>💻</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Embeddable Tip Widget HTML
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Paste this iframe snippet directly into your official portfolio website, blog, or electronic press kit.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <textarea
            rows={2}
            readOnly
            value={embedCode}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'monospace',
              resize: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => copyToClipboard(embedCode, 'embed')}
            style={{
              background: copiedEmbed ? '#10B981' : 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copiedEmbed ? 'Copied HTML!' : 'Copy HTML'}
          </button>
        </div>
      </section>
    </main>
  );
}
