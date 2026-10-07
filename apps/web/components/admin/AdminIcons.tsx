import React from 'react';

/**
 * Crowdbeats V2 — Enterprise Admin SVG Outline Icon System
 *
 * Designed in the clean, precise Lucide outline style (24x24 viewBox, stroke-based).
 * All icons accept { size, className, style, strokeWidth, ...svgProps }.
 */

export interface AdminIconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number | string;
}

export function createAdminIcon(displayName: string, paths: React.ReactNode) {
  const IconComponent = React.forwardRef<SVGSVGElement, AdminIconProps>(
    ({ size = 18, className = '', style, strokeWidth = 2, ...props }, ref) => (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    )
  );
  IconComponent.displayName = displayName;
  return IconComponent;
}

// ── Core Navigation & Section Icons ──────────────────────────────────────────

export const CommandCenterIcon = createAdminIcon('CommandCenterIcon', (
  <>
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </>
));
export const DashboardIcon = CommandCenterIcon;

export const UserIcon = createAdminIcon('UserIcon', (
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
));

export const UsersIcon = createAdminIcon('UsersIcon', (
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
));

export const ArtistsIcon = createAdminIcon('ArtistsIcon', (
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>
));
export const MusicIcon = ArtistsIcon;

export const StaffIcon = createAdminIcon('StaffIcon', (
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
));
export const ShieldIcon = StaffIcon;

export const LiveIcon = createAdminIcon('LiveIcon', (
  <>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </>
));
export const RadioIcon = LiveIcon;

export const ActivityIcon = createAdminIcon('ActivityIcon', (
  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
));

export const VenuesIcon = createAdminIcon('VenuesIcon', (
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>
));
export const MapPinIcon = VenuesIcon;

export const CampaignsIcon = createAdminIcon('CampaignsIcon', (
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>
));
export const TargetIcon = CampaignsIcon;

export const ContentIcon = createAdminIcon('ContentIcon', (
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </>
));
export const FileTextIcon = ContentIcon;

export const FinanceIcon = createAdminIcon('FinanceIcon', (
  <>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </>
));
export const CreditCardIcon = FinanceIcon;

export const DollarSignIcon = createAdminIcon('DollarSignIcon', (
  <>
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </>
));

export const SlidersIcon = createAdminIcon('SlidersIcon', (
  <>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </>
));

export const SettingsIcon = createAdminIcon('SettingsIcon', (
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const SponsorsIcon = createAdminIcon('SponsorsIcon', (
  <>
    <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.3 1.3" />
    <path d="m18 10 1.5-1.5a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L13.7 6" />
    <path d="M14 6 8.5 11.5a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0L14 14" />
    <path d="m3 7 3-3a1 1 0 0 1 1.4 0l4.6 4.6" />
    <path d="m6 18-3-3a1 1 0 0 1 0-1.4l4.6-4.6" />
  </>
));
export const HandshakeIcon = SponsorsIcon;

export const SupportIcon = createAdminIcon('SupportIcon', (
  <>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </>
));
export const HeadphonesIcon = SupportIcon;

export const AlertCircleIcon = createAdminIcon('AlertCircleIcon', (
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>
));

export const AlertTriangleIcon = createAdminIcon('AlertTriangleIcon', (
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>
));

export const ThreatIcon = createAdminIcon('ThreatIcon', (
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>
));

export const ComplianceIcon = createAdminIcon('ComplianceIcon', (
  <>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </>
));
export const ScaleIcon = ComplianceIcon;

export const IntegrationsIcon = createAdminIcon('IntegrationsIcon', (
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
));
export const ZapIcon = IntegrationsIcon;

export const AnalyticsIcon = createAdminIcon('AnalyticsIcon', (
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>
));
export const TrendingUpIcon = AnalyticsIcon;

export const FlagIcon = createAdminIcon('FlagIcon', (
  <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </>
));

// ── Utility & Interactive Icons ──────────────────────────────────────────────

export const SearchIcon = createAdminIcon('SearchIcon', (
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
));

export const FilterIcon = createAdminIcon('FilterIcon', (
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
));

export const RefreshIcon = createAdminIcon('RefreshIcon', (
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </>
));

export const ChevronDownIcon = createAdminIcon('ChevronDownIcon', (
  <polyline points="6 9 12 15 18 9" />
));

export const ChevronRightIcon = createAdminIcon('ChevronRightIcon', (
  <polyline points="9 18 15 12 9 6" />
));

export const ChevronUpIcon = createAdminIcon('ChevronUpIcon', (
  <polyline points="18 15 12 9 6 15" />
));

export const ChevronLeftIcon = createAdminIcon('ChevronLeftIcon', (
  <polyline points="15 18 9 12 15 6" />
));

export const CheckIcon = createAdminIcon('CheckIcon', (
  <polyline points="20 6 9 17 4 12" />
));

export const XIcon = createAdminIcon('XIcon', (
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
));

export const CopyIcon = createAdminIcon('CopyIcon', (
  <>
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
));

export const ExternalLinkIcon = createAdminIcon('ExternalLinkIcon', (
  <>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </>
));

export const MoreVerticalIcon = createAdminIcon('MoreVerticalIcon', (
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>
));

export const LogOutIcon = createAdminIcon('LogOutIcon', (
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
));

export const SunIcon = createAdminIcon('SunIcon', (
  <>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </>
));

export const MoonIcon = createAdminIcon('MoonIcon', (
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
));

export const BellIcon = createAdminIcon('BellIcon', (
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
));

export const ArrowUpRightIcon = createAdminIcon('ArrowUpRightIcon', (
  <>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </>
));

export const ArrowDownRightIcon = createAdminIcon('ArrowDownRightIcon', (
  <>
    <line x1="7" y1="7" x2="17" y2="17" />
    <polyline points="17 7 17 17 7 17" />
  </>
));

export const ArrowUpIcon = createAdminIcon('ArrowUpIcon', (
  <>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </>
));

export const ArrowDownIcon = createAdminIcon('ArrowDownIcon', (
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </>
));

// ── Additional Admin Shell Icons & Aliases ───────────────────────────────────

export const MenuIcon = createAdminIcon('MenuIcon', (
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </>
));

export const MonitorIcon = createAdminIcon('MonitorIcon', (
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
));

export const ServerIcon = createAdminIcon('ServerIcon', (
  <>
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </>
));

export const AdminBrandIcon = createAdminIcon('AdminBrandIcon', (
  <>
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    <path d="M9 12v3" />
    <path d="M12 9v9" />
    <path d="M15 11v5" />
  </>
));

// Additional Enterprise Admin Icons
export const CheckCircleIcon = createAdminIcon('CheckCircleIcon', (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>
));

export const EditIcon = createAdminIcon('EditIcon', (
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </>
));
export const PencilIcon = EditIcon;

export const TrashIcon = createAdminIcon('TrashIcon', (
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </>
));

export const MailIcon = createAdminIcon('MailIcon', (
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>
));

export const MessageSquareIcon = createAdminIcon('MessageSquareIcon', (
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
));

export const ClockIcon = createAdminIcon('ClockIcon', (
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>
));
export const HistoryIcon = ClockIcon;

export const LockIcon = createAdminIcon('LockIcon', (
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
));

export const UnlockIcon = createAdminIcon('UnlockIcon', (
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </>
));

export const ShieldCheckIcon = createAdminIcon('ShieldCheckIcon', (
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </>
));

export const BanIcon = createAdminIcon('BanIcon', (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </>
));

export const EyeIcon = createAdminIcon('EyeIcon', (
  <>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const DatabaseIcon = createAdminIcon('DatabaseIcon', (
  <>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </>
));

export const CodeIcon = createAdminIcon('CodeIcon', (
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </>
));

export const HeartIcon = createAdminIcon('HeartIcon', (
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
));

export const KeyIcon = createAdminIcon('KeyIcon', (
  <>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </>
));

export const AwardIcon = createAdminIcon('AwardIcon', (
  <>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </>
));

export const SendIcon = createAdminIcon('SendIcon', (
  <>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>
));

// Semantic aliases matching Admin Layout structure
export const CrmIcon = UsersIcon;
export const StaffRolesIcon = StaffIcon;
export const LiveRadarIcon = LiveIcon;
export const ContentModerationIcon = ContentIcon;
export const FinancialLedgerIcon = FinanceIcon;
export const PlatformFeesIcon = SlidersIcon;
export const TrustSafetyIcon = ShieldIcon;
export const SupportQueueIcon = SupportIcon;
export const SecurityThreatsIcon = ThreatIcon;
export const ComplianceRegisterIcon = ComplianceIcon;
export const InfraHealthIcon = ServerIcon;
export const FeatureFlagsIcon = FlagIcon;
export const ShieldBadgeIcon = ShieldIcon;

// Animated Live Pulse Dot for Header & Shell Status
export const DownloadIcon = createAdminIcon('DownloadIcon', (
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
));

export function LivePulseDot({
  size = 8,
  color = '#10B981',
  className,
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          backgroundColor: color,
          opacity: 0.75,
          animation: 'adminPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '9999px',
          backgroundColor: color,
        }}
      />
    </span>
  );
}
