// app/site/[handle]/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared data layer for agent site pages.
// Schema verified from live debug dump — April 13 2026.
//
// URLs from Supabase are used AS-IS. No cloudinaryUrl() transforms.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types (matched to actual DB columns) ────────────────────────────────────

export interface AgentSite {
  id: string;
  user_id: string;
  handle: string;
  slug: string;
  site_title: string | null;
  tagline: string | null;
  bio: string | null;
  about_content: string | null;
  about_photo_url: string | null;
  template: string | null;
  primary_color: string | null;
  brand_colors: any | null;
  custom_css: string | null;
  custom_domain: string | null;
  hero_photos: string[];
  faq_items: { question: string; answer: string }[];
  social_links: Record<string, string>;
  contact_info: any | null;
  // Feature flags
  blog_enabled: boolean;
  calendar_enabled: boolean;
  listings_opt_in: boolean;
  reports_public: boolean;
  lensy_enabled: boolean;
  news_enabled: boolean;
  // SEO
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  // Status
  status: string;
  published: boolean;
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
  photos: string[];
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

// ─── Core: Resolve handle → site ────────────────────────────────────────────

export async function getSite(handle: string): Promise<AgentSite | null> {
  const { data, error } = await supabase
    .from("agent_websites")
    .select("*")
    .eq("handle", handle)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    id: row.id,
    user_id: row.user_id,
    handle: row.handle,
    slug: row.slug,
    site_title: row.site_title || null,
    tagline: row.tagline || null,
    bio: row.bio || null,
    about_content: row.about_content || null,
    about_photo_url: row.about_photo_url || null,
    template: row.template || null,
    primary_color: row.primary_color || null,
    brand_colors: row.brand_colors || null,
    custom_css: row.custom_css || null,
    custom_domain: row.custom_domain || null,
    hero_photos: Array.isArray(row.hero_photos) ? row.hero_photos : [],
    faq_items: Array.isArray(row.faq_items) ? row.faq_items : [],
    social_links: row.social_links || {},
    contact_info: row.contact_info || null,
    blog_enabled: row.blog_enabled ?? true,
    calendar_enabled: row.calendar_enabled ?? false,
    listings_opt_in: row.listings_opt_in ?? true,
    reports_public: row.reports_public ?? false,
    lensy_enabled: row.lensy_enabled ?? false,
    news_enabled: row.news_enabled ?? false,
    seo_title: row.seo_title || null,
    seo_description: row.seo_description || null,
    og_image_url: row.og_image_url || null,
    status: row.status || "draft",
    published: row.published ?? false,
  };
}

// ─── Profile: from lens_usage ───────────────────────────────────────────────

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

// ─── Listings: agent_properties + photo enrichment from orders ──────────────

export async function getListings(userId: string): Promise<Listing[]> {
  const { data: props } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, bedrooms, bathrooms, sqft, price, special_features, amenities, website_slug, website_published, website_curated")
    .eq("user_id", userId)
    .is("merged_into_id", null)
    .order("updated_at", { ascending: false });

  if (!props || props.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("photos, property_address")
    .eq("user_id", userId)
    .eq("payment_status", "paid");

  const orderList = orders || [];

  return props.map((prop: any) => {
    let photos: string[] = [];
    const curated = prop.website_curated?.photos || [];
    if (curated.length) photos = curated.slice(0, 7);

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

// ─── Convenience: load everything ───────────────────────────────────────────

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
