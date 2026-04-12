import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

async function getData(handle: string, postSlug: string) {
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

  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_headshot_url, saved_company")
    .eq("user_id", website.user_id)
    .single();

  // Try matching by website_id as user_id first, then website row id
  let { data: post } = await supabase
    .from("agent_blog_posts")
    .select("*")
    .eq("website_id", website.user_id)
    .eq("slug", postSlug)
    .eq("status", "published")
    .single();

  if (!post) {
    const { data: byWid } = await supabase
      .from("agent_blog_posts")
      .select("*")
      .eq("website_id", website.id)
      .eq("slug", postSlug)
      .eq("status", "published")
      .single();
    post = byWid;
  }

  if (!post) return null;

  return { website, agent, post };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) return { title: "Post Not Found" };
  const { post, website } = data;
  return {
    title: `${post.title} | ${website.site_title || "Blog"}`,
    description: post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      publishedTime: post.published_at,
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
  };
}

// Simple markdown renderer — handles headers, bold, italic, links, lists
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-600 hover:text-cyan-500 underline underline-offset-2">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-600 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-gray-600 leading-relaxed list-decimal">$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
    // Single newlines within paragraphs
    .replace(/\n/g, "<br />");
}

export default async function AgentBlogPostPage({ params }: Props) {
  const { handle, slug } = await params;
  const data = await getData(handle, slug);
  if (!data) notFound();

  const { website, agent, post } = data;
  const agentName = agent?.saved_agent_name || website.site_title || "Agent";
  const primaryColor = website.primary_color || "#06b6d4";
  const readTime = Math.max(1, Math.ceil((post.content || "").split(/\s+/).length / 200));

  return (
    <div>
      {/* Cover image */}
      {post.cover_image_url && (
        <div className="w-full h-56 sm:h-72 lg:h-80 relative overflow-hidden">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
      )}

      <article className="mx-auto max-w-3xl px-4 py-10">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {agent?.saved_headshot_url && (
              <img
                src={agent.saved_headshot_url}
                alt={agentName}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            <span className="font-medium text-gray-700">{agentName}</span>
          </div>
          {(post.published_at || post.created_at) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min read
          </span>
        </div>

        {/* Content */}
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{
            __html: `<p class="text-gray-600 leading-relaxed mb-4">${renderMarkdown(post.content)}</p>`,
          }}
        />

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-center gap-4 text-gray-400">
          <span className="text-sm">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://${website.site_title ? (website as any).handle || (website as any).slug : "p2v"}.p2v.homes/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors text-sm"
          >
            X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://p2v.homes/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors text-sm"
          >
            LinkedIn
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://p2v.homes/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors text-sm"
          >
            Facebook
          </a>
        </div>

        {/* Agent CTA */}
        <div
          className="mt-10 rounded-2xl p-8 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h3 className="text-xl font-bold">
            Looking for Your Next Home?
          </h3>
          <p className="text-white/80 mt-2 max-w-md mx-auto text-sm">
            {agentName} is here to help with all your real estate needs.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-white font-bold text-sm transition-all hover:shadow-lg"
            style={{ color: primaryColor }}
          >
            Get in Touch
          </Link>
        </div>
      </article>
    </div>
  );
}
