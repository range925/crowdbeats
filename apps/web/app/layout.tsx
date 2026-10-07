import type { Metadata, Viewport } from 'next';
import { DM_Sans, JetBrains_Mono, Manrope, Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { CrowdbeatsJsonLd } from '@/components/seo/CrowdbeatsJsonLd';
import { PrivacyConsentWidget } from '@/components/compliance/PrivacyConsentWidget';
import './tokens.css';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://crowdbeats.com'),
  title: {
    default: 'Crowdbeats — Where Fans Fuel The Music',
    template: '%s | Crowdbeats Live Music',
  },
  description:
    'Crowdbeats connects live music fans directly with performing artists. Instant 2-tap tips via Apple Pay, real-time stage radar, automated band splits, and 0% monthly subscriptions.',
  keywords: [
    'Crowdbeats',
    'live music tipping',
    'musician tip jar',
    'band revenue splits',
    'live stage radar',
    'gig discovery',
    'Apple Pay music tip',
    'indie artist income',
    'venue live music',
  ],
  authors: [{ name: 'Crowdbeats Team' }],
  creator: 'Crowdbeats Inc.',
  publisher: 'Crowdbeats Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://crowdbeats.com',
    siteName: 'Crowdbeats',
    title: 'Crowdbeats — Where Fans Fuel The Music',
    description:
      'Direct live artist tipping in 2 taps. Real-time stage check-ins. Automated band splits. 0% monthly subscriptions.',
    images: [
      {
        url: '/crowdbeats_hero_bg.png',
        width: 1200,
        height: 630,
        alt: 'Crowdbeats Live Music Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crowdbeats — Where Fans Fuel The Music',
    description:
      'Direct live artist tipping in 2 taps. Real-time stage check-ins. Automated band revenue splits.',
    images: ['/crowdbeats_hero_bg.png'],
    creator: '@crowdbeats',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: { 
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var resolved = 'light';
                  document.documentElement.setAttribute('data-theme', resolved);
                  document.documentElement.style.colorScheme = resolved;
                  document.documentElement.classList.remove('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,typography" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof tailwind !== 'undefined') {
                tailwind.config = {
                  darkMode: "class",
                  theme: {
                    extend: {
                      colors: {
                        primary: "#7C3AED",
                        "apple-blue": "#0071E3",
                        "apple-card": "#161617",
                        "apple-elevated": "#1D1D1F",
                        "background-light": "#FBFBFD",
                        "background-dark": "#000000",
                      },
                      fontFamily: {
                        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                        mono: ['"SF Mono"', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
                      },
                      borderRadius: {
                        DEFAULT: "1rem",
                        'pill': "9999px",
                        'bento': "24px",
                      },
                      boxShadow: {
                        'apple-card': '0 12px 32px -8px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
                        'glow-purple': '0 0 50px -10px rgba(124, 58, 237, 0.35)',
                        'glow-cyan': '0 0 50px -10px rgba(45, 212, 191, 0.25)',
                        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                      }
                    },
                  },
                };
              }
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-apple-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif;
                --font-apple-text: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif;
                --font-apple-mono: "SF Mono", Monaco, Menlo, Consolas, "Liberation Mono", "Courier New", monospace;
                --font-manrope: var(--font-apple-display);
                --font-inter: var(--font-apple-text);
                --font-dm-sans: var(--font-apple-text);
              }
              html, body {
                font-family: var(--font-apple-text);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                font-feature-settings: "cv02", "cv03", "cv04", "cv11";
              }
              h1, h2, h3, h4, h5, h6 {
                font-family: var(--font-apple-display);
              }
              .text-gradient-purple {
                background: linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #6366F1 100%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                color: transparent;
                display: inline-block;
              }
              .text-gradient-accent {
                background: linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                color: transparent;
                display: inline-block;
              }
              .bg-radial-hero {
                background: radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.08) 35%, transparent 70%);
              }
              .glass-panel {
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
              }
              input[type=range]::-webkit-slider-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #A855F7;
                box-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
                cursor: pointer;
                -webkit-appearance: none;
                margin-top: -6px;
              }
              input[type=range]::-webkit-slider-runnable-track {
                width: 100%;
                height: 8px;
                cursor: pointer;
                background: #27272A;
                border-radius: 9999px;
              }
            `,
          }}
        />
        <CrowdbeatsJsonLd />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased selection:bg-purple-500 selection:text-white min-h-screen relative overflow-x-hidden"
        style={{
          backgroundColor: 'var(--cb-bg-app, #FBFBFD)',
          color: 'var(--cb-text-primary, #1D1D1F)',
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <PrivacyConsentWidget />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


