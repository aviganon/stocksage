'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is set (a G-XXXXXXX
 * Measurement ID). Inert (renders nothing) until an ID is provided at build
 * time via the Dockerfile build-arg, so it's safe to ship before setup.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
