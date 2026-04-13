// app/site/[handle]/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSite } from "../../data";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { handle, slug } = await params;
  const site = await getSite(handle);
  if (!site || !site.blog_enabled) return notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: posts } = await supabase
    .from("agent_blog_posts")
    .select("id, title, slug, content, featured_image, published_at, created_at")
    .eq("user_id", site.user_id)
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1);

  const post = posts?.[0];
  if (!post) return notFound();

  return (
    <div style={{ padding: "48px 24px", maxWidth: 760, margin: "0 auto" }}>
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
