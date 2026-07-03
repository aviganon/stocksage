import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
import { I18nProvider } from '@/lib/i18n/context';
import { CookieConsent } from '@/components/legal/cookie-consent';
import { AccessibilityButton } from '@/components/legal/accessibility-button';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'StockSage — AI Stock Research',
    template: '%s | StockSage',
  },
  description: 'Deep AI-powered research reports on US, European and Israeli stocks in seconds.',
  applicationName: 'StockSage',
  keywords: ['stock analysis', 'AI stock research', 'stock research', 'equity research', 'AAPL analysis', 'NVDA analysis'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-[#e8e8f0]">
        <I18nProvider>
          {/* Ambient background — fixed, renders behind all pages */}
          <div className="ambient-bg" aria-hidden="true" />
          <div className="ambient-grid" aria-hidden="true" />
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
          <AccessibilityButton />
        </I18nProvider>
      </body>
    </html>
  );
}
