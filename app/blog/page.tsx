import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Calendar, Tag } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "Blog | Real Estate Photo 2 Video — Tips, Guides & Industry Insights",
  description: "Expert real estate marketing tips, listing photography guides, and video marketing strategies. Learn how to sell listings faster with professional video content.",
  openGraph: {
    title: "Blog | Real Estate Photo 2 Video",
    description: "Expert real estate marketing tips, listing photography guides, and video marketing strategies.",
    url: "https://realestatephoto2video.com/blog",
    siteName: "Real Estate Photo 2 Video",
    type: "website",
  },
};

async function getPosts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, featured_image, featured_image_alt, author, tags, read_time_minutes, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
  return data || [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
            The P2V Blog
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            Real estate marketing tips, listing photography guides, and strategies to sell listings faster with professional video content.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">No blog posts yet. Check back soon!</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/order">Create Your Listing Video</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/40 hover:shadow-lg transition-all duration-300 ${
                    index === 0 && posts.length > 2 ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  {/* Image */}
                  {post.featured_image ? (
                    <div className={`overflow-hidden ${index === 0 && posts.length > 2 ? "h-64" : "h-48"}`}>
                      <img
                        src={post.featured_image}
                        alt={post.featured_image_alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={`bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${index === 0 && posts.length > 2 ? "h-64" : "h-48"}`}>
                      <span className="text-4xl">📸</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map((tag: string, i: number) => (
                          <span key={i} className="text-xs font-medium text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className={`font-bold text-foreground group-hover:text-accent transition-colors mb-2 ${
                      index === 0 && posts.length > 2 ? "text-2xl" : "text-lg"
                    }`}>
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.read_time_minutes} min read
                        </span>
                      </div>
                      <span className="text-accent font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Turn Your Photos Into Videos?
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            Professional listing videos from $79. Upload your photos, get your video in 24 hours.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 font-bold">
            <Link href="/order">Create My Listing Video</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
