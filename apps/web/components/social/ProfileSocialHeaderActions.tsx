'use client';

/**
 * Crowdbeats V2 — Profile Social Header Actions Component
 *
 * Provides:
 * - Follow / Following / Follow Back dynamic button with optimistic updates
 * - Subtle "Follows you" badge based on verified relationship state
 * - Direct "Message" button routing to inboxes or starting message requests
 * - Dropdown menu for Block (bidirectional follow removal), Restrict (quiet routing), and Report (moderation intake)
 * - Guest authentication continuation preservation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { callCallableFunction } from '@/lib/firebase/functions';
import { useAuth } from '@/lib/hooks/useAuth';
import type { SocialEntityType } from '@crowdbeats/contracts';

interface ProfileSocialHeaderActionsProps {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly targetName: string;
  readonly currentFollowersCount: number;
  readonly onFollowersCountChange?: (count: number) => void;
  readonly accentColor?: string;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export function ProfileSocialHeaderActions({
  targetId,
  targetType,
  targetName,
  currentFollowersCount,
  onFollowersCountChange,
  accentColor = '#7C3AED',
  actingAsBandId,
  actingAsArtistId,
}: ProfileSocialHeaderActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const [isFollowing, setIsFollowing] = useState(false);
  const [followsViewer, setFollowsViewer] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('harassment');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Toast / feedback
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch relationship state
  useEffect(() => {
    if (!isAuthenticated || !targetId) return;

    let isMounted = true;
    setIsLoading(true);

    callCallableFunction<
      { targetId: string; targetType: SocialEntityType; actingAsBandId?: string; actingAsArtistId?: string },
      {
        state: {
          isFollowing: boolean;
          followsViewer: boolean;
          canMessage: boolean;
          isBlocked: boolean;
          isRestricted: boolean;
        };
      }
    >('getRelationshipState', {
      targetId,
      targetType,
      actingAsBandId,
      actingAsArtistId,
    })
      .then((res) => {
        if (!isMounted || !res?.state) return;
        setIsFollowing(res.state.isFollowing);
        setFollowsViewer(res.state.followsViewer);
        setCanMessage(res.state.canMessage);
        setIsBlocked(res.state.isBlocked);
        setIsRestricted(res.state.isRestricted);
      })
      .catch((err) => {
        console.warn('Could not fetch relationship state:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, targetId, targetType, actingAsBandId, actingAsArtistId]);

  // Handle Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      const nextUrl = pathname || `/artist/${targetId}`;
      router.push(`/auth?next=${encodeURIComponent(nextUrl)}&action=follow`);
      return;
    }

    if (actionLoading || isBlocked) return;
    setActionLoading(true);
    setError(null);

    const prevFollowing = isFollowing;
    const nextFollowing = !prevFollowing;
    setIsFollowing(nextFollowing);

    const delta = nextFollowing ? 1 : -1;
    onFollowersCountChange?.(Math.max(0, currentFollowersCount + delta));

    try {
      if (nextFollowing) {
        await callCallableFunction('followEntity', {
          targetId,
          targetType,
          actingAsBandId,
          actingAsArtistId,
        });
        setFeedback(`Following ${targetName}`);
      } else {
        await callCallableFunction('unfollowEntity', {
          targetId,
          targetType,
          actingAsBandId,
          actingAsArtistId,
        });
        setFeedback(`Unfollowed ${targetName}`);
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error('Follow action failed:', err);
      // Rollback
      setIsFollowing(prevFollowing);
      onFollowersCountChange?.(currentFollowersCount);
      setError(err?.message || 'Failed to update follow status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Message Button Click
  const handleMessageClick = () => {
    if (!isAuthenticated) {
      const nextUrl = pathname || `/artist/${targetId}`;
      router.push(`/auth?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    const query = new URLSearchParams({
      recipientId: targetId,
      recipientType: targetType,
      recipientName: targetName,
    });

    router.push(`/fan/messages?${query.toString()}`);
  };

  // Handle Block
  const handleBlock = async () => {
    setShowMenu(false);
    if (
      !window.confirm(
        `Are you sure you want to block ${targetName}?\n\nThis will remove follows in both directions and prevent messaging.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await callCallableFunction('blockEntity', {
        targetId,
        targetType,
        actingAsBandId,
        actingAsArtistId,
      });

      setIsBlocked(true);
      setIsFollowing(false);
      setFollowsViewer(false);
      setCanMessage(false);
      onFollowersCountChange?.(Math.max(0, currentFollowersCount - (isFollowing ? 1 : 0)));
      setFeedback(`${targetName} has been blocked.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to block user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unblock
  const handleUnblock = async () => {
    setShowMenu(false);
    setActionLoading(true);
    setError(null);

    try {
      await callCallableFunction('unblockEntity', {
        targetId,
        targetType,
        actingAsBandId,
        actingAsArtistId,
      });

      setIsBlocked(false);
      setFeedback(`${targetName} has been unblocked.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to unblock user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Restrict / Unrestrict
  const handleRestrictToggle = async () => {
    setShowMenu(false);
    setActionLoading(true);
    setError(null);

    try {
      if (isRestricted) {
        await callCallableFunction('unrestrictEntity', {
          targetId,
          targetType,
          actingAsBandId,
          actingAsArtistId,
        });
        setIsRestricted(false);
        setFeedback(`Restriction removed for ${targetName}.`);
      } else {
        await callCallableFunction('restrictEntity', {
          targetId,
          targetType,
          actingAsBandId,
          actingAsArtistId,
        });
        setIsRestricted(true);
        setFeedback(
          `${targetName} has been restricted. Their messages will route quietly to your Restricted tab.`,
        );
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update restriction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setReportSubmitting(true);
    setError(null);

    try {
      await callCallableFunction('submitReport', {
        targetType: targetType === 'band' ? 'band' : 'artist',
        targetId,
        violationCategory: reportCategory,
        description: reportDescription.trim(),
      });

      setShowReportModal(false);
      setReportDescription('');
      setFeedback('Report submitted to Admin Support for review.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const followButtonLabel = actionLoading
    ? '…'
    : isFollowing
    ? 'Following'
    : followsViewer
    ? 'Follow Back'
    : 'Follow';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            backgroundColor: '#1E2032',
            color: '#00F076',
            border: '1px solid rgba(0, 240, 118, 0.4)',
            padding: '6px 14px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 30,
          }}
        >
          ✓ {feedback}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            backgroundColor: '#441C1C',
            color: '#FF6B6B',
            border: '1px solid #FF6B6B',
            padding: '6px 14px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 30,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* "Follows you" badge */}
      {followsViewer && !isBlocked && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#94A3B8',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 10px',
            borderRadius: 9999,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Follows you
        </span>
      )}

      {/* Blocked state indicator */}
      {isBlocked ? (
        <button
          type="button"
          onClick={handleUnblock}
          disabled={actionLoading}
          style={{
            padding: '8px 18px',
            borderRadius: 9999,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {actionLoading ? '…' : 'Blocked (Unblock)'}
        </button>
      ) : (
        <>
          {/* Primary Follow Button */}
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={actionLoading}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              backgroundColor: isFollowing
                ? 'rgba(236, 72, 153, 0.2)'
                : followsViewer
                ? accentColor
                : 'rgba(255, 255, 255, 0.12)',
              border: isFollowing
                ? '1px solid #EC4899'
                : followsViewer
                ? `1px solid ${accentColor}`
                : '1px solid rgba(255, 255, 255, 0.25)',
              color: isFollowing ? '#EC4899' : '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              opacity: actionLoading ? 0.7 : 1,
            }}
          >
            <span>{actionLoading ? '⏳' : isFollowing ? '💖' : '🤍'}</span>
            <span>{followButtonLabel}</span>
          </button>

          {/* Message Button */}
          <button
            type="button"
            onClick={handleMessageClick}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
            title={`Message ${targetName}`}
          >
            <span>💬</span>
            <span>Message</span>
          </button>
        </>
      )}

      {/* Safety Menu Dropdown (Three dots) */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          title="More actions"
        >
          ⋮
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: 200,
              backgroundColor: '#1E2032',
              border: '1px solid #2B2D44',
              borderRadius: 14,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              padding: '6px 0',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {isBlocked ? (
              <button
                type="button"
                onClick={handleUnblock}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🔓</span>
                <span>Unblock {targetName}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRestrictToggle}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>🛡️</span>
                  <span>{isRestricted ? `Unrestrict ${targetName}` : `Restrict ${targetName}`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBlock}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>🚫</span>
                  <span>Block {targetName}</span>
                </button>
              </>
            )}

            <div style={{ height: 1, backgroundColor: '#2B2D44', margin: '4px 0' }} />

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowReportModal(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFA500',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>🚩</span>
              <span>Report to Support</span>
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E2032',
              borderRadius: 20,
              maxWidth: 460,
              width: '100%',
              padding: 24,
              border: '1px solid #2B2D44',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Report {targetName}
              </h2>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 18 }}>
              Reports are submitted securely to Crowdbeats Admin Support. Please provide accurate details.
            </p>

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  Reason for Report
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: '#0F111A',
                    border: '1px solid #2B2D44',
                    color: '#FFFFFF',
                    fontSize: 14,
                  }}
                >
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="hate_speech">Hate Speech or Discrimination</option>
                  <option value="fraud">Fraud, Scam, or Impersonation</option>
                  <option value="copyright">Intellectual Property / Copyright</option>
                  <option value="spam">Spam or Unwanted Commercial Content</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  Details & Context
                </label>
                <textarea
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: '#0F111A',
                    border: '1px solid #2B2D44',
                    color: '#FFFFFF',
                    fontSize: 14,
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 9999,
                    backgroundColor: 'transparent',
                    border: '1px solid #2B2D44',
                    color: '#CBD5E1',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportDescription.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 9999,
                    backgroundColor: '#EF4444',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: reportSubmitting ? 'not-allowed' : 'pointer',
                    opacity: reportSubmitting || !reportDescription.trim() ? 0.6 : 1,
                  }}
                >
                  {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
