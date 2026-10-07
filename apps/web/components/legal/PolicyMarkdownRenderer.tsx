'use client';

/**
 * Crowdbeats V2 — Professional Legal Policy Markdown Renderer
 *
 * Implements a clean, precise, line-by-line Markdown parser and renderer:
 * - Formats headings (H1, H2, H3, H4) with clean Sonic Precision accent indicators
 * - Formats structured metadata cards (Effective Date, Version, Jurisdiction)
 * - Formats bullet lists and numbered lists with custom badges
 * - Formats blockquotes with custom left-accent callout boxes
 * - Formats bold, code, italics, and internal Next.js Links
 * - Full light / dark theme responsiveness matching the Sonic Precision design system
 */

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/theme/ThemeProvider';

interface PolicyMarkdownRendererProps {
  content: string;
}

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'hr' | 'blockquote' | 'meta_grid' | 'ul' | 'ol' | 'p';
  content?: string;
  items?: string[];
  metaPairs?: { key: string; value: string }[];
}

export const PolicyMarkdownRenderer: React.FC<PolicyMarkdownRendererProps> = ({ content }) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Theme-aware Apple tokens
  const textPrimary = isLight ? '#1D1D1F' : '#F5F5F7';
  const textBody = isLight ? '#1D1D1F' : '#D4D4D8';
  const textSecondary = isLight ? '#6E6E73' : '#86868B';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const metaGridBg = isLight ? '#F5F5F7' : '#1D1D1F';
  const quoteBg = isLight ? 'rgba(0, 113, 227, 0.05)' : 'rgba(0, 113, 227, 0.08)';
  const codeBg = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';

  // Parse lines into structured blocks
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule: --- or ***
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading 1: # Title
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', content: trimmed.replace(/^#\s+/, '') });
      i++;
      continue;
    }

    // Heading 2: ## Section Title
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
      i++;
      continue;
    }

    // Heading 3: ### Subsection Title
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.replace(/^###\s+/, '') });
      i++;
      continue;
    }

    // Blockquote: lines starting with >
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join(' ') });
      continue;
    }

    // Unordered List: lines starting with - or *
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items: listItems });
      continue;
    }

    // Ordered List: lines starting with 1. 2. etc.
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items: listItems });
      continue;
    }

    // Metadata Grid detection (consecutive **Key:** Value pairs)
    if (/^\*\*[^*]+:\*\*/.test(trimmed)) {
      const pairs: { key: string; value: string }[] = [];
      while (i < lines.length && /^\*\*[^*]+:\*\*/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^\*\*([^*]+):\*\*\s*(.*)$/);
        if (match) {
          pairs.push({ key: match[1], value: match[2] });
        }
        i++;
      }
      if (pairs.length > 0) {
        blocks.push({ type: 'meta_grid', metaPairs: pairs });
        continue;
      }
    }

    // Regular Paragraph: accumulate contiguous non-empty lines
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('---') &&
      !lines[i].trim().startsWith('***') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^\*\*[^*]+:\*\*/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', content: pLines.join(' ') });
  }

  // Helper to parse inline markdown (bold, links, code, italics) into clean React nodes
  const parseInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex for inline tokens: links [text](url), bold **text**, code `text`, italic *text* or _text_
    const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(remaining)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(remaining.substring(lastIndex, matchIndex));
      }

      if (match[2] && match[3]) {
        // Link [text](url)
        const linkText = match[2];
        const linkUrl = match[3];
        const isInternal = linkUrl.startsWith('/');
        if (isInternal) {
          parts.push(
            <Link
              key={`link-${keyIdx++}`}
              href={linkUrl}
              style={{
                color: isLight ? '#000000' : '#F5F5F7',
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(245, 245, 247, 0.4)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {linkText}
            </Link>
          );
        } else {
          parts.push(
            <a
              key={`extlink-${keyIdx++}`}
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                color: isLight ? '#000000' : '#F5F5F7',
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(245, 245, 247, 0.4)'}`,
              }}
            >
              {linkText} ↗
            </a>
          );
        }
      } else if (match[4]) {
        // Bold **text**
        parts.push(
          <strong key={`bold-${keyIdx++}`} style={{ color: textPrimary, fontWeight: 600 }}>
            {match[4]}
          </strong>
        );
      } else if (match[5]) {
        // Inline code `text`
        parts.push(
          <code
            key={`code-${keyIdx++}`}
            style={{
              padding: '2px 6px',
              borderRadius: 6,
              backgroundColor: codeBg,
              color: isLight ? '#000000' : '#F5F5F7',
              fontFamily: 'var(--cb-font-mono, SF Mono, Menlo, monospace)',
              fontSize: '0.88em',
              border: `1px solid ${borderColor}`,
            }}
          >
            {match[5]}
          </code>
        );
      } else if (match[6] || match[7]) {
        // Italic *text* or _text_
        parts.push(
          <em key={`em-${keyIdx++}`} style={{ color: isLight ? '#4B5563' : '#E2E8F0', fontStyle: 'italic' }}>
            {match[6] || match[7]}
          </em>
        );
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    return parts.length === 1 ? parts[0] : <React.Fragment key={Math.random()}>{parts}</React.Fragment>;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        color: textBody,
        fontSize: '0.975rem',
        lineHeight: 1.65,
        fontFamily: 'var(--cb-font-body)',
      }}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <div
                key={idx}
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: 16,
                  marginBottom: 8,
                }}
              >
                <h1
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                    fontWeight: 600,
                    color: textPrimary,
                    letterSpacing: '-0.025em',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {parseInline(block.content || '')}
                </h1>
              </div>
            );

          case 'h2':
            return (
              <div
                key={idx}
                style={{
                  marginTop: 28,
                  paddingTop: 18,
                  borderTop: `1px solid ${borderColor}`,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: textPrimary,
                    letterSpacing: '-0.018em',
                    margin: '0 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 4,
                      height: 18,
                      borderRadius: 2,
                      backgroundColor: isLight ? '#000000' : '#F5F5F7',
                    }}
                  />
                  <span>{parseInline(block.content || '')}</span>
                </h2>
              </div>
            );

          case 'h3': {
            const isHighlight =
              block.content?.includes('Summary') ||
              block.content?.includes('Highlights') ||
              block.content?.includes('Overview');
            return (
              <div
                key={idx}
                style={{
                  marginTop: 12,
                  backgroundColor: isHighlight
                    ? isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)'
                    : 'transparent',
                  padding: isHighlight ? '14px 18px' : 0,
                  borderRadius: isHighlight ? 12 : 0,
                  border: isHighlight
                    ? `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'}`
                    : 'none',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--cb-font-display)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    letterSpacing: '-0.014em',
                    color: isHighlight ? (isLight ? '#000000' : '#F5F5F7') : textPrimary,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {parseInline(block.content || '')}
                </h3>
              </div>
            );
          }

          case 'hr':
            return (
              <hr
                key={idx}
                style={{
                  border: 'none',
                  height: 1,
                  background: isLight
                    ? 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 100%)'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)',
                  margin: '12px 0',
                }}
              />
            );

          case 'meta_grid':
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  backgroundColor: metaGridBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  margin: '4px 0 12px',
                }}
              >
                {block.metaPairs?.map((pair, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        color: textSecondary,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--cb-font-display)',
                      }}
                    >
                      {pair.key}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: textPrimary, fontWeight: 500 }}>
                      {parseInline(pair.value)}
                    </span>
                  </div>
                ))}
              </div>
            );

          case 'blockquote':
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: quoteBg,
                  borderLeft: `3px solid ${isLight ? '#000000' : '#F5F5F7'}`,
                  borderRadius: '0 12px 12px 0',
                  padding: '14px 18px',
                  color: isLight ? '#1D1D1F' : '#E2E8F0',
                  fontSize: '0.95rem',
                  fontStyle: 'italic',
                  margin: '4px 0',
                }}
              >
                {parseInline(block.content || '')}
              </div>
            );

          case 'ul':
            return (
              <ul
                key={idx}
                style={{
                  margin: '0 0 8px',
                  paddingLeft: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: isLight ? '#000000' : '#F5F5F7',
                        marginTop: 9,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>{parseInline(item)}</div>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol
                key={idx}
                style={{
                  margin: '0 0 8px',
                  paddingLeft: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: isLight ? '#000000' : '#F5F5F7',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {itemIdx + 1}
                    </span>
                    <div style={{ flex: 1 }}>{parseInline(item)}</div>
                  </li>
                ))}
              </ol>
            );

          case 'p':
          default:
            return (
              <p key={idx} style={{ margin: 0, lineHeight: 1.75 }}>
                {parseInline(block.content || '')}
              </p>
            );
        }
      })}
    </div>
  );
};
