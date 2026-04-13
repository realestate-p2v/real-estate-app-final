// app/site/[handle]/data.ts
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
