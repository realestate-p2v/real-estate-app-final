// ============================================================
// FILE: app/site/[handle]/data.ts
// ============================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  hero_video_url: string | null;
  faq_items: { question: string; answer: string }[];
  social_links: Record<string, string>;
  contact_info: any | null;
  blog_enabled: boolean;
  calendar_enabled: boolean;
  listings_opt_in: boolean;
  reports_public: boolean;
  lensy_enabled: boolean;
  news_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
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

export interface ListingDetail extends Listing {
  year_built: number | null;
  lot_size: string | null;
  property_type: string | null;
  listing_type: string | null;
  status: string | null;
  booking_enabled: boolean;
  qr_code_url: string | null;
  website_modules: any | null;
  video_url: string | null;
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

export interface LocationPage {
  id: string;
  location_name: string;
  location_slug: string;
  region: string | null;
  country: string | null;
  page_title: string | null;
  meta_description: string | null;
  hero_heading: string | null;
  intro_text: string | null;
  body_content: string | null;
  highlights: any | null;
  keywords: string[] | null;
  hero_photo_url: string | null;
  photos: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSite(handle: string): Promise<AgentSite | null> {
  const { data, error } = await supabase
    .from("agent_websites")
    .select("*")
    .eq("handle", handle)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const r = data[0];
  return {
    id: r.id, user_id: r.user_id, handle: r.handle, slug: r.slug,
    site_title: r.site_title || null, tagline: r.tagline || null,
    bio: r.bio || null, about_content: r.about_content || null,
    about_photo_url: r.about_photo_url || null, template: r.template || null,
    primary_color: r.primary_color || null, brand_colors: r.brand_colors || null,
    custom_css: r.custom_css || null, custom_domain: r.custom_domain || null,
    hero_photos: Array.isArray(r.hero_photos) ? r.hero_photos : [],
    hero_video_url: r.hero_video_url || null,
    faq_items: Array.isArray(r.faq_items) ? r.faq_items : [],
    social_links: r.social_links || {}, contact_info: r.contact_info || null,
    blog_enabled: r.blog_enabled ?? true, calendar_enabled: r.calendar_enabled ?? false,
    listings_opt_in: r.listings_opt_in ?? true, reports_public: r.reports_public ?? false,
    lensy_enabled: r.lensy_enabled ?? false, news_enabled: r.news_enabled ?? false,
    seo_title: r.seo_title || null, seo_description: r.seo_description || null,
    og_image_url: r.og_image_url || null, status: r.status || "draft",
    published: r.published ?? false,
  };
}

export async function getProfile(userId: string): Promise<AgentProfile> {
  const { data } = await supabase
    .from("lens_usage")
    .select("saved_headshot_url, saved_logo_url, saved_agent_name, saved_phone, saved_email, saved_company, saved_website, saved_company_colors")
    .eq("user_id", userId)
    .limit(1);
  const r = data?.[0];
  if (!r) return { headshot_url: null, logo_url: null, agent_name: null, phone: null, email: null, company: null, website: null, company_colors: [] };
  return {
    headshot_url: r.saved_headshot_url || null, logo_url: r.saved_logo_url || null,
    agent_name: r.saved_agent_name || null, phone: r.saved_phone || null,
    email: r.saved_email || null, company: r.saved_company || null,
    website: r.saved_website || null,
    company_colors: Array.isArray(r.saved_company_colors) ? r.saved_company_colors : [],
  };
}

export async function getListings(userId: string): Promise<Listing[]> {
  const { data: props } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, bedrooms, bathrooms, sqft, price, special_features, amenities, website_slug, website_published, website_curated")
    .eq("user_id", userId).is("merged_into_id", null)
    .order("updated_at", { ascending: false });
  if (!props || props.length === 0) return [];
  const { data: orders } = await supabase
    .from("orders").select("photos, property_address")
    .eq("user_id", userId).eq("payment_status", "paid");
  const ol = orders || [];
  return props.map((p: any) => {
    let photos: string[] = [];
    const cur = p.website_curated?.photos || [];
    if (cur.length) photos = cur.slice(0, 7);
    if (photos.length < 5) {
      const prefix = (p.address || "").substring(0, 15).toLowerCase();
      if (prefix) {
        for (const o of ol) {
          if ((o.property_address || "").toLowerCase().includes(prefix)) {
            const urls = (o.photos || []).map((x: any) => x.secure_url || x.url).filter(Boolean);
            photos = [...photos, ...urls];
            if (photos.length >= 7) break;
          }
        }
      }
      photos = [...new Set(photos)].slice(0, 7);
    }
    return { id: p.id, address: p.address || "", city: p.city || null, state: p.state || null,
      bedrooms: p.bedrooms ?? null, bathrooms: p.bathrooms ?? null, sqft: p.sqft ?? null,
      price: p.price ?? null, special_features: p.special_features || null,
      amenities: p.amenities || null, website_slug: p.website_slug || null,
      website_published: p.website_published ?? null, website_curated: p.website_curated || null,
      photos };
  });
}

// ── Get single listing by slug (for listing detail page) ──
export async function getListing(userId: string, slug: string): Promise<ListingDetail | null> {
  const { data: props } = await supabase
    .from("agent_properties")
    .select("id, address, city, state, bedrooms, bathrooms, sqft, price, special_features, amenities, website_slug, website_published, website_curated, year_built, lot_size, property_type, listing_type, status, booking_enabled, qr_code_url, website_modules")
    .eq("user_id", userId)
    .eq("website_slug", slug)
    .is("merged_into_id", null)
    .limit(1);
  if (!props || props.length === 0) return null;
  const p = props[0];

  let photos: string[] = [];
  const cur = p.website_curated?.photos || [];
  if (cur.length) photos = [...cur];
  const { data: orders } = await supabase
    .from("orders").select("photos, delivery_url, property_address")
    .eq("user_id", userId).eq("payment_status", "paid");
  const prefix = (p.address || "").substring(0, 15).toLowerCase();
  let video_url: string | null = null;
  if (prefix) {
    for (const o of (orders || [])) {
      if ((o.property_address || "").toLowerCase().includes(prefix)) {
        const urls = (o.photos || []).map((x: any) => x.secure_url || x.url).filter(Boolean);
        photos = [...photos, ...urls];
        if (!video_url && o.delivery_url) video_url = o.delivery_url;
      }
    }
  }
  photos = [...new Set(photos)];

  return {
    id: p.id, address: p.address || "", city: p.city || null, state: p.state || null,
    bedrooms: p.bedrooms ?? null, bathrooms: p.bathrooms ?? null, sqft: p.sqft ?? null,
    price: p.price ?? null, special_features: p.special_features || null,
    amenities: p.amenities || null, website_slug: p.website_slug || null,
    website_published: p.website_published ?? null, website_curated: p.website_curated || null,
    photos, year_built: p.year_built ?? null, lot_size: p.lot_size || null,
    property_type: p.property_type || null, listing_type: p.listing_type || null,
    status: p.status || null, booking_enabled: p.booking_enabled ?? false,
    qr_code_url: p.qr_code_url || null, website_modules: p.website_modules || null,
    video_url,
  };
}

// ── Get full property data for PropertyWebsiteClient (mirrors main site's getPropertyData) ──
export async function getPropertyWebsiteData(slug: string, userId: string) {
  const { data: props } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("website_slug", slug)
    .eq("user_id", userId)
    .is("merged_into_id", null)
    .limit(1);
  if (!props || props.length === 0) return null;
  const property = props[0];

  const { data: agentRows } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_logo_url, saved_headshot_url, saved_branding_cards")
    .eq("user_id", property.user_id)
    .limit(1);
  const agent = agentRows?.[0] || null;

  const modules = (property.website_modules || {}) as Record<string, boolean>;
  const curated = (property.website_curated || {}) as Record<string, string[]>;

  let descriptions: any[] = [];
  if (modules.description && curated.descriptions?.length) {
    const { data } = await supabase
      .from("lens_descriptions")
      .select("id, description, style")
      .in("id", curated.descriptions);
    descriptions = data || [];
  }

  let stagings: any[] = [];
  if (modules.staging && curated.staging?.length) {
    const { data } = await supabase
      .from("lens_staging")
      .select("id, original_url, staged_url, room_type, style")
      .in("id", curated.staging);
    stagings = data || [];
  }

  let designExports: any[] = [];
  if (modules.exports && curated.exports?.length) {
    const { data } = await supabase
      .from("design_exports")
      .select("id, export_url, overlay_video_url, template_type, export_format")
      .in("id", curated.exports);
    designExports = data || [];
  }

  return { property, agent, modules, curated, descriptions, stagings, designExports };
}

// ── Count published location pages (for nav conditional) ──
export async function getLocationPageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("agent_location_pages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("published", true);
  if (error) return 0;
  return count || 0;
}

// ── Get all published location pages (for sitemap + index) ──
export async function getLocationPages(userId: string): Promise<LocationPage[]> {
  const { data } = await supabase
    .from("agent_location_pages")
    .select("*")
    .eq("user_id", userId)
    .eq("published", true)
    .order("created_at", { ascending: false });
  return (data || []) as LocationPage[];
}

export async function getBlogPosts(userId: string): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("agent_blog_posts")
    .select("id, title, slug, content, excerpt, featured_image, published_at, created_at")
    .eq("user_id", userId).eq("status", "published")
    .order("published_at", { ascending: false });
  return (data || []) as BlogPost[];
}

export async function getAgentSiteData(handle: string) {
  const site = await getSite(handle);
  if (!site) return null;
  const [profile, listings, blogPosts] = await Promise.all([
    getProfile(site.user_id), getListings(site.user_id), getBlogPosts(site.user_id),
  ]);
  return { site, profile, listings, blogPosts };
}
