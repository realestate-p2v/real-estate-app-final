# P2V Build Failure — Feature Impact Report

**Date:** April 6, 2026
**Status:** Vercel build blocked — `bun run build` exits with 1, no visible error output
**Environment:** Next.js 16 · Bun · Vercel · Node 24.x

---

## What Happened

The Vercel build started failing silently after a development session that added several new features (Tasks 5–8) and the Lensy chat system (Brain session). The build log shows only `"exited with 1"` with no TypeScript errors, no file paths, and no "Building" accordion in the Vercel UI.

The root cause is that `next.config.mjs` had `typescript: { ignoreBuildErrors: true }`, which suppressed all TypeScript output and pushed errors into the bundler phase — where failures produce no structured logs. This made it impossible to tell which file or feature was responsible.

Two specific bugs in the property website files were identified as the most likely bundler-crashing culprits: the use of `exports` (a JavaScript reserved word) as a JSX prop name, and the old Next.js 15 params pattern in a Next.js 16 project.

---

## Feature-by-Feature Breakdown

### 1. Property Website Pages — `app/p/[slug]/`

**Status before this session:** Working.
**What changed:** `page.tsx` and `client.tsx` were created or rewritten during the Tasks 5–8 session.
**What broke:**
- `page.tsx` used the old `params: { slug: string }` pattern instead of `params: Promise<{ slug: string }>` with `await`. This is a breaking change in Next.js 16 that causes a silent runtime/build failure.
- `page.tsx` passed a prop called `exports` to the client component. `exports` is a reserved word in JavaScript/CommonJS and can cause bundler crashes that produce zero error output — exactly the symptom we're seeing.

**Fix status:** Both files have been corrected. The fixed versions are uploaded and ready to deploy. `exports` has been renamed to `designExports` in both the server page and the client component props interface.

**Action:** Deploy the corrected files. No rebuild needed.

---

### 2. BookingCalendar — `components/booking-calendar.tsx`

**Status before this session:** Did not exist. Created new during Tasks 5–8.
**What broke:** `client.tsx` imports this as a named export (`{ BookingCalendar }`). If the file is missing from the repo, uses a default export instead of a named export, or has internal TypeScript errors, the entire build crashes.
**Risk level:** High — this is a likely secondary cause of the silent failure if the corrected property files alone don't fix the build.

**Action:** Verify the file exists in the repo and uses `export function BookingCalendar`. If missing or broken, rebuild from scratch. This component takes `propertyId`, `mode`, and `agentName` as props and renders a calendar for scheduling property showings.

---

### 3. ShowingRequestForm — `components/showing-request-form.tsx`

**Status before this session:** Did not exist. Created new during Tasks 5–8.
**What broke:** Same situation as BookingCalendar — imported as a named export in `client.tsx`. If missing or malformed, the build fails silently.
**Risk level:** High.

**Action:** Verify the file exists and exports correctly. If missing or broken, rebuild from scratch. This component takes `propertyId`, `propertyInfo` (address, bedrooms, bathrooms, price, status), `agentUserId`, `agentName`, and `source` as props. It renders an inquiry/contact form that posts to `app/api/showings/route.ts`.

---

### 4. Property Website Layout — `app/p/[slug]/layout.tsx`

**Status before this session:** Did not exist. Created new during Tasks 5–8.
**What broke:** Nothing — this file is simple (metadata + children wrapper) and compiles cleanly.

**Action:** No changes needed.

---

### 5. Property Merge API — `app/api/properties/merge/`

**Status before this session:** Did not exist. Created new during Tasks 5–8.
**What broke:** These are isolated API routes (`route.ts` and `undo/route.ts`). They may have TypeScript errors but they won't cause the silent bundler crash — TS errors in API routes produce normal, readable error output once `ignoreBuildErrors` is set to `false`.

**Action:** Fix any TypeScript errors that surface in the build log. No rebuild needed unless the logic is fundamentally wrong.

---

### 6. Bookings & Showings APIs — `app/api/bookings/` and `app/api/showings/`

**Status before this session:** Did not exist. Created new during Tasks 5–8.
**What broke:** These are the backend routes that BookingCalendar and ShowingRequestForm submit to. Same as above — isolated API routes that will produce readable errors once `ignoreBuildErrors` is off.

**Action:** If BookingCalendar and ShowingRequestForm need rebuilding, these routes should be rebuilt to match. Otherwise, fix TS errors from the build log.

---

### 7. Merge UI in Dashboard — `app/dashboard/properties/page.tsx`

**Status before this session:** Working.
**What changed:** Merge UI was added to the existing properties dashboard page.
**Risk level:** Low-medium. The page was working before; the additions may have introduced type mismatches.

**Action:** Fix any TS errors from the build log. The original page logic should be untouched.

---

### 8. Curated Selector in Property Detail — `app/dashboard/properties/[id]/page.tsx`

**Status before this session:** Working.
**What changed:** Curated content selector was added. This file also uses dynamic route params and must use the `Promise<>` + `await` pattern.
**Risk level:** Medium — both the new code and the params pattern could be wrong.

**Action:** Verify params pattern. Fix TS errors from the build log.

---

### 9. Lensy Chat System — `components/lensy/`, `lib/lensy/`, `app/api/lensy/`

**Status before this session:** Did not exist. Entire system created during the Brain session.
**Files involved:**
- `components/lensy/lensy-chat-base.tsx`
- `components/lensy/lensy-sales.tsx`
- `components/lensy/lensy-support.tsx`
- `components/lensy/lensy-agent.tsx`
- `components/lensy/lensy-smart.tsx`
- `lib/lensy/build-context.ts`
- `app/api/lensy/route.ts`

**What broke:** Multiple potential issues:
- `lensy-smart.tsx` imports `createBrowserClient` from `@supabase/ssr` — if this package isn't in `package.json`, the build fails immediately.
- `build-context.ts` calls `supabase.auth.admin.getUserById()` — if the installed Supabase client version doesn't have this method, it fails.
- `app/layout.tsx` was modified to import and render `<LensySmart />` — if the import path doesn't match, the root layout breaks and nothing builds.

**Risk level:** High — this is a large surface area of brand-new code injected into the root layout. If any file has an import error, the entire application fails to build.

**Action:** First, verify `@supabase/ssr` is in `package.json`. If the Lensy system is badly broken, the fastest unblock is to remove the `<LensySmart />` import from `app/layout.tsx`, deploy without it, and rebuild the Lensy system properly in a separate session.

---

### 10. Dynamic Route Params Across the Codebase

**Status before this session:** Some may have been working with the old pattern; Next.js 16 made the `Promise<>` pattern mandatory.
**Files to check:**
- `app/a/[slug]/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/video/[orderId]/page.tsx`
- `app/dashboard/video/[orderId]/revise/page.tsx`
- `app/api/orders/[orderId]/route.ts`
- `app/api/blog/[slug]/route.ts`
- `app/api/blog/[slug]/view/route.ts`
- `app/api/admin/blog/[id]/route.ts`

**Action:** These will produce clear TypeScript errors once `ignoreBuildErrors` is `false`. Fix each one with the pattern: `params: Promise<{ key: string }>` then `const { key } = await params`.

---

## Summary Table

| Feature | Pre-Session Status | Broke? | Cause | Action |
|---|---|---|---|---|
| Property Website pages | Working | Yes | Reserved word `exports` as prop + old params pattern | Deploy corrected files |
| BookingCalendar | New | Likely | May be missing or have wrong export type | Verify or rebuild |
| ShowingRequestForm | New | Likely | May be missing or have wrong export type | Verify or rebuild |
| Property Website layout | New | No | File is clean | None |
| Property Merge API | New | Maybe | Possible TS errors, won't crash silently | Fix from build log |
| Bookings/Showings API | New | Maybe | Depends on component status | Fix or rebuild with components |
| Dashboard merge UI | Working | Maybe | New code added to working page | Fix from build log |
| Dashboard curated selector | Working | Maybe | New code + params pattern | Fix from build log |
| Lensy chat system | New | Likely | Missing dependency, import errors, root layout modified | Verify deps or strip from layout |
| Dynamic route params | Working | Yes | Next.js 16 breaking change | Fix each file |

---

## Recommended Deploy Sequence

1. Push corrected `page.tsx` and `client.tsx` with `ignoreBuildErrors: true` temporarily to confirm the reserved-word bug was the bundler crash.
2. If the build passes, flip `ignoreBuildErrors` to `false`.
3. Read the TypeScript errors that appear in Vercel build logs.
4. Fix errors by priority: root layout (Lensy import) first, then property components, then API routes, then params patterns.
5. If Lensy is too broken, remove `<LensySmart />` from `app/layout.tsx` to unblock everything else.
6. Deploy clean with `ignoreBuildErrors: false`.
