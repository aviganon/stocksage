import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
import { I18nProvider } from '@/lib/i18n/context';
import { CookieConsent } from '@/components/legal/cookie-consent';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'StockSage — AI Stock Research',
  description: 'Deep AI-powered research reports on Israeli and global stocks in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#07070d] text-[#e8e8f0]">
        <div className="ambient-bg" aria-hidden="true" />
        <div className="ambient-grid" aria-hidden="true" />
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
        </I18nProvider>
      </body>
    </html>
  );
}
