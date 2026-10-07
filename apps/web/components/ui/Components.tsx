/** Crowdbeats V2 — Card, Avatar, StatusBadge, Skeleton, Toast, Modal, Drawer,
 *  EmptyState, Table, ConfirmationModal, AmountSelector, ProgressBar,
 *  LiveStageChip, NavBar components (Phase 4)
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

// ══════════════════════════════════════════════════════════════════════════════
// CARD
// ══════════════════════════════════════════════════════════════════════════════

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isLive?: boolean;
  mediaSlot?: React.ReactNode;
  as?: React.ElementType;
}

export function CbCard({
  children,
  className = '',
  onClick,
  isLive = false,
  mediaSlot,
  as: Tag = 'div',
}: CardProps) {
  const isInteractive = Boolean(onClick);
  return (
    <Tag
      className={[
        'cb-card',
        isLive ? 'cb-card--live' : '',
        isInteractive ? 'cb-card--interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      style={isLive ? { '--card-shadow': 'var(--shadow-pink-glow)' } as React.CSSProperties : undefined}
    >
      {mediaSlot && <div className="cb-card__media">{mediaSlot}</div>}
      <div className="cb-card__body">{children}</div>
    </Tag>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AVATAR
// ══════════════════════════════════════════════════════════════════════════════

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const AVATAR_SIZES: Record<AvatarSize, number> = {
  xs: 24, sm: 32, md: 40, lg: 48, xl: 64, '2xl': 96,
};

interface AvatarProps {
  src?: string;
  initials?: string;
  size?: AvatarSize;
  isLive?: boolean;
  alt: string; // Required for accessibility
  className?: string;
}

export function CbAvatar({
  src,
  initials,
  size = 'md',
  isLive = false,
  alt,
  className = '',
}: AvatarProps) {
  const px = AVATAR_SIZES[size];
  const fontSize = Math.max(10, Math.round(px * 0.36));

  return (
    <div
      className={['cb-avatar', isLive ? 'cb-avatar--live' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ '--avatar-size': `${px}px`, '--avatar-font': `${fontSize}px` } as React.CSSProperties}
      aria-label={isLive ? `${alt} (live)` : alt}
      role="img"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="cb-avatar__img" draggable={false} />
      ) : (
        <span className="cb-avatar__initials" aria-hidden="true">
          {initials ?? alt.charAt(0).toUpperCase()}
        </span>
      )}
      {isLive && (
        <span className="cb-avatar__live-dot" aria-hidden="true" />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STATUS BADGE — never color-only
// ══════════════════════════════════════════════════════════════════════════════

export type CbStatusType = 'success' | 'warning' | 'error' | 'info' | 'live' | 'neutral';

const STATUS_ICONS: Record<CbStatusType, string> = {
  success: '✓',
  warning: '⚠',
  error:   '✕',
  info:    'i',
  live:    '●',
  neutral: '○',
};

const STATUS_LABELS: Record<CbStatusType, string> = {
  success: 'Success',
  warning: 'Warning',
  error:   'Error',
  info:    'Info',
  live:    'Live',
  neutral: '',
};

interface StatusBadgeProps {
  status: CbStatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function CbStatusBadge({
  status,
  label,
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const displayLabel = label ?? STATUS_LABELS[status];
  return (
    <span
      className={['cb-badge', `cb-badge--${status}`, className].filter(Boolean).join(' ')}
      aria-label={`${STATUS_LABELS[status]}: ${displayLabel}`}
    >
      {showIcon && (
        <span className="cb-badge__icon" aria-hidden="true">
          {STATUS_ICONS[status]}
        </span>
      )}
      <span className="cb-badge__label">{displayLabel}</span>
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function CbSkeleton({
  width = '100%',
  height = 20,
  radius = 'var(--radius-xs)',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={['cb-skeleton', className].filter(Boolean).join(' ')}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
      }}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST / BANNER
// ══════════════════════════════════════════════════════════════════════════════

interface ToastItem {
  id: string;
  message: string;
  status: CbStatusType;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, status?: CbStatusType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within CbToastProvider');
  return ctx;
}

export function CbToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, status: CbStatusType = 'info', duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, status, duration }]);
      if (duration > 0) {
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="cb-toast-region"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={['cb-toast', `cb-toast--${t.status}`].join(' ')}
            role="status"
          >
            <span className="cb-toast__icon" aria-hidden="true">
              {STATUS_ICONS[t.status]}
            </span>
            <span className="cb-toast__message">{t.message}</span>
            <button
              className="cb-toast__close"
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface BannerProps {
  message: string;
  status?: CbStatusType;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  style?: React.CSSProperties;
}

export function CbBanner({ message, status = 'info', onDismiss, action, style }: BannerProps) {
  return (
    <div className={['cb-banner', `cb-banner--${status}`].join(' ')} role="alert" style={style}>
      <span className="cb-banner__icon" aria-hidden="true">{STATUS_ICONS[status]}</span>
      <span className="cb-banner__message">{message}</span>
      {action && (
        <button className="cb-banner__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button className="cb-banner__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════════════════════

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function CbModal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="cb-modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className={['cb-modal', `cb-modal--${size}`].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cb-modal__header">
          <h2 id={titleId} className="cb-modal__title">{title}</h2>
          <button
            className="cb-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="cb-modal__body">{children}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DRAWER (slide-in from right on desktop, bottom on mobile)
// ══════════════════════════════════════════════════════════════════════════════

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'right' | 'bottom';
}

export function CbDrawer({ open, onClose, title, children, side = 'right' }: DrawerProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="cb-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={['cb-drawer', `cb-drawer--${side}`, open ? 'cb-drawer--open' : ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className="cb-drawer__header">
          <h2 id={titleId} className="cb-drawer__title">{title}</h2>
          <button className="cb-drawer__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cb-drawer__body">{children}</div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE / ERROR STATE
// ══════════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CbEmptyState({ icon = '🎵', title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="cb-empty" role="status">
      <span className="cb-empty__icon" aria-hidden="true">{icon}</span>
      <p className="cb-empty__title">{title}</p>
      {subtitle && <p className="cb-empty__subtitle">{subtitle}</p>}
      {action && <div className="cb-empty__action">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}

export function CbErrorState({
  title = 'Something went wrong',
  subtitle,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="cb-empty cb-empty--error" role="alert">
      <span className="cb-empty__icon" aria-hidden="true">⚠</span>
      <p className="cb-empty__title">{title}</p>
      {subtitle && <p className="cb-empty__subtitle">{subtitle}</p>}
      {onRetry && (
        <div className="cb-empty__action">
          <button className="cb-btn cb-btn--secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════════════════════

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  caption: string; // Accessible table caption — REQUIRED
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function CbTable<T>({
  columns,
  rows,
  caption,
  keyExtractor,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="cb-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="cb-table">
        <caption className="cb-table__caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className="cb-table__th"
                style={{ textAlign: col.align ?? 'left', width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={['cb-table__tr', onRowClick ? 'cb-table__tr--clickable' : ''].filter(Boolean).join(' ')}
              onClick={() => onRowClick?.(row)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => { if (e.key === 'Enter') onRowClick(row); }
                  : undefined
              }
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="cb-table__td"
                  style={{ textAlign: col.align ?? 'left' }}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ══════════════════════════════════════════════════════════════════════════════

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CbConfirmationModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <CbModal open={open} onClose={onCancel} title={title} size="sm">
      <p className="cb-confirm__message">{message}</p>
      <div className="cb-confirm__actions">
        <button className="cb-btn cb-btn--ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          className={`cb-btn ${isDestructive ? 'cb-btn--destructive' : 'cb-btn--primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </CbModal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AMOUNT SELECTOR
// ══════════════════════════════════════════════════════════════════════════════

const CURRENCY_FORMATTERS: Record<string, Intl.NumberFormat> = {};

function formatCurrency(cents: number, currency: string): string {
  const key = currency;
  if (!CURRENCY_FORMATTERS[key]) {
    CURRENCY_FORMATTERS[key] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    });
  }
  return CURRENCY_FORMATTERS[key].format(cents / 100);
}

interface AmountSelectorProps {
  presets?: number[]; // cents
  value?: number;     // cents
  minAmount?: number; // cents, default 100
  maxAmount?: number; // cents, default 50000
  onChange: (cents: number) => void;
  currency?: string;
  label?: string;
}

export function CbAmountSelector({
  presets = [100, 200, 500, 1000],
  value,
  minAmount = 100,
  maxAmount = 50000,
  onChange,
  currency = 'USD',
  label = 'Select amount',
}: AmountSelectorProps) {
  const [customRaw, setCustomRaw] = useState('');
  const [customError, setCustomError] = useState('');
  const isPreset = value !== undefined && presets.includes(value);
  const inputId = useId();

  function handlePreset(cents: number) {
    setCustomRaw('');
    setCustomError('');
    onChange(cents);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setCustomRaw(raw);
    const dollars = parseFloat(raw);
    if (isNaN(dollars) || dollars <= 0) {
      setCustomError('Enter a valid amount');
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents < minAmount) {
      setCustomError(`Minimum is ${formatCurrency(minAmount, currency)}`);
      return;
    }
    if (cents > maxAmount) {
      setCustomError(`Maximum is ${formatCurrency(maxAmount, currency)}`);
      return;
    }
    setCustomError('');
    onChange(cents);
  }

  return (
    <div className="cb-amount" role="group" aria-label={label}>
      <div className="cb-amount__presets">
        {presets.map((cents) => (
          <button
            key={cents}
            className={[
              'cb-amount__chip',
              value === cents && isPreset ? 'cb-amount__chip--selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handlePreset(cents)}
            aria-pressed={value === cents && isPreset}
            aria-label={formatCurrency(cents, currency)}
          >
            {formatCurrency(cents, currency)}
          </button>
        ))}
      </div>
      <div className="cb-amount__custom">
        <label htmlFor={inputId} className="cb-amount__label">
          Custom amount
        </label>
        <div className="cb-amount__input-wrap">
          <span className="cb-amount__currency-symbol" aria-hidden="true">
            {currency === 'USD' ? '$' : currency}
          </span>
          <input
            id={inputId}
            type="number"
            className="cb-amount__input"
            placeholder="0.00"
            value={customRaw}
            min={(minAmount / 100).toFixed(2)}
            max={(maxAmount / 100).toFixed(2)}
            step="0.01"
            onChange={handleCustomChange}
            aria-describedby={customError ? `${inputId}-err` : undefined}
            aria-invalid={Boolean(customError) || undefined}
          />
        </div>
        {customError && (
          <p id={`${inputId}-err`} className="cb-amount__error" role="alert">
            <span aria-hidden="true">⚠ </span>{customError}
          </p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR + MINI CHART (accessible)
// ══════════════════════════════════════════════════════════════════════════════

interface ProgressBarProps {
  value: number; // 0–100
  label: string; // e.g. '60% funded'
  color?: string;
  showLabel?: boolean;
}

export function CbProgressBar({
  value,
  label,
  color = 'var(--accent-primary)',
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="cb-progress">
      {showLabel && (
        <div className="cb-progress__label">
          <span>{label}</span>
          <span className="cb-progress__pct">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="cb-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="cb-progress__fill"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface MiniChartProps {
  values: number[];  // 0–100 normalized
  labels: string[];  // one per bar (required — no color-only)
  caption: string;
}

export function CbMiniChart({ values, labels, caption }: MiniChartProps) {
  const max = Math.max(...values, 1);
  const COLORS = [
    'var(--dataviz-1)', 'var(--dataviz-2)', 'var(--dataviz-3)',
    'var(--dataviz-4)', 'var(--dataviz-5)',
  ];

  return (
    <figure className="cb-chart" aria-label={caption}>
      <figcaption className="cb-sr-only">{caption}</figcaption>
      <div
        className="cb-chart__bars"
        role="img"
        aria-label={`Bar chart: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}
      >
        {values.map((v, i) => (
          <div
            key={i}
            className="cb-chart__bar-wrap"
            aria-label={`${labels[i]}: ${v}`}
          >
            <div
              className="cb-chart__bar"
              style={{
                height: `${(v / max) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
            <span className="cb-chart__bar-label">{labels[i]}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE STAGE CHIP
// ══════════════════════════════════════════════════════════════════════════════

interface LiveStageChipProps {
  stageName: string;
  isLive?: boolean;
  onTap?: () => void;
}

export function CbLiveStageChip({ stageName, isLive = false, onTap }: LiveStageChipProps) {
  const Wrapper = onTap ? 'button' : 'div';
  return (
    <Wrapper
      className={['cb-live-chip', isLive ? 'cb-live-chip--active' : ''].filter(Boolean).join(' ')}
      onClick={onTap}
      aria-label={isLive ? `Live stage: ${stageName}` : `Stage: ${stageName}`}
      {...(Wrapper === 'button' ? { type: 'button' } : {})}
    >
      <span className={['cb-live-chip__dot', isLive ? 'cb-live-chip__dot--pulse' : ''].filter(Boolean).join(' ')} aria-hidden="true" />
      {isLive && <span className="cb-live-chip__badge" aria-hidden="true">LIVE</span>}
      <span className="cb-live-chip__name">{stageName}</span>
    </Wrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV (mobile web)
// ══════════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
}

export function CbBottomNav({ items, activeId }: BottomNavProps) {
  return (
    <nav className="cb-bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Tag = item.href ? 'a' : 'button';
        return (
          <Tag
            key={item.id}
            className={['cb-bottom-nav__item', isActive ? 'cb-bottom-nav__item--active' : ''].filter(Boolean).join(' ')}
            href={item.href}
            onClick={item.onClick}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="cb-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="cb-bottom-nav__label">{item.label}</span>
          </Tag>
        );
      })}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN READER ONLY UTILITY
// ══════════════════════════════════════════════════════════════════════════════

export function CbSrOnly({ children }: { children: React.ReactNode }) {
  return <span className="cb-sr-only">{children}</span>;
}
