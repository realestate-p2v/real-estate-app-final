// app/site/[handle]/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared data layer for agent site pages.
//
// Mirrors the PROVEN data flow from the Design Studio (page__44_.tsx):
//   1. lens_usage  → agent profile (headshot, logo, name, phone, etc.)
//   2. agent_properties → listings (address, beds, baths, price, etc.)
//   3. orders.photos   → real photos (secure_url), matched by address
//   4. agent_websites  → site config (colors, template, SEO)
//
// URLs from Supabase are used AS-IS. No cloudinaryUrl() transforms.
// The Design Studio renders them raw and they work. So do we.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentSite {
  id: string;
  user_id: string;
  handle: string;
  site_title: string | null;
  template: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  meta_title: string | null;
  meta_description: string | null;
  custom_domain: string | null;
}

export interface AgentProfile {
  headshot_url: string | null;
  logo_url: string | null;
  agent_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  website: string | null;
  company_colors: string[];
}

export interface Listing {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  price: number | null;
  special_features: string[] | null;
  amenities: string[] | null;
  website_slug: string | null;
  website_published: boolean | null;
  website_curated: { photos?: string[] } | null;
  photos: string[]; // enriched from orders — ready to render
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
}

// ─── Core: Resolve handle → site + user_id ──────────────────────────────────

export async function getSite(handle: string): Promise<AgentSite | null> {
  const { data, error } = await supabase
    .from("agent_websites")
    .select("id, user_id, handle, site_title, template, primary_color, secondary_color, accent_color, meta_title, meta_description, custom_domain")
    .eq("handle", handle)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as AgentSite;
}

// ─── Profile: from lens_usage (same fields as Design Studio line 601) ───────

export async function getProfile(userId: string): Promise<AgentProfile> {
  const { data } = await supabase
    .from("lens_usage")
    .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_company_colors")
    .eq("user_id", userId)
    .limit(1);

  const row = data?.[0];
  if (!row) {
    return {
      headshot_url: null, logo_url: null, agent_name: null,
      phone: null, email: null, company: null, website: null,
      company_colors: [],
    };
  }

  return {
    headshot_url: row.saved_headshot_url || null,
    logo_url: row.saved_logo_url || null,
    agent_name: row.saved_agent_name || null,
    phone: row.saved_phone || null,
    email: row.saved_email || null,
    company: row.saved_company || null,
    website: row.saved_website || null,
    company_colors: Array.isArray(row.saved_company_colors) ? row.saved_company_colors : [],
  };
}

// ─── Listings: from agent_properties + photo enrichment from orders ─────────
//
// Photo enrichment mirrors Design Studio lines 800-807:
//   1. Use website_curated.photos first (preferred)
//   2. Fall back to orders.photos matched by address substring
//   3. Extract secure_url || url from each photo object

export async function getListings(userId: string): Promise<Listing[]> {
  // 1. Get all properties for this agent
  const { data: props } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, bedrooms, bathrooms, sqft, price, special_features, amenities, website_slug, website_published, website_curated")
    .eq("user_id", userId)
    .is("merged_into_id", null)
    .order("updated_at", { ascending: false });

  if (!props || props.length === 0) return [];

  // 2. Get all paid orders with photos for this user (one query, not per-listing)
  const { data: orders } = await supabase
    .from("orders")
    .select("photos, property_address")
    .eq("user_id", userId)
    .eq("payment_status", "paid");

  const orderList = orders || [];

  // 3. Enrich each property with photos
  return props.map((prop: any) => {
    let photos: string[] = [];

    // Prefer curated photos (same as Design Studio line 801-802)
    const curated = prop.website_curated?.photos || [];
    if (curated.length) {
      photos = curated.slice(0, 7);
    }

    // Fall back to orders if not enough curated (same as Design Studio line 803-806)
    if (photos.length < 5) {
      const addrPrefix = (prop.address || "").substring(0, 15).toLowerCase();
      if (addrPrefix) {
        for (const order of orderList) {
          const orderAddr = (order.property_address || "").toLowerCase();
          if (orderAddr.includes(addrPrefix)) {
            const urls = (order.photos || [])
              .map((p: any) => p.secure_url || p.url)
              .filter(Boolean);
            photos = [...photos, ...urls];
            if (photos.length >= 7) break;
          }
        }
      }
      photos = [...new Set(photos)].slice(0, 7);
    }

    return {
      id: prop.id,
      address: prop.address || "",
      city: prop.city || null,
      state: prop.state || null,
      bedrooms: prop.bedrooms ?? null,
      bathrooms: prop.bathrooms ?? null,
      sqft: prop.sqft ?? null,
      price: prop.price ?? null,
      special_features: prop.special_features || null,
      amenities: prop.amenities || null,
      website_slug: prop.website_slug || null,
      website_published: prop.website_published ?? null,
      website_curated: prop.website_curated || null,
      photos,
    };
  });
}

// ─── Blog posts ─────────────────────────────────────────────────────────────

export async function getBlogPosts(userId: string): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("agent_blog_posts")
    .select("id, title, slug, content, excerpt, featured_image, published_at, created_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data || []) as BlogPost[];
}

// ─── Convenience: load everything for a handle in one call ──────────────────

export async function getAgentSiteData(handle: string) {
  const site = await getSite(handle);
  if (!site) return null;

  const [profile, listings, blogPosts] = await Promise.all([
    getProfile(site.user_id),
    getListings(site.user_id),
    getBlogPosts(site.user_id),
  ]);

  return { site, profile, listings, blogPosts };
}
