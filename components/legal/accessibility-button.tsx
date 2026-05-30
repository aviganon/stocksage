'use client';

import Link from 'next/link';

/**
 * Floating accessibility button — required by Israeli Standard IS 5568.
 * Fixed in bottom-left corner, links to /accessibility statement.
 */
export function AccessibilityButton() {
  return (
    <Link
      href="/accessibility"
      aria-label="הצהרת נגישות"
      title="נגישות"
      className="fixed bottom-5 left-5 z-50 w-11 h-11 rounded-full flex items-center justify-center
                 bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40
                 transition-all hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
    >
      {/* WCAG wheelchair icon (simplified SVG) */}
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="4" r="2" />
        <path d="M10 7h4l1 5h3v2h-3.5l-.5-2H11l-1 5H7v-2h2z" />
        <path d="M8 14l-1 4H5l1.5-5.5" />
        <path d="M14 16a4 4 0 1 1-5.66 0" strokeWidth="1.5" stroke="currentColor" fill="none" />
      </svg>
    </Link>
  );
}
