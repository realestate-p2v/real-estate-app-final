# P2V WEBSITE BUILDER — Full Build Document
**Date:** April 6, 2026
**Owner:** Matt Ymbras
**Site:** realestatephoto2video.com
**Prerequisite Sessions:** Tasks 1–8 (Data Hub Phase 2) must be complete before starting

---

## SESSION RULES

### How We Work
- Matt edits files directly in GitHub web interface (no local clone)
- Every GitHub edit auto-deploys to production via Vercel
- Server commands run by Matt via SSH to `134.209.39.83`
- Pipeline files at `/root/p2v/`
- Always ask to see current file before editing — never guess
- Write complete files, not partial patches
- Do things the best way, not the fast way — quality over speed

### Rules
1. **One task at a time.** Complete fully before moving on.
2. **Verify before declaring done.** Provide specific test after every change.
3. **Pipeline changes are high-risk.** Backup first, show diff, verify with grep, restart and check status.
4. **Every edit is a production deploy.** Treat accordingly.
5. **Respect the user's time.** Don't suggest stopping. Don't repeat confirmed info.
6. **Notifications must have rate limits.** Max 1/hour/issue with actionable link.
7. **Track all files changed.** Don't confuse discussed vs deployed.
8. **Errors are emergencies.** Fix production issues immediately.
9. **End-of-session report** in exact format: Completed, Files Changed, Server Changes, Supabase Changes, Known Issues, Next Session Should.

### Design Tokens (Tailwind)
- Cards: `bg-card rounded-2xl border border-border p-6`
- CTA button: `bg-accent hover:bg-accent/90 text-accent-foreground font-black`
- Green CTA: `bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full`
- Lens accent: cyan (`bg-cyan-50`, `border-cyan-200`, `text-cyan-600`)
- Coming Soon badge: `bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full`
- NEW badge: `bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full`
- Subscribed badge: `bg-cyan-100 text-cyan-700 text-xs font-bold px-2 py-0.5 rounded-full`
- Live badge: `text-green-600 bg-green-100 text-[10px] font-semibold px-2 py-0.5 rounded-full`
- Hover cards: `hover:border-accent/40 hover:shadow-lg transition-all duration-300`
- Icons: `lucide-react`
- UI: `@/components/ui/button`, `/input`, `/textarea`, `/checkbox`, `/switch`, `/label` (shadcn/ui)
- Admin pattern: `const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];`

---

## TECH STACK

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Pipeline Server | DigitalOcean droplet at 134.209.39.83 |
| Video Generation | Minimax Hailuo AI |
| AI | Claude API (Anthropic) |
| Media | Cloudinary (images + video hosting) |
| Payments | Stripe |
| Deployment | Vercel (frontend + domain management) |
| Email | SendGrid |
| Domain Registration | TBD — see Task 10 notes |

---

## PRODUCT OVERVIEW

### What Is This?
A website builder for real estate agents. Agents can create two types of websites:

1. **Property Site** — A single-listing page showcasing one property with photos, videos, virtual staging, descriptions, booking calendar, lead capture, and Lensy chat. Built from the curated assets in their Property Portfolio.

2. **Agent Site** — A full portfolio website with multiple pages: property listings, agent bio, about, contact, neighborhood tools (walk score, value estimator, value boost), and custom pages.

### Pricing Model

| Tier | What They Get | Price |
|------|--------------|-------|
| No subscription | Redirect to Lens pricing page | — |
| Lens Pro subscriber | 1 website included (any type) | Included with Pro |
| Additional websites | Each extra site | $29.95/mo add-on to existing Stripe subscription |
| Buy outright | Own the site permanently, includes 1 year of Lens Pro for updates | $399 one-time |

### Domain Model

Each website gets one domain:
- **Free subdomain:** `[slug].realestatephoto2video.com` (or `/p/[slug]` / `/a/[slug]` paths — TBD based on Vercel setup)
- **Custom domain:** Agent purchases via integrated registrar API, connected to Vercel. Additional cost (pricing TBD — market rate + margin).

---

## DATABASE SCHEMA

### New Table: `websites`
This is the central table for the website builder. One row per website.

```sql
CREATE TABLE websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Site identity
  name TEXT NOT NULL,                          -- Display name ("My Austin Portfolio", "123 Main St")
  site_type TEXT NOT NULL CHECK (site_type IN ('property', 'agent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),

  -- Domain
  slug TEXT UNIQUE,                            -- Subdomain/path slug
  custom_domain TEXT UNIQUE,                   -- e.g. "janesmithrealty.com" (null = using slug)
  domain_status TEXT DEFAULT 'none' CHECK (domain_status IN ('none', 'pending_dns', 'active', 'failed')),
  domain_provider_id TEXT,                     -- Domain registrar order/reference ID
  vercel_domain_id TEXT,                       -- Vercel domain configuration ID

  -- Design
  template TEXT NOT NULL DEFAULT 'modern_clean',  -- modern_clean | luxury_dark | classic_light
  theme_overrides JSONB DEFAULT '{}',          -- Custom colors, fonts, logo, etc.
  favicon_url TEXT,
  og_image_url TEXT,                           -- Open Graph / social sharing image

  -- Content (for agent sites)
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_image_url TEXT,
  hero_video_url TEXT,
  about_content TEXT,                          -- Rich text / markdown
  agent_bio TEXT,
  pages JSONB DEFAULT '[]',                    -- Custom pages: [{ slug, title, content, order }]

  -- Modules enabled (which sections appear)
  modules JSONB DEFAULT '{
    "photos": true,
    "videos": true,
    "description": true,
    "staging": true,
    "exports": true,
    "booking": false,
    "lead_capture": true,
    "lensy": false,
    "neighborhood": false,
    "walk_score": false,
    "value_estimator": false,
    "value_boost": false,
    "contact": true,
    "properties": true
  }',

  -- Curated content (for property sites — which specific assets to show)
  curated_assets JSONB DEFAULT '{}',           -- { photos: ["url1"], videos: ["url1"], descriptions: ["id1"], staging: ["id1"], exports: ["id1"] }

  -- Linked property (for property sites)
  property_id UUID REFERENCES agent_properties(id),

  -- Billing
  billing_type TEXT NOT NULL DEFAULT 'included' CHECK (billing_type IN ('included', 'addon', 'owned')),
  stripe_subscription_item_id TEXT,            -- Stripe subscription item for $29.95 add-on
  owned_at TIMESTAMPTZ,                        -- When the site was purchased outright
  owned_expires_pro_at TIMESTAMPTZ,            -- When the included year of Pro expires

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  structured_data JSONB,                       -- JSON-LD for property or local business

  -- Analytics
  view_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_slug ON websites(slug);
CREATE INDEX idx_websites_custom_domain ON websites(custom_domain);
CREATE INDEX idx_websites_property_id ON websites(property_id);
CREATE INDEX idx_websites_status ON websites(status);

-- RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own websites
CREATE POLICY "Users can manage own websites"
  ON websites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can view published websites
CREATE POLICY "Public can view published websites"
  ON websites FOR SELECT
  USING (status = 'published');
```

### New Table: `website_domains`
Tracks domain registration and DNS status history.

```sql
CREATE TABLE website_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  domain TEXT NOT NULL,
  registrar TEXT,                               -- "namecheap", "cloudflare", etc.
  registrar_order_id TEXT,
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'registered', 'failed', 'expired', 'transferred')),
  dns_status TEXT DEFAULT 'pending' CHECK (dns_status IN ('pending', 'propagating', 'active', 'failed')),
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  vercel_config JSONB,                         -- Vercel domain API response

  -- Billing
  registration_cost_cents INTEGER,
  renewal_cost_cents INTEGER,
  stripe_payment_intent_id TEXT,
  registered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE website_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own domains"
  ON website_domains FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### New Table: `website_analytics`
Page view and lead tracking per website.

```sql
CREATE TABLE website_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'lead_submitted', 'booking_made', 'chat_started', 'cta_clicked')),
  page_path TEXT,
  visitor_ip TEXT,
  visitor_user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_website_analytics_website_id ON website_analytics(website_id);
CREATE INDEX idx_website_analytics_created_at ON website_analytics(created_at);

-- RLS: website owner can read, public can insert (for tracking)
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own website analytics"
  ON website_analytics FOR SELECT
  USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

CREATE POLICY "Public can insert analytics"
  ON website_analytics FOR INSERT
  WITH CHECK (true);
```

### Modified Table: `lens_usage`
Add columns for website entitlements.

```sql
ALTER TABLE lens_usage
  ADD COLUMN IF NOT EXISTS included_website_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_addon_sites INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owned_sites INTEGER DEFAULT 0;
```

### Existing Tables Used (no changes needed)
- `agent_properties` — already has `website_published`, `website_slug`, `website_template`, `website_modules`, `website_curated` from Task 6
- `booking_slots` — used by booking calendar module
- `showing_requests` — used by lead capture module
- `lens_staging` — curated staging images
- `design_exports` — curated marketing materials
- `lens_descriptions` — curated descriptions
- `orders` — photos and videos
- `lens_sessions` — coach photos

---

## WHAT'S ALREADY BUILT (from Tasks 1–8)

| Component | Status | Relevant to Website Builder |
|-----------|--------|---------------------------|
| Property Portfolio | ✅ Done | Data source for property sites |
| Curated Media Selector | ✅ Done | Task 6 — template, modules, curated assets saved on `agent_properties` |
| Booking Calendar | ✅ Done | Task 7 — `<BookingCalendar>` component |
| Showing Request Form | ✅ Done | Task 7 — `<ShowingRequestForm>` component |
| Property Website Route | ✅ Done | Task 8 — `/p/[slug]` public route |
| Lensy Chat Components | ✅ Done | Tasks 3-4 — all 5 chat components |
| Stripe Integration | ✅ Done | Existing checkout + subscription management |

---

## TASKS

### TASK 9 — Database Migration + Subscription Gating

**Goal:** Create the new tables and add subscription checks everywhere a non-Pro user tries to access the website builder.

**New files:**
1. `supabase/migrations/[timestamp]_website_builder.sql` — All new tables + RLS + indexes
2. `components/upgrade-modal.tsx` — Reusable inline upgrade modal

**Migration:** Run the SQL from the schema section above.

**Upgrade Modal component:**
- Props: `isOpen`, `onClose`, `currentTier` ("none" | "pro")
- If `currentTier === "none"`:
  - Show both Lens and Lens Pro pricing side by side
  - CTA buttons link to `/lens` pricing page (or trigger Stripe checkout)
- If `currentTier === "pro"` (but trying to add more sites):
  - Show the $29.95/mo add-on pricing
  - Show the $399 buy-outright option
  - CTA buttons trigger the appropriate Stripe flow
- Design: centered modal, blurred backdrop, card with pricing info, close button

**Gating logic (add to existing pages):**
- `app/dashboard/properties/[id]/page.tsx` — The "Publish to Website" section (Task 6) should check `isSubscriber` before showing. If not subscribed, show upgrade modal.
- `app/dashboard/websites/page.tsx` (Task 10) — The entire page is gated. Non-Pro users see the upgrade modal immediately.

**Upload for build chat:** `components/upgrade-modal.tsx` doesn't exist yet — write from scratch. Also need current `app/dashboard/properties/[id]/page.tsx` for the gating change.

---

### TASK 10 — Website Mission Control

**Goal:** Build `/dashboard/websites` — the hub where agents see all their websites, create new ones, and manage existing ones.

**New files:**
1. `app/dashboard/websites/page.tsx` — Mission control page
2. `app/dashboard/websites/layout.tsx` — Layout with nav context

**Page layout:**

**Header:**
- Title: "My Websites"
- Subtitle: "Create and manage your property and portfolio websites"
- "Create Website" CTA button (accent color)
- Site count indicator: "1 of 1 included" or "3 sites (1 included + 2 add-ons)"

**Site cards grid:**
Each website gets a card showing:
- Thumbnail preview (screenshot or template preview)
- Site name
- Site type badge: "Property Site" or "Agent Site"
- Status badge: Draft (gray), Live (green), Suspended (red)
- Domain: slug or custom domain displayed
- Stats: views, leads (from `website_analytics`)
- Last updated timestamp
- Quick actions: Edit, View Live, Settings, Delete

**Empty state (no sites yet):**
- Illustration + "Create your first website"
- Two large cards: "Property Website" and "Agent Portfolio"
- Each card describes what it is and has a "Get Started" button

**If user has used their included site:**
- Show a banner: "You've used your included website. Additional sites are $29.95/mo each, or own one outright for $399."
- "Create Website" button should trigger the add-on purchase flow before proceeding to the wizard.

**Upload for build chat:** This is a new file — write from scratch.

---

### TASK 11 — Website Builder Wizard

**Goal:** Build the step-by-step wizard for creating a new website.

**New files:**
1. `app/dashboard/websites/new/page.tsx` — Wizard page
2. `app/api/websites/route.ts` — CRUD API for websites

**Wizard steps:**

**Step 1 — Site Type**
- Two large selectable cards:
  - **Property Website** — "Showcase a single listing with photos, videos, staging, and lead capture"
  - **Agent Portfolio** — "Build your brand with a multi-page website featuring all your listings and tools"
- If Property: show dropdown to pick from their existing properties (from `agent_properties`)
- If Agent: proceed to Step 2

**Step 2 — Template**
- Three template cards (same as Task 6): Modern Clean, Luxury Dark, Classic Light
- Live preview thumbnail for each
- Select one

**Step 3 — Content Setup**
- **Property Site:**
  - Auto-populated from the property's existing curated assets (from Task 6 `website_curated`)
  - Module toggles (same as Task 6 but reading from/writing to `websites.modules`)
  - Per-asset curation (same UI as Task 6)
  - If no curated assets exist yet, prompt them to go to the property detail page first

- **Agent Site:**
  - Hero section: headline, subheadline, hero image upload (Cloudinary)
  - About content: rich text area
  - Agent bio: text area
  - Module toggles for tools: Neighborhood, Walk Score, Value Estimator, Value Boost, Contact, Properties
  - Select which properties to feature (checkboxes from their property list)

**Step 4 — Domain**
- **Subdomain (free):**
  - Auto-generated slug from site name
  - Editable text field
  - Preview: `realestatephoto2video.com/p/[slug]` or `/a/[slug]`

- **Custom Domain (paid):**
  - "Get a custom domain" section
  - Domain search input
  - Check availability via registrar API
  - Show pricing (registration + annual renewal)
  - Purchase flow (Stripe one-time charge)
  - DNS instructions (auto-configured via Vercel API if possible)
  - Status indicator: Pending DNS → Propagating → Active

**Step 5 — Review & Launch**
- Summary of all choices
- Preview button (opens in new tab)
- "Publish" button → sets status to 'published'
- "Save as Draft" button → saves but doesn't publish

**Website API:**
```
GET /api/websites — list user's websites
POST /api/websites — create new website
PATCH /api/websites/[id] — update website
DELETE /api/websites/[id] — delete website (with confirmation)
```

---

### TASK 12 — Website Editor / Settings

**Goal:** After a site is created, agents need a way to edit content, change settings, manage domain, and view analytics.

**New files:**
1. `app/dashboard/websites/[id]/page.tsx` — Website editor/settings page
2. `app/dashboard/websites/[id]/analytics/page.tsx` — Analytics dashboard

**Editor page tabs:**

**Tab 1 — Content**
- Same UI as wizard Step 3, but editable
- For property sites: curated asset selector
- For agent sites: hero, about, bio, pages, featured properties
- Custom pages manager: add/edit/remove/reorder pages
- Save button

**Tab 2 — Design**
- Template switcher
- Theme overrides: primary color, accent color, font family
- Logo upload
- Favicon upload
- OG image upload
- Live preview panel (iframe or thumbnail)

**Tab 3 — Domain**
- Current domain display
- Change subdomain slug
- Custom domain management:
  - If no custom domain: "Add Custom Domain" flow
  - If has custom domain: DNS status, SSL status, renewal date
  - Remove custom domain option

**Tab 4 — SEO**
- Meta title (auto-generated, editable)
- Meta description (auto-generated, editable)
- OG image preview
- Structured data preview (JSON-LD)

**Tab 5 — Settings**
- Publish/Unpublish toggle
- Delete website (with "type website name to confirm" pattern)
- Billing info: included site vs. add-on vs. owned
- Transfer ownership (future)

**Analytics page:**
- Date range picker
- Metrics cards: Total Views, Unique Visitors, Leads Generated, Bookings Made
- Chart: views over time (recharts)
- Lead list: name, email, phone, date, source
- Referrer breakdown
- Top pages (for agent sites)

---

### TASK 13 — Agent Portfolio Public Route

**Goal:** Build the public-facing agent portfolio website. This is the agent's brand site with multiple pages.

**New files:**
1. `app/a/[slug]/page.tsx` — Agent site homepage (SSR, public)
2. `app/a/[slug]/layout.tsx` — Agent site layout (custom nav, no main P2V chrome)
3. `app/a/[slug]/properties/page.tsx` — All properties listing
4. `app/a/[slug]/properties/[propertySlug]/page.tsx` — Individual property within agent site
5. `app/a/[slug]/about/page.tsx` — About page
6. `app/a/[slug]/contact/page.tsx` — Contact page
7. `app/a/[slug]/[pageSlug]/page.tsx` — Custom pages (dynamic)
8. `components/agent-site/agent-site-nav.tsx` — Agent site navigation
9. `components/agent-site/agent-site-footer.tsx` — Agent site footer
10. `components/agent-site/property-card.tsx` — Property card for grid
11. `components/agent-site/neighborhood-tools.tsx` — Walk score, value estimator wrapper

**Agent site layout:**
- No P2V navigation or footer
- Custom nav with agent logo, site name, page links
- Template-driven styling (modern_clean / luxury_dark / classic_light)
- Mobile responsive hamburger menu
- "Powered by P2V" small badge in footer

**Homepage sections:**
1. **Hero** — Full-width image/video with headline, subheadline, CTA
2. **Featured Properties** — Grid of property cards (links to individual property pages within the agent site)
3. **About / Bio** — Agent info with headshot
4. **Tools** — Neighborhood value, walk score, value estimator, value boost (based on enabled modules)
5. **Contact** — Contact form + agent info
6. **Lensy Chat** — `<LensyAgent>` embedded (if enabled)

**Individual property page within agent site:**
- Same layout as Task 8's `/p/[slug]` but wrapped in agent site chrome
- Uses the property's curated assets
- Inherits agent site template

**Data fetching:**
```typescript
// Fetch website by slug
const { data: website } = await supabase
  .from("websites")
  .select("*")
  .eq("slug", slug)
  .eq("site_type", "agent")
  .eq("status", "published")
  .single();

// Fetch agent info from lens_usage
const { data: agent } = await supabase
  .from("lens_usage")
  .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_logo_url, saved_headshot_url")
  .eq("user_id", website.user_id)
  .single();

// Fetch published properties
const { data: properties } = await supabase
  .from("agent_properties")
  .select("*")
  .eq("user_id", website.user_id)
  .eq("website_published", true)
  .is("merged_into_id", null)
  .order("updated_at", { ascending: false });
```

**SEO (same pattern as Task 8):**
- Dynamic `<title>`: "[Agent Name] | Real Estate"
- Meta description from about/bio
- Open Graph image from hero
- JSON-LD: RealEstateAgent + LocalBusiness

**Template styles:** Same three templates as Task 8, applied consistently.

---

### TASK 14 — Stripe Add-on + Buy Outright Billing

**Goal:** Implement the billing flows for additional websites and the buy-outright option.

**New files:**
1. `app/api/websites/billing/addon/route.ts` — Create Stripe subscription item for $29.95/mo add-on
2. `app/api/websites/billing/purchase/route.ts` — $399 one-time purchase flow
3. `app/api/webhooks/website-billing/route.ts` — Stripe webhook handler for website billing events

**Add-on flow ($29.95/mo):**
1. User clicks "Create Website" when they've used their included site
2. Frontend calls `POST /api/websites/billing/addon`
3. API adds a new subscription item to their existing Stripe subscription:
   ```typescript
   // Using Stripe's subscription item API to add metered/quantity billing
   const subscriptionItem = await stripe.subscriptionItems.create({
     subscription: existingSubscriptionId,
     price: process.env.STRIPE_ADDON_SITE_PRICE_ID, // $29.95/mo
     quantity: 1,
   });
   ```
4. On success, create the website record with `billing_type = 'addon'`
5. Store `stripe_subscription_item_id` on the website record

**Buy outright flow ($399):**
1. User clicks "Own This Site — $399"
2. Frontend calls `POST /api/websites/billing/purchase`
3. API creates a Stripe Checkout session for one-time payment
4. On success webhook:
   - Set `billing_type = 'owned'`
   - Set `owned_at = now()`
   - Set `owned_expires_pro_at = now() + 1 year`
   - If user doesn't have Lens Pro, activate it for 1 year
   - Remove the add-on subscription item if it was previously an add-on

**Webhook handling:**
- `invoice.paid` — Confirm add-on renewal
- `invoice.payment_failed` — Flag site, send warning email
- `customer.subscription.updated` — Handle cancellations (set site to 'suspended' after grace period)
- `checkout.session.completed` — Handle buy-outright completion

**Environment variables needed:**
```
STRIPE_ADDON_SITE_PRICE_ID=price_xxx       # $29.95/mo recurring
STRIPE_SITE_PURCHASE_PRICE_ID=price_xxx    # $399 one-time
```

---

### TASK 15 — Custom Domain Integration

**Goal:** Let agents purchase and connect custom domains to their websites.

**New files:**
1. `app/api/websites/domains/search/route.ts` — Domain availability search
2. `app/api/websites/domains/purchase/route.ts` — Purchase domain
3. `app/api/websites/domains/verify/route.ts` — Check DNS propagation
4. `app/api/websites/domains/connect/route.ts` — Connect domain to Vercel
5. `lib/domains/registrar.ts` — Domain registrar API wrapper
6. `lib/domains/vercel.ts` — Vercel domain API wrapper

**Domain search flow:**
1. Agent types desired domain in wizard or settings
2. API checks availability via registrar API
3. Show available options with pricing (.com, .io, .realestate, etc.)
4. Agent selects and pays (Stripe one-time charge)

**Domain purchase flow:**
1. Charge via Stripe
2. Register domain via registrar API
3. Auto-configure DNS records to point to Vercel
4. Add domain to Vercel project via Vercel API
5. Vercel auto-provisions SSL
6. Poll for DNS propagation
7. Update `website_domains` status through: pending → registered → propagating → active

**Vercel Domain API integration:**
```typescript
// lib/domains/vercel.ts
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

export async function addDomainToVercel(domain: string) {
  const res = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });
  return res.json();
}

export async function removeDomainFromVercel(domain: string) {
  const res = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  return res.json();
}

export async function checkDomainConfig(domain: string) {
  const res = await fetch(`https://api.vercel.com/v6/domains/${domain}/config`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  return res.json();
}
```

**Domain registrar options to evaluate:**
- **Namecheap API** — Well-documented, reasonable pricing, reseller program
- **Cloudflare Registrar** — At-cost pricing, great DNS, API available
- **Google Domains API** (now Squarespace) — Uncertain future
- **Recommendation:** Start with Cloudflare for at-cost domains + excellent DNS. Add Namecheap as fallback.

**Middleware for custom domains:**
Need to add middleware that checks incoming requests for custom domains and routes them to the correct website:

```typescript
// middleware.ts addition
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  
  // Skip our own domain
  if (hostname.includes("realestatephoto2video.com") || hostname.includes("vercel.app") || hostname.includes("localhost")) {
    return NextResponse.next();
  }
  
  // Custom domain — rewrite to the domain resolver route
  return NextResponse.rewrite(new URL(`/sites/${hostname}${request.nextUrl.pathname}`, request.url));
}
```

**New route for custom domain resolution:**
- `app/sites/[domain]/[...path]/page.tsx` — Looks up website by custom_domain, renders the appropriate site type

**Environment variables needed:**
```
VERCEL_API_TOKEN=xxx
VERCEL_PROJECT_ID=xxx
DOMAIN_REGISTRAR_API_KEY=xxx
DOMAIN_REGISTRAR_API_SECRET=xxx
```

---

### TASK 16 — Property Site Refactor (Unify with Website Builder)

**Goal:** Refactor the Task 8 property site (`/p/[slug]`) to read from the `websites` table instead of directly from `agent_properties`. This unifies property sites under the website builder.

**Modified files:**
1. `app/p/[slug]/page.tsx` — Update data fetching to check `websites` table first, fall back to `agent_properties` for backward compatibility
2. `app/dashboard/properties/[id]/page.tsx` — Update the "Publish to Website" section to create/update a `websites` record instead of just saving to `agent_properties`

**Migration path:**
- Existing property sites (created via Task 6/8 before the website builder) should still work
- When an agent visits their property detail page and uses the Publish section, it should now create a `websites` record
- The `/p/[slug]` route checks `websites` first, then falls back to `agent_properties.website_slug`

---

### TASK 17 — Analytics Tracking + Dashboard Polish

**Goal:** Wire up analytics tracking on public sites and build the analytics dashboard.

**New files:**
1. `components/website-analytics-tracker.tsx` — Client component that fires page_view events
2. `app/api/websites/analytics/route.ts` — API for recording and querying analytics

**Tracking implementation:**
- Add `<WebsiteAnalyticsTracker websiteId={id} />` to both property site and agent site layouts
- On mount: POST to `/api/websites/analytics` with event_type, page_path, referrer, user_agent
- Rate limit: max 1 page_view per visitor per page per 5 minutes (based on IP hash)
- Track: page views, lead submissions, booking requests, chat starts, CTA clicks

**Analytics API:**
```
POST /api/websites/analytics — record event (public, rate-limited)
GET /api/websites/analytics?websiteId=xxx&from=date&to=date — query analytics (auth required)
```

**Dashboard (in Task 12's analytics tab):**
- Use recharts for charts
- Date range picker: 7d, 30d, 90d, custom
- Cards: Total Views, Unique Visitors, Leads, Bookings
- Line chart: views over time
- Table: recent leads with name, email, date, source page
- Referrer pie chart

---

## TASK ORDER + DEPENDENCIES

```
TASK 9: DB Migration + Subscription Gating
  ├── New: supabase migration SQL
  ├── New: components/upgrade-modal.tsx
  └── Modified: app/dashboard/properties/[id]/page.tsx (add gate)

TASK 10: Website Mission Control
  ├── New: app/dashboard/websites/page.tsx
  └── New: app/dashboard/websites/layout.tsx

TASK 11: Website Builder Wizard
  ├── New: app/dashboard/websites/new/page.tsx
  ├── New: app/api/websites/route.ts
  └── Uses: components/upgrade-modal.tsx (from Task 9)

TASK 12: Website Editor / Settings
  ├── New: app/dashboard/websites/[id]/page.tsx
  └── New: app/dashboard/websites/[id]/analytics/page.tsx

TASK 13: Agent Portfolio Public Route
  ├── New: app/a/[slug]/ (layout + page + sub-pages)
  ├── New: components/agent-site/ (nav, footer, cards, tools)
  └── Uses: components/booking-calendar.tsx (from Task 7)
  └── Uses: components/showing-request-form.tsx (from Task 7)
  └── Uses: components/lensy/lensy-agent.tsx (already built)

TASK 14: Stripe Billing Integration
  ├── New: app/api/websites/billing/ (addon + purchase routes)
  ├── New: app/api/webhooks/website-billing/route.ts
  └── Depends on: Task 11 (wizard creates website records)

TASK 15: Custom Domain Integration
  ├── New: app/api/websites/domains/ (search, purchase, verify, connect)
  ├── New: lib/domains/ (registrar.ts, vercel.ts)
  ├── Modified: middleware.ts (custom domain routing)
  └── Depends on: Task 12 (domain settings UI)

TASK 16: Property Site Refactor
  ├── Modified: app/p/[slug]/page.tsx
  ├── Modified: app/dashboard/properties/[id]/page.tsx
  └── Depends on: Task 11 (websites table populated)

TASK 17: Analytics Tracking
  ├── New: components/website-analytics-tracker.tsx
  ├── New: app/api/websites/analytics/route.ts
  └── Depends on: Task 12 (analytics dashboard), Task 13 (agent sites)
```

**Critical path:** 9 → 10 → 11 → 12 → 13 → 17
**Parallel tracks:** Task 14 (billing) can start after 11. Task 15 (domains) can start after 12.
**Task 16 should run after 11** to unify data model.

---

## FILES THE BUILD CHAT NEEDS UPLOADED (per task)

### Task 9
1. `app/dashboard/properties/[id]/page.tsx` — For adding subscription gate
2. `lib/supabase/admin.ts` — For migration helper

### Task 10
1. `components/navigation.tsx` — For nav context
2. `app/dashboard/page.tsx` — For dashboard layout reference

### Task 11
1. `app/dashboard/properties/[id]/page.tsx` — For curated selector reference (reuse pattern)
2. `lib/stripe.ts` — For billing integration reference

### Task 12
1. Whatever was built in Task 11 (wizard page, API route)

### Task 13
1. `app/p/[slug]/page.tsx` — Property site for reference (reuse patterns)
2. `app/p/[slug]/layout.tsx`
3. All `components/lensy/` files
4. `components/booking-calendar.tsx`
5. `components/showing-request-form.tsx`

### Task 14
1. `lib/stripe.ts`
2. `app/api/webhooks/` — Existing webhook patterns

### Task 15
1. `middleware.ts` — Current middleware
2. `vercel.json` — Current Vercel config

---

## ENVIRONMENT VARIABLES NEEDED

```bash
# Existing (already configured)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
SENDGRID_API_KEY=xxx
CLOUDINARY_CLOUD_NAME=xxx

# New — to be added
STRIPE_ADDON_SITE_PRICE_ID=price_xxx          # $29.95/mo recurring price
STRIPE_SITE_PURCHASE_PRICE_ID=price_xxx        # $399 one-time price
VERCEL_API_TOKEN=xxx                           # For domain management
VERCEL_PROJECT_ID=xxx                          # P2V Vercel project
DOMAIN_REGISTRAR_API_KEY=xxx                   # Cloudflare or Namecheap
DOMAIN_REGISTRAR_API_SECRET=xxx                # If applicable
```

---

## NOTES FOR THE BUILD CHAT

### Relationship Between Task 6 (Curated Selector) and Website Builder
Task 6 saves template, modules, and curated assets directly on `agent_properties`. The website builder (Task 16) will migrate this to the `websites` table. During the transition period, both systems should work:
- `/p/[slug]` checks `websites` first, then falls back to `agent_properties`
- The property detail page's Publish section should create/update a `websites` record

### Template System
All three templates (modern_clean, luxury_dark, classic_light) must be consistent across:
- Property sites (`/p/[slug]`)
- Agent sites (`/a/[slug]`)
- Template picker UI (wizard + editor)

### Multi-page Agent Sites
Agent sites use a flexible page system. Built-in pages (home, properties, about, contact) have dedicated routes. Custom pages use the `[pageSlug]` catch-all. The `pages` JSONB column stores custom page definitions.

### Domain Architecture Decision
Two approaches for serving sites:
1. **Path-based:** `realestatephoto2video.com/p/[slug]` and `/a/[slug]` — simpler, no DNS
2. **Subdomain-based:** `[slug].realestatephoto2video.com` — requires wildcard DNS + Vercel config

**Recommendation:** Use path-based for free tier, custom domains for paid. Subdomains add complexity without clear user value over paths.
