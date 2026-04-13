import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Calendar } from "lucide-react";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

async function getData(handle: string, slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let { data: website } = await supabase
    .from("agent_websites")
    .select("id, user_id, site_title, primary_color, status")
    .eq("handle", handle)
    .eq("status", "published")
    .single();

  if (!website) {
    const { data: bySlug } = await supabase
      .from("agent_websites")
      .select("id, user_id, site_title, primary_color, status")
      .eq("slug", handle)
      .eq("status", "published")
      .single();
    website = bySlug;
  }

  if (!website) return null;

  // Try finding the post by slug with website_id = user_id
  let { data: post } = await supabase
    .from("agent_blog_posts")
    .select("*")
    .eq("website_id", website.user_id)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  // Try with website_id = website.id
  if (!post) {
    const { data: postById } = await supabase
      .from("agent_blog_posts")
      .select("*")
      .eq("website_id", website.id)
      .eq("slug", slug)
      .eq("published", true)
      .single();
    post = postById;
  }

  // Also try by row ID if slug didn't match
  if (!post) {
    const { data: postByPk } = await supabase
      .from("agent_blog_posts")
      .select("*")
      .eq("id", slug)
      .eq("published", true)
      .single();
    post = postByPk;
  }

  if (!post) return null;

  return { website, post };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderMarkdown(content: string): string {
  if (!content) return "";

  let html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-cyan-600 hover:text-cyan-500 underline underline-offset-2">$1</a>'
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-gray-600 leading-relaxed list-disc">$1</li>')
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<li class="ml-4 text-sm text-gray-600 leading-relaxed list-decimal" value="$1">$2</li>'
    )
    .replace(/^---$/gm, '<hr class="my-6 border-gray-200" />')
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br />");

  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(
    /(<li class="ml-4 text-sm text-gray-600 leading-relaxed list-disc">.*?<\/li>)+/gs,
    '<ul class="my-3 space-y-1">$&</ul>'
  );
  html = html.replace(
    /(<li class="ml-4 text-sm text-gray-600 leading-relaxed list-decimal".*?<\/li>)+/gs,
    '<ol class="my-3 space-y-1">$&</ol>'
  );
  html = html.replace(/<p>(<h[1-3])/g, "$1");
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul|<ol|<hr)/g, "$1");
  html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, "$1");

  return html;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) return { title: "Not Found" };
  const { post, website } = data;
  return {
    title: `${post.title} | ${website.site_title || "Blog"}`,
    description: post.excerpt || post.meta_description || undefined,
  };
}

export default async function AgentBlogPostPage({ params }: Props) {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) notFound();

  const { website, post } = data;
  const primaryColor = website.primary_color || "#06b6d4";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Blog
      </Link>

      <article>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Calendar className="h-3 w-3" />
          {formatDate(post.created_at)}
          {post.updated_at && post.updated_at !== post.created_at && (
            <span className="text-gray-300">· Updated {formatDate(post.updated_at)}</span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose-custom text-sm text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || "") }}
        />
      </article>

      <div className="mt-12 pt-6 border-t border-gray-100">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          More Posts
        </Link>
      </div>
    </div>
  );
}
