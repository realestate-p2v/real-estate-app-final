import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowRight, PenTool } from "lucide-react";

interface Props {
  params: Promise<{ handle: string }>;
}

async function getData(handle: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let { data: website } = await supabase
    .from("agent_websites")
    .select("user_id, site_title, primary_color, status, blog_enabled")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("user_id, site_title, primary_color, status, blog_enabled")
      .eq("slug", handle)
      .eq("status", "published")
      .single();
    website = bySlug;
  }

  if (!website) return null;

  // Get blog posts from agent_blog_posts (NOT blog_posts — that's the company blog)
  const { data: posts } = await supabase
    .from("agent_blog_posts")
    .select("id, title, slug, excerpt, content, published, created_at, updated_at")
    .eq("website_id", website.user_id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  // If no posts found by user_id in website_id, try matching via agent_websites.id
  let finalPosts = posts || [];
  if (finalPosts.length === 0) {
    // Get the actual website row ID
    const { data: wsRow } = await supabase
      .from("agent_websites")
      .select("id")
      .eq("user_id", website.user_id)
      .limit(1);

    if (wsRow && wsRow.length > 0) {
      const { data: postsById } = await supabase
        .from("agent_blog_posts")
        .select("id, title, slug, excerpt, content, published, created_at, updated_at")
        .eq("website_id", wsRow[0].id)
        .eq("published", true)
        .order("created_at", { ascending: false });

      finalPosts = postsById || [];
    }
  }

  return { website, posts: finalPosts };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getExcerpt(post: any): string {
  if (post.excerpt) return post.excerpt;
  if (post.content) {
    // Strip markdown formatting and take first 160 chars
    const plain = post.content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim();
    return plain.length > 160 ? plain.slice(0, 157) + "..." : plain;
  }
  return "";
}

export default async function AgentBlogPage({ params }: Props) {
  const { handle } = await params;
  const data = await getData(handle);
  if (!data) notFound();

  const { website, posts } = data;
  const primaryColor = website.primary_color || "#06b6d4";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Blog
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        {posts.length} {posts.length === 1 ? "post" : "posts"}
      </p>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-gray-100 bg-gray-50">
          <PenTool className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No blog posts yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug || post.id}`}
              className="block group rounded-xl border border-gray-100 bg-white p-6 hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Calendar className="h-3 w-3" />
                {formatDate(post.created_at)}
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                {post.title}
              </h2>
              {getExcerpt(post) && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
                  {getExcerpt(post)}
                </p>
              )}
              <span
                className="inline-flex items-center gap-1 text-sm font-medium mt-3 transition-colors hover:opacity-80"
                style={{ color: primaryColor }}
              >
                Read More <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
