'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataExportModal } from '@/components/compliance/DataExportModal';
import { StatementDocumentView } from '@/components/compliance/StatementDocumentView';
import { getUserStatementData, type UserStatementData } from '@/lib/compliance/userDataExport';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/app';

const db = getFirestore(firebaseApp);

interface ArchiveUser {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  deletedAt: string;
}

export default function UserArchivesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUserForModal, setSelectedUserForModal] = useState<ArchiveUser | null>(null);
  const [inspectStatement, setInspectStatement] = useState<UserStatementData | null>(null);

  const [archives, setArchives] = useState<ArchiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArchives() {
      try {
        const q = query(collection(db, 'users'), where('deletedAt', '!=', null));
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => ({
          uid: doc.id,
          fullName: doc.data().displayName || doc.data().fullName || 'Unknown User',
          email: doc.data().email || 'No email',
          role: doc.data().personaType || 'fan',
          deletedAt: doc.data().deletedAt?.toDate ? doc.data().deletedAt.toDate().toLocaleString() : String(doc.data().deletedAt),
        }));
        setArchives(users);
      } catch (e: any) {
        if (e.message?.includes('index')) {
          try {
            // fallback without where clause if index missing, then filter in memory
            const snap = await getDocs(collection(db, 'users'));
            const users = snap.docs
              .filter(d => d.data().deletedAt != null)
              .map(doc => ({
                uid: doc.id,
                fullName: doc.data().displayName || doc.data().fullName || 'Unknown User',
                email: doc.data().email || 'No email',
                role: doc.data().personaType || 'fan',
                deletedAt: doc.data().deletedAt?.toDate ? doc.data().deletedAt.toDate().toLocaleString() : String(doc.data().deletedAt),
              }));
            setArchives(users);
          } catch(e2: any) {
             setError(e2.message);
          }
        } else {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadArchives();
  }, []);

  const filteredUsers = archives.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleInspect = (user: ArchiveUser) => {
    const data = getUserStatementData({
      uid: user.uid,
      fullName: user.fullName,
      email: user.email,
      role: user.role as any,
      taxYear: 2026,
    });
    setInspectStatement(data);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* ── BREADCRUMB ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Link href="/admin/compliance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Compliance Center
        </Link>
        <span>/</span>
        <Link href="/admin/finance" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span>User Legal Data & Archives</span>
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              User Legal Data & Soft-Deleted Archives
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Retention Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, maxWidth: 850 }}>
            Complete audit ledger of soft-deleted user account archives preserved for IRS, statutory CCPA/GDPR, and business legal obligations.
          </p>
        </div>
      </div>

      {/* ── SUMMARY KPIS ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ backgroundColor: 'var(--surface-card)', padding: 20, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Archived User Statements</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{loading ? '...' : archives.length} Records</div>
          <div style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>● Preserved Soft Deletes</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          backgroundColor: 'var(--surface-card)',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by User Name, Email, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filter Role:</span>
          {['ALL', 'artist', 'fan', 'staff'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: roleFilter === role ? '1px solid #7C3AED' : '1px solid var(--border-subtle)',
                backgroundColor: roleFilter === role ? 'rgba(124, 58, 237, 0.2)' : 'var(--surface-raised)',
                color: roleFilter === role ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── USER ARCHIVES TABLE ──────────────────────────────────────── */}
      <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden', marginBottom: 28 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading user archives...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Error: {error}</div>
        ) : archives.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>🗄️</span>
            No archived users found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>User / Entity</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Deleted At</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.uid}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {user.email} • <code style={{ color: '#A855F7' }}>{user.uid}</code>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: 'rgba(124, 58, 237, 0.15)',
                        color: '#C084FC',
                        padding: '3px 8px',
                        borderRadius: 6,
                        textTransform: 'capitalize',
                      }}
                    >
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                    {user.deletedAt}
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleInspect(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#7C3AED',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Inspect Data
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── INLINE STATEMENT INSPECTOR (IF ACTIVE) ───────────────────── */}
      {inspectStatement && (
        <div style={{ marginTop: 32, borderTop: '2px solid var(--accent-primary)', paddingTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Archived Data Inspector (UID: {inspectStatement.user.uid})
            </h2>
            <button
              onClick={() => setInspectStatement(null)}
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕ Close Inspector
            </button>
          </div>
          <StatementDocumentView data={inspectStatement} showActions={true} />
        </div>
      )}

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      {selectedUserForModal && (
        <DataExportModal
          isOpen={Boolean(selectedUserForModal)}
          onClose={() => setSelectedUserForModal(null)}
          defaultRole={selectedUserForModal.role as any}
          userName={selectedUserForModal.fullName}
          userEmail={selectedUserForModal.email}
          userUid={selectedUserForModal.uid}
        />
      )}
    </div>
  );
}
