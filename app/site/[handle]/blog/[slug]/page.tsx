// ============================================================
// FILE: app/site/[handle]/blog/[slug]/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSite, getProfile } from "../../data";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

async function getPost(userId: string, slug: string) {
  const { data: posts } = await supabase
    .from("agent_blog_posts")
    .select("id, title, slug, content, excerpt, featured_image, published_at, created_at")
    .eq("user_id", userId)
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1);
  return posts?.[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site || !site.blog_enabled) return {};
  const post = await getPost(site.user_id, slug);
  if (!post) return {};
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const title = `${post.title} | ${site.site_title || agent}`;
  const description = post.excerpt?.slice(0, 155).replace(/\n/g, " ").trim()
    || post.content?.slice(0, 155).replace(/\n/g, " ").replace(/\*\*/g, "").trim()
    || `Blog post by ${agent}`;
  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      ...(post.featured_image && { images: [{ url: post.featured_image }] }),
    },
    twitter: {
      card: post.featured_image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      ...(post.featured_image && { images: [post.featured_image] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site || !site.blog_enabled) return notFound();
  const post = await getPost(site.user_id, slug);
  if (!post) return notFound();
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const siteUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${handle}.p2v.homes`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: `${siteUrl}/blog/${slug}`,
    ...(post.featured_image && { image: post.featured_image }),
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.created_at && { dateCreated: post.created_at }),
    author: {
      "@type": "Person",
      name: agent,
    },
    publisher: {
      "@type": "Organization",
      name: site.site_title || agent,
      ...(profile.logo_url && { logo: { "@type": "ImageObject", url: profile.logo_url } }),
    },
  };

  return (
    <div style={{ padding: "48px 24px", maxWidth: 760, margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a href="/blog" style={{ fontSize: 14, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>&larr; Back to blog</a>
      {post.featured_image ? (
        <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 12, marginBottom: 24 }} />
      ) : null}
      <h1 style={{ fontSize: 34, fontWeight: 700, color: "#111", margin: "0 0 12px", lineHeight: 1.2 }}>{post.title}</h1>
      {post.published_at ? (
        <p style={{ fontSize: 14, color: "#999", margin: "0 0 32px" }}>
          {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      ) : null}
      <div
        style={{ fontSize: 16, color: "#333", lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{
          __html: (post.content || "")
            .replace(/\n\n/g, "</p><p>")
            .replace(/\n/g, "<br/>")
            .replace(/^/, "<p>")
            .replace(/$/, "</p>"),
        }}
      />
    </div>
  );
}
