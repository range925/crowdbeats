'use client';

// Crowdbeats V2 — Fan Following Page
// Route: /fan/following
// Client-side Firestore read — no firebase-admin (unreliable on Firebase Hosting)

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface FollowRecord {
  followId: string;
  artistId: string;
  createdAt: string | null;
}

export default function FollowingPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth?next=/fan/following');
      return;
    }
    if (status === 'loading' || !user?.uid) return;

    // Client-side Firestore read
    const load = async () => {
      try {
        const { getFirestore, collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
        const { firebaseApp } = await import('@/lib/firebase/app');
        const db = getFirestore(firebaseApp);
        const q = query(
          collection(db, 'follows'),
          where('fanUid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        setFollows(snap.docs.map((doc) => ({
          followId: doc.id,
          artistId: doc.data()['artistId'] as string,
          createdAt: doc.data()['createdAt']?.toDate?.()?.toLocaleDateString() ?? null,
        })));
      } catch {
        setFollows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, user?.uid, router]);

  const handleUnfollow = async (artistId: string) => {
    setUnfollowingId(artistId);
    try {
      await fetch('/api/fan/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      });
      setFollows((prev) => prev.filter((f) => f.artistId !== artistId));
    } catch { /* ignore */ }
    setUnfollowingId(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <h1 className="text-2xl font-bold tracking-tight">Following</h1>
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse border border-white/8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Following</h1>
        <span className="text-xs text-[#94A3B8] bg-[#1E2032] px-3 py-1 rounded-full border border-[#2B2D44]">
          {follows.length} artist{follows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {follows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-[#2B2D44] bg-[#0D1117]">
          <span className="text-5xl">❤️</span>
          <div>
            <p className="text-white font-bold">Not following anyone yet</p>
            <p className="text-sm text-[#64748B] mt-1 max-w-xs mx-auto">
              Tap the ❤️ on any artist profile to follow them and get notified when they go live near you.
            </p>
          </div>
          <Link href="/fan/nearby">
            <button type="button" className="bg-[#7C3AED] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#6D28D9] transition">
              📍 Find Artists Nearby
            </button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {follows.map((f) => (
            <li
              key={f.followId}
              className="flex items-center gap-4 rounded-xl border border-[#2B2D44] bg-[#151722] px-4 py-3"
            >
              <div className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-pink-500/20 text-lg font-bold text-pink-400">
                {f.artistId.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm text-white">{f.artistId}</p>
                {f.createdAt && <p className="text-xs text-[#64748B]">Followed {f.createdAt}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/artist/${f.artistId}`}>
                  <button type="button" className="text-xs text-[#A855F7] border border-[#7C3AED] px-3 py-1.5 rounded-full hover:bg-[#7C3AED]/20 transition">
                    Profile
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnfollow(f.artistId)}
                  disabled={unfollowingId === f.artistId}
                  className="text-xs text-[#64748B] border border-[#374151] px-3 py-1.5 rounded-full hover:text-red-400 hover:border-red-400 transition disabled:opacity-50"
                >
                  {unfollowingId === f.artistId ? '…' : 'Unfollow'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-[#64748B]">
        You'll get alerts when followed artists go live near you.
      </p>
    </div>
  );
}
