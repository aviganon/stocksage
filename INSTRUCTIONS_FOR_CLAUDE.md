# StockSage — UI Redesign & Feature Update — Instructions for Claude

This package contains a complete visual redesign of the StockSage app (premium "glassmorphism / 2026" style),
plus two new backend features. Below is everything you need to integrate the changes into the repo.

> Repo: `aviganon/stocksage` · Branch the work was done on: `firebase-auth-error` · Framework: Next.js (App Router) + Firebase + Tailwind CSS v4

---

## 0. How to apply this package

You have two options:

**Option A — apply the git patch (recommended):**
```bash
git checkout -b ui-redesign-2026
git apply changes.patch        # included in this zip
```

**Option B — copy files manually:**
Copy every file from the `files/` folder in this zip to the same path in the repo (overwrite existing).
The folder structure mirrors the repo exactly.

After applying, run:
```bash
pnpm install      # no new deps were added, but run to be safe
pnpm dev
```

---

## 1. What changed — high level

| Area | Type | Files |
|------|------|-------|
| Global design system (glass utilities, ambient background, animations) | Changed | `app/globals.css`, `app/layout.tsx` |
| Landing page — full premium rebuild (10 sections) | Changed | `app/page.tsx` |
| Auth pages redesign | Changed | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` |
| Dashboard redesign + welcome hero + live "spotlight" stock cards | Changed | `app/dashboard/page.tsx` |
| Settings / admin redesign | Changed | `app/settings/page.tsx`, `app/admin/layout.tsx` |
| Report view + legal pages redesign | Changed | `app/report/[reportId]/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/refund/page.tsx`, `app/accessibility/page.tsx` |
| NEW: live market quotes endpoint | Added | `app/api/markets/spotlight/route.ts` |
| NEW: admin credits management endpoint | Added | `app/api/admin/users/[uid]/credits/route.ts` |
| FIX: Pro upgrade now grants credits | Changed | `app/api/admin/users/[uid]/plan/route.ts` |

---

## 2. Design system (`app/globals.css`)

A reusable glass design system was added. Use these classes everywhere instead of ad-hoc `bg-white/5 border`:

- `.glass` — frosted translucent surface (backdrop-blur + subtle border)
- `.glass-strong` — denser frosted surface, for modals / drawers
- `.glass-card` — glass surface with hover lift + glow (for clickable cards)
- `.glass-nav` — sticky frosted navigation bar
- `.glass-input` — frosted form input with focus ring
- `.btn-glow` — primary gradient button with glow
- `.glow-ring` — indigo glow ring for selected/active states
- `.text-gradient` — indigo→sky gradient text for headings
- `.ambient-bg` / `.ambient-grid` — full-screen ambient gradient + grid overlay (mounted once in `layout.tsx`)
- Animations: `animate-fade-up`, `float`, `pulse`, `shimmer`

**Important:** the ambient background lives globally in `app/layout.tsx`. All page roots had their opaque
`bg-[#0a0a0f]` backgrounds REMOVED so the ambient gradient shows through. Do not re-add opaque page backgrounds.

The root `<body>` background was changed from `#0a0a0f` to `#07070d`.

---

## 3. New feature: Live "Spotlight" stock cards (dashboard)

**Endpoint:** `app/api/markets/spotlight/route.ts`
- `GET /api/markets/spotlight` (auth required — `Authorization: Bearer <firebaseIdToken>`)
- Returns `{ quotes: SpotlightQuote[] }` with REAL live prices for a curated set of well-known tickers.
- Uses the EXISTING `getQuote()` from `lib/data/orchestrator.ts` (which already has 60s caching). No new data source added.
- Returns `price`, `change`, `changePercent`, `currency`, `marketState` per symbol.

**UI:** `app/dashboard/page.tsx` — added:
- A personalized welcome hero ("שלום [name], איזו מניה נחקור היום?") + a trust strip (8 exchanges, AI engine, real-time data, secure).
- A `SpotlightStocks` component rendering a responsive grid of glass cards. Clicking a card selects that asset and opens the research-depth picker. Cards hide once an asset is selected. Data is real — no mocked numbers.

> NOTE: prices are pulled live, so they only appear when the data source is reachable. If `getQuote` returns null for a symbol, the card shows `—` instead of fake data.

---

## 4. Fix + new feature: Credits / plan management (admin)

**Bug fixed:** Upgrading a user to "pro" previously only set the `plan` field and did NOT grant credits, so paying
users saw "no credits". `app/api/admin/users/[uid]/plan/route.ts` now calls `activateProCredits(uid)` when
plan === 'pro' (grants 30 standard + 10 deep), and `updateUserPlan` when downgrading to 'free'.

**New endpoint:** `app/api/admin/users/[uid]/credits/route.ts`
- `GET` — read a user's current credits
- `PATCH` with body `{ "standard": number, "deep": number }` — manually set credits (admin only, uses `verifyAdmin`)

Both rely on existing helpers in `lib/usage/tracker.ts` (`activateProCredits`, `updateUserPlan`). Verify those
exports exist before merging — they did at time of writing.

---

## 5. RTL logo fix

The app is RTL (Hebrew). The "StockSage" wordmark + "S" icon were rendering reversed ("Sage Stock").
Fixed by adding `dir="ltr"` to the logo `<Link>` in: login, signup, dashboard, settings.
Apply the same `dir="ltr"` pattern to any NEW logo instances you add.

---

## 6. Things to double-check after merging

1. `lib/usage/tracker.ts` exports `activateProCredits` and `updateUserPlan`.
2. `lib/data/orchestrator.ts` exports `getQuote`.
3. `lib/auth/server.ts` exports `verifyAuth` / `AuthError` (used by the spotlight route).
4. Firebase env vars are set (`NEXT_PUBLIC_FIREBASE_*`) — required for auth to work at all.
5. No new npm dependencies were introduced.

---

## 7. Suggested commit message

```
feat(ui): premium glassmorphism redesign across all pages

- Add reusable glass design system + global ambient background
- Rebuild landing, auth, dashboard, settings, admin, report & legal pages
- Add live "spotlight" market quote cards to dashboard (real data via getQuote)
- Add admin credits endpoint + fix Pro upgrade to grant credits
- Fix RTL-reversed logo wordmark
```
