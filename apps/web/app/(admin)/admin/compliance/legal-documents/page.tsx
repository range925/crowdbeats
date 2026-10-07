'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/app';

const db = getFirestore(firebaseApp);

interface LegalDocument {
  id: string;
  title: string;
  version: string;
  effectiveDate: string;
  type: string;
  url?: string;
}

export default function LegalDocumentsAdminPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        const snap = await getDocs(query(collection(db, 'legalDocuments'), orderBy('effectiveDate', 'desc')));
        const docs = snap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Document',
          version: doc.data().version || 'v1.0',
          effectiveDate: doc.data().effectiveDate || 'Unknown',
          type: doc.data().type || 'Unknown Type',
          url: doc.data().url,
        }));
        setDocuments(docs);
      } catch (e: any) {
        if (e.message?.includes('index')) {
          try {
            const snap = await getDocs(collection(db, 'legalDocuments'));
            const docs = snap.docs.map(doc => ({
              id: doc.id,
              title: doc.data().title || 'Untitled Document',
              version: doc.data().version || 'v1.0',
              effectiveDate: doc.data().effectiveDate || 'Unknown',
              type: doc.data().type || 'Unknown Type',
              url: doc.data().url,
            }));
            setDocuments(docs);
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
    loadDocs();
  }, []);

  return (
    <div style={{ padding: '32px 36px', color: 'var(--text-primary)', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32 }}>📜</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'Montserrat, sans-serif' }}>
                Legal Document Management & Review Center
              </h1>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0 0' }}>
              Canonical platform agreements, versioned draft workflows, counsel notes, and immutable published snapshots.
            </p>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#151722', border: '1px solid #2B2D44', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading legal documents...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Error: {error}</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 16 }}>📂</span>
            No legal documents found in Firestore.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#1E2032', borderBottom: '1px solid #2B2D44', color: '#94A3B8' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Document Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Version</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Effective Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #1E2032' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#FFFFFF' }}>
                    {doc.title}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#A855F7', fontWeight: 600 }}>
                    {doc.type}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#38BDF8' }}>
                    {doc.version}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94A3B8' }}>
                    {doc.effectiveDate}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#1E2032',
                          border: '1px solid #2B2D44',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'inline-block'
                        }}
                      >
                        View 📄
                      </a>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: 12 }}>No URL</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
