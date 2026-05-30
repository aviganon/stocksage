# StockSage Landing Page - Claude Implementation Guide

## Files to Create/Update

This archive contains 3 files for the new StockSage landing page:

1. **app/page.tsx** - The main landing page component (832 lines)
2. **app/globals.css** - Global styles 
3. **app/layout.tsx** - Root layout (if needed)

## Quick Installation

Replace the existing `app/page.tsx` with the new version. The page is fully self-contained with:

- All 10 sections from the design brief
- Pure CSS animations (no Framer Motion needed)
- RTL Hebrew support
- Responsive design
- IntersectionObserver for scroll animations
- Typewriter effect hook
- CountUp animation hook

## Sections Included

1. Navbar - Glassmorphism, sticky
2. Hero - Animated gradient mesh, typewriter text, floating mockup
3. Markets - 8 global exchanges with animated cards
4. AI Technology - Flow diagram with data sources
5. 6-Step Analysis - Colored cards with hover effects
6. Live Preview - Interactive depth selector
7. Pricing - 3 tiers with recommended highlight
8. Trust/Social Proof - Partner logos row
9. Final CTA - Gradient background
10. Footer - Links and copyright

## Dependencies

No new dependencies required. Uses only:
- Next.js (existing)
- React hooks (useState, useEffect, useRef)
- next/link (existing)

## Color Palette (matches existing)

- Background: #0a0a0f
- Primary: #6366f1 (indigo)
- Accents: green (#4ade80), amber (#fbbf24), purple (#a78bfa)
- Text: #e8e8f0

## Notes

- All text is in Hebrew (RTL)
- Animations respect prefers-reduced-motion
- Mobile-first responsive design
