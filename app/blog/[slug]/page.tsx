import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ArrowLeft, Share2, Tag } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { BlogContent } from "@/components/blog-content";
import { BlogViewTracker } from "@/components/blog-view-tracker";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.meta_title || post.title} | Real Estate Photo 2 Video`,
    description: post.meta_description || post.excerpt || "",
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      url: `https://realestatephoto2video.com/blog/${post.slug}`,
      siteName: "Real Estate Photo 2 Video",
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author || "Matt Ymbras"],
      ...(post.featured_image ? { images: [{ url: post.featured_image, alt: post.featured_image_alt || post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      ...(post.featured_image ? { images: [post.featured_image] } : {}),
    },
    alternates: {
      canonical: `https://realestatephoto2video.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // JSON-LD structured data for SEO + AI citation
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.featured_image || undefined,
    author: {
      "@type": "Person",
      name: post.author || "Matt Ymbras",
    },
    publisher: {
      "@type": "Organization",
      name: "Real Estate Photo 2 Video",
      url: "https://realestatephoto2video.com",
      logo: {
        "@type": "ImageObject",
        url: "https://realestatephoto2video.com/logo.png",
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://realestatephoto2video.com/blog/${post.slug}`,
    },
    keywords: (post.tags || []).join(", "),
    wordCount: post.content?.split(/\s+/).length || 0,
    articleSection: "Real Estate Marketing",
  };

  // FAQ structured data (extract from content if FAQ section exists)
  const faqItems = extractFAQs(post.content);
  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BlogViewTracker slug={slug} />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Hero image */}
      {post.featured_image && (
        <div className="w-full h-64 sm:h-80 lg:h-96 relative overflow-hidden">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className="mx-auto max-w-3xl px-4 py-10">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string, i: number) => (
              <span key={i} className="text-xs font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          <span className="font-medium text-foreground">{post.author || "Matt Ymbras"}</span>
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.read_time_minutes} min read
          </span>
        </div>

        {/* Content */}
        <BlogContent content={post.content} />

        {/* Bottom CTA */}
        <div className="mt-12 p-8 bg-primary rounded-2xl text-center">
          <h3 className="text-2xl font-bold text-primary-foreground mb-3">
            Turn Your Listing Photos Into Videos
          </h3>
          <p className="text-primary-foreground/70 mb-6 max-w-lg mx-auto">
            Professional cinematic walkthrough videos from $79. Upload your photos, get your video in 24 hours.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 py-5 text-lg">
            <Link href="/order">Create My Listing Video</Link>
          </Button>
        </div>

        {/* Share */}
        <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground">
          <span className="text-sm">Share this article:</span>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://realestatephoto2video.com/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors text-sm"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://realestatephoto2video.com/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors text-sm"
          >
            LinkedIn
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://realestatephoto2video.com/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors text-sm"
          >
            Facebook
          </a>
        </div>
      </article>

      <Footer />
    </div>
  );
}

// ─── Extract FAQ pairs from markdown content ───
function extractFAQs(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const lines = content.split("\n");
  let inFaqSection = false;
  let currentQuestion = "";
  let currentAnswer = "";

  for (const line of lines) {
    // Detect FAQ section
    if (/^##\s*(frequently asked questions|faq)/i.test(line)) {
      inFaqSection = true;
      continue;
    }

    // Stop at next ## section after FAQ
    if (inFaqSection && /^##\s+/.test(line) && !/^###/.test(line)) {
      // Save last Q&A
      if (currentQuestion && currentAnswer.trim()) {
        faqs.push({ question: currentQuestion, answer: currentAnswer.trim() });
      }
      break;
    }

    if (inFaqSection) {
      // New question (### header)
      if (/^###\s+/.test(line)) {
        // Save previous Q&A
        if (currentQuestion && currentAnswer.trim()) {
          faqs.push({ question: currentQuestion, answer: currentAnswer.trim() });
        }
        currentQuestion = line.replace(/^###\s+/, "").replace(/\??\s*$/, "?");
        currentAnswer = "";
      } else if (currentQuestion && line.trim()) {
        currentAnswer += (currentAnswer ? " " : "") + line.trim();
      }
    }
  }

  // Don't forget the last one
  if (currentQuestion && currentAnswer.trim()) {
    faqs.push({ question: currentQuestion, answer: currentAnswer.trim() });
  }

  return faqs;
}
