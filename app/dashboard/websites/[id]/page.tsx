"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Globe,
  Eye,
  Copy,
  Check,
  Loader2,
  Save,
  Palette,
  FileText,
  Settings,
  BarChart3,
  PenTool,
  CalendarDays,
  MessageSquare,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Upload,
  X,
  Layout,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TEMPLATES = [
  { id: "modern_clean", mapped: "modern", label: "Modern Clean", desc: "White, minimal, sans-serif", preview: "bg-white border-gray-200" },
  { id: "luxury_dark", mapped: "bold", label: "Luxury Dark", desc: "Dark charcoal, gold accents", preview: "bg-gray-900 border-amber-500/50" },
  { id: "classic_light", mapped: "classic", label: "Classic Light", desc: "Warm cream, navy accents", preview: "bg-amber-50 border-blue-900/30" },
];

const COLOR_PRESETS = [
  "#06b6d4", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
  "#dc2626", "#ea580c", "#d97706", "#16a34a", "#0d9488",
  "#1e293b", "#334155",
];

const TABS = [
  { id: "content", label: "Content", icon: PenTool },
  { id: "design", label: "Design", icon: Palette },
  { id: "pages", label: "Pages", icon: Layout },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

interface FaqItem {
  question: string;
  answer: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

export default function WebsiteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [copied, setCopied] = useState(false);

  // Website data
  const [website, setWebsite] = useState<any>(null);
  const [agentWebsite, setAgentWebsite] = useState<any>(null);

  // Content fields
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [agentBio, setAgentBio] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");

  // Design
  const [template, setTemplate] = useState("modern_clean");
  const [primaryColor, setPrimaryColor] = useState("#06b6d4");

  // Pages
  const [blogEnabled, setBlogEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [reportsPublic, setReportsPublic] = useState(false);
  const [listingsOptIn, setListingsOptIn] = useState(true);

  // FAQ
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Blog
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [blogTopic, setBlogTopic] = useState("");

  // Analytics
  const [viewCount, setViewCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);

  // Load data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Fetch website from websites table
      const { data: site } = await supabase
        .from("websites")
        .select("*")
        .eq("id", websiteId)
        .eq("user_id", user.id)
        .single();

      if (!site) { router.push("/dashboard/websites"); return; }
      setWebsite(site);

      // Fetch agent_websites for extra fields
      const { data: aw } = await supabase
        .from("agent_websites")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      const agentSite = aw?.[0] || null;
      setAgentWebsite(agentSite);

      // Populate fields from both tables
      setSiteName(site.name || "");
      setTagline(agentSite?.tagline || site.hero_subheadline || "");
      setAboutContent(agentSite?.about_content || site.about_content || "");
      setAgentBio(agentSite?.bio || site.agent_bio || "");
      setHeroHeadline(site.hero_headline || "");
      setHeroSubheadline(site.hero_subheadline || "");
      setTemplate(site.template || "modern_clean");
      setPrimaryColor(agentSite?.primary_color || "#06b6d4");
      setBlogEnabled(agentSite?.blog_enabled ?? true);
      setCalendarEnabled(agentSite?.calendar_enabled ?? false);
      setReportsPublic(agentSite?.reports_public ?? false);
      setListingsOptIn(agentSite?.listings_opt_in ?? true);
      setFaqItems(agentSite?.faq_items || []);
      setViewCount(site.view_count || 0);
      setLeadCount(site.lead_count || 0);

      // Fetch blog posts
      const { data: posts } = await supabase
        .from("agent_blog_posts")
        .select("id, title, slug, status, published_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBlogPosts(posts || []);
      setLoading(false);
    }
    load();
  }, [websiteId, supabase, router]);

  // Save
  const handleSave = useCallback(async () => {
    if (!website) return;
    setSaving(true);

    // Update websites table
    const res = await fetch("/api/websites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: website.id,
        name: siteName,
        template,
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline || tagline,
        about_content: aboutContent,
        agent_bio: agentBio,
        modules: {
          ...website.modules,
          booking: calendarEnabled,
        },
      }),
    });

    // Update agent_websites directly for fields not in websites table
    if (agentWebsite) {
      await supabase
        .from("agent_websites")
        .update({
          tagline,
          about_content: aboutContent,
          bio: agentBio,
          primary_color: primaryColor,
          blog_enabled: blogEnabled,
          calendar_enabled: calendarEnabled,
          reports_public: reportsPublic,
          listings_opt_in: listingsOptIn,
          faq_items: faqItems,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentWebsite.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [website, agentWebsite, siteName, tagline, aboutContent, agentBio, heroHeadline, heroSubheadline, template, primaryColor, blogEnabled, calendarEnabled, reportsPublic, listingsOptIn, faqItems, supabase]);

  // Toggle publish
  const handleTogglePublish = async () => {
    if (!website) return;
    const newStatus = website.status === "published" ? "draft" : "published";

    await fetch("/api/websites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: website.id, status: newStatus }),
    });

    setWebsite({ ...website, status: newStatus });
  };

  // Copy URL
  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${website.slug}.p2v.homes`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add FAQ
  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqItems([...faqItems, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
  };

  // Remove FAQ
  const handleRemoveFaq = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  // Generate blog post
  const handleGeneratePost = async () => {
    if (!blogTopic.trim() || !agentWebsite) return;
    setGeneratingPost(true);

    try {
      const res = await fetch("/api/websites/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: blogTopic,
          websiteId: agentWebsite.id,
        }),
      });

      const data = await res.json();
      if (data.success || data.title) {
        // Save the post as draft
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newPost } = await supabase
            .from("agent_blog_posts")
            .insert({
              website_id: user.id,
              user_id: user.id,
              title: data.title,
              slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20),
              content: data.content,
              excerpt: data.excerpt || "",
              tags: data.tags || [],
              status: "draft",
              ai_generated: true,
            })
            .select("id, title, slug, status, created_at")
            .single();

          if (newPost) {
            setBlogPosts([{ ...newPost, published_at: null }, ...blogPosts]);
          }
        }
        setBlogTopic("");
      } else {
        alert("Failed to generate: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }

    setGeneratingPost(false);
  };

  // Publish/unpublish blog post
  const handleToggleBlogPost = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await supabase
      .from("agent_blog_posts")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    setBlogPosts(blogPosts.map((p) =>
      p.id === post.id
        ? { ...p, status: newStatus, published_at: newStatus === "published" ? new Date().toISOString() : null }
        : p
    ));
  };

  // Delete blog post
  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm("Delete this blog post?")) return;
    await supabase.from("agent_blog_posts").delete().eq("id", postId);
    setBlogPosts(blogPosts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!website) return null;

  const siteUrl = `https://${website.slug}.p2v.homes`;
  const isPublished = website.status === "published";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/websites" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{siteName || "My Website"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {isPublished ? "Live" : "Draft"}
                </span>
                <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {website.slug}.p2v.homes <ExternalLink className="h-3 w-3" />
                </a>
                <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleTogglePublish} variant="outline" size="sm" className="font-bold text-xs">
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                <Eye className="h-3 w-3 mr-1.5" /> Preview
              </Button>
            </a>
            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : saved ? <Check className="h-3 w-3 mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">Views</p>
            <p className="text-2xl font-extrabold text-foreground">{viewCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">Leads</p>
            <p className="text-2xl font-extrabold text-foreground">{leadCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">Blog Posts</p>
            <p className="text-2xl font-extrabold text-foreground">{blogPosts.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === tab.id ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
            </button>
          ))}
        </div>

        {/* ═══ CONTENT TAB ═══ */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Basic Info</h3>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Site Title</label>
                <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tagline</label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your trusted real estate advisor" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">About</label>
                <textarea value={aboutContent} onChange={(e) => setAboutContent(e.target.value)} rows={5} placeholder="Tell visitors about yourself..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Agent Bio (short)</label>
                <textarea value={agentBio} onChange={(e) => setAgentBio(e.target.value)} rows={3} placeholder="A brief bio for your agent card..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Hero Section</h3>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Headline</label>
                <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="Your Real Estate Expert" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subheadline</label>
                <input value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} placeholder="Helping families find their dream home" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </div>
            </div>
          </div>
        )}

        {/* ═══ DESIGN TAB ═══ */}
        {activeTab === "design" && (
          <div className="space-y-6">
            {/* Color Picker */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Brand Color</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl border-2 border-border" style={{ backgroundColor: primaryColor }} />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`h-8 w-8 rounded-lg border-2 transition-all ${primaryColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>Primary Button</button>
                  <span className="text-sm font-bold" style={{ color: primaryColor }}>Accent Text</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ color: primaryColor, backgroundColor: `${primaryColor}20` }}>Badge</span>
                </div>
              </div>
            </div>

            {/* Template */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Template</h3>
              <div className="space-y-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      template === t.id ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className={`h-12 w-20 rounded-lg border flex items-center justify-center ${t.preview}`}>
                      <span className="text-xs font-bold opacity-60">Aa</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                    {template === t.id && <Check className="h-4 w-4 text-accent ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAGES TAB ═══ */}
        {activeTab === "pages" && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Enable / Disable Pages</h3>
            <p className="text-xs text-muted-foreground mb-4">Toggle which pages appear on your website.</p>

            {[
              { label: "Blog", desc: "Write posts or generate with AI", value: blogEnabled, set: setBlogEnabled },
              { label: "Booking Calendar", desc: "Let visitors schedule showings", value: calendarEnabled, set: setCalendarEnabled },
              { label: "Public Reports", desc: "Show generated reports to visitors", value: reportsPublic, set: setReportsPublic },
              { label: "Portal Listing", desc: "Show your listings on p2v.homes public portal", value: listingsOptIn, set: setListingsOptIn },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => set(!value)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-accent" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}

            <p className="text-[10px] text-muted-foreground pt-2">
              Home, About, Listings, and Contact pages are always enabled.
            </p>
          </div>
        )}

        {/* ═══ BLOG TAB ═══ */}
        {activeTab === "blog" && (
          <div className="space-y-6">
            {/* AI Generator */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-1">AI Blog Generator</h3>
              <p className="text-xs text-muted-foreground mb-4">Generate SEO-optimized blog posts about your market.</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    value={blogTopic}
                    onChange={(e) => setBlogTopic(e.target.value)}
                    placeholder="e.g. 5 Things to Know Before Buying in Guanacaste"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <Button
                  onClick={handleGeneratePost}
                  disabled={generatingPost || !blogTopic.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs"
                >
                  {generatingPost ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Generating...</> : <><Sparkles className="h-3 w-3 mr-1.5" />Generate</>}
                </Button>
              </div>
            </div>

            {/* Blog posts list */}
            <div className="bg-card rounded-2xl border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">{blogPosts.length} Blog Post{blogPosts.length !== 1 ? "s" : ""}</h3>
              </div>
              {blogPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No blog posts yet. Generate one above!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {post.status === "published" ? "Published" : "Draft"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.published_at || post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3">
                        <Button onClick={() => handleToggleBlogPost(post)} variant="outline" size="sm" className="text-[10px] font-bold h-7 px-2.5">
                          {post.status === "published" ? "Unpublish" : "Publish"}
                        </Button>
                        <button onClick={() => handleDeleteBlogPost(post.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ FAQ TAB ═══ */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-1">Add FAQ</h3>
              <p className="text-xs text-muted-foreground mb-4">These appear on your website&apos;s FAQ page.</p>
              <div className="space-y-3">
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Question"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Answer"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <Button onClick={handleAddFaq} disabled={!newQuestion.trim() || !newAnswer.trim()} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs">
                  <Plus className="h-3 w-3 mr-1.5" /> Add FAQ
                </Button>
              </div>
            </div>

            {faqItems.length > 0 && (
              <div className="bg-card rounded-2xl border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">{faqItems.length} FAQ{faqItems.length !== 1 ? "s" : ""}</h3>
                </div>
                <div className="divide-y divide-border">
                  {faqItems.map((item, i) => (
                    <div key={i} className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.answer}</p>
                      </div>
                      <button onClick={() => handleRemoveFaq(i)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Remember to click &quot;Save Changes&quot; after editing FAQs.</p>
          </div>
        )}

        {/* ═══ SETTINGS TAB ═══ */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Domain</h3>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your P2V subdomain</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground">
                    {website.slug}.p2v.homes
                  </div>
                  <button onClick={handleCopy} className="px-3 py-2.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Custom domains coming soon. Contact support if you need a custom domain now.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Site Status</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    {isPublished ? "Your site is live and visible to visitors." : "Your site is in draft mode — only you can see it."}
                  </p>
                </div>
                <Button onClick={handleTogglePublish} variant={isPublished ? "outline" : "default"} size="sm" className="font-bold text-xs">
                  {isPublished ? "Unpublish" : "Publish Site"}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-bold text-foreground text-red-600 mb-2">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-3">Deleting your website is permanent and cannot be undone.</p>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 font-bold text-xs"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this website? This cannot be undone.")) return;
                  await fetch(`/api/websites?id=${website.id}`, { method: "DELETE" });
                  router.push("/dashboard/websites");
                }}
              >
                <Trash2 className="h-3 w-3 mr-1.5" /> Delete Website
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
