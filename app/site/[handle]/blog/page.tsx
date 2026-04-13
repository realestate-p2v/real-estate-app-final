// app/site/[handle]/blog/page.tsx
import { notFound } from "next/navigation";
import { getSite, getBlogPosts } from "../data";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function BlogPage({ params }: Props) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return notFound();
  if (!site.blog_enabled) return notFound();
  const posts = await getBlogPosts(site.user_id);

  return (
    <div style={{ padding: "48px 24px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", margin: "0 0 8px", textAlign: "center" }}>Blog</h1>
      <p style={{ fontSize: 16, color: "#777", margin: "0 0 40px", textAlign: "center" }}>{posts.length} {posts.length === 1 ? "post" : "posts"}</p>

      {posts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", fontSize: 16, padding: "60px 0" }}>No posts yet. Check back soon.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {posts.map((post) => (
            <a key={post.id} href={"/blog/" + post.slug} style={{ display: "block", padding: 24, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {post.featured_image ? (
                <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
              ) : null}
              <p style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>{post.title}</p>
              {post.excerpt ? <p style={{ fontSize: 15, color: "#666", margin: "0 0 12px", lineHeight: 1.5 }}>{post.excerpt.substring(0, 200)}{post.excerpt.length > 200 ? "\u2026" : ""}</p> : null}
              {post.published_at ? <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>{new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p> : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
