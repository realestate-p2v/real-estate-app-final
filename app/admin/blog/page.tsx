
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Search, Image as ImageIcon, Save, Eye, ArrowLeft,
  Loader2, Trash2, GripVertical, Bold, Italic, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Quote, Code, Minus, ImagePlus,
  FileText, Send, ChevronDown, ChevronUp, X, Check, ExternalLink,
  PenLine, RotateCcw
} from "lucide-react";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  featured_image_alt: string;
  status: "draft" | "published";
  tags: string[];
  read_time_minutes: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
}

interface PexelsImage {
  id: number;
  url: string;
  medium: string;
  small: string;
  thumbnail: string;
  alt: string;
  photographer: string;
  photographer_url: string;
  width: number;
  height: number;
}

interface SuggestedImage {
  search_query: string;
  alt_text: string;
  placement: string;
}

const EMPTY_POST: BlogPost = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  meta_title: "",
  meta_description: "",
  featured_image: "",
  featured_image_alt: "",
  status: "draft",
  tags: [],
  read_time_minutes: 5,
};

export default function AdminBlogPage() {
  const router = useRouter();

  // Post list state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI generation state
  const [aiSubject, setAiSubject] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);

  // Pexels image search state
  const [imageQuery, setImageQuery] = useState("");
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [draggedImage, setDraggedImage] = useState<PexelsImage | null>(null);

  // Toolbox sections
  const [showAiSection, setShowAiSection] = useState(true);
  const [showSeoSection, setShowSeoSection] = useState(true);
  const [showImageSection, setShowImageSection] = useState(true);

  // Editor ref
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // ─── Fetch posts ───
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ─── Create new post ───
  const handleNewPost = () => {
    setEditingPost({ ...EMPTY_POST });
    setSuggestedImages([]);
    setImages([]);
    setSaved(false);
  };

  // ─── Edit existing post ───
  const handleEditPost = async (post: BlogPost) => {
    setEditingPost({ ...post });
    setSuggestedImages([]);
    setImages([]);
    setSaved(false);
  };

  // ─── Save post ───
  const handleSave = async (publishNow?: boolean) => {
    if (!editingPost) return;
    setSaving(true);
    setSaved(false);

    try {
      const postData = {
        ...editingPost,
        status: publishNow ? "published" : editingPost.status,
        meta_title: editingPost.meta_title || editingPost.title,
        meta_description: editingPost.meta_description || editingPost.excerpt,
        read_time_minutes: Math.max(1, Math.ceil(editingPost.content.split(/\s+/).length / 200)),
      };

      let res;
      if (editingPost.id) {
        // Update existing
        res = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
      } else {
        // Create new
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
      }

      const data = await res.json();
      if (data.success) {
        setEditingPost(data.post);
        setSaved(true);
        fetchPosts();
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete post ───
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter((p) => p.id !== id));
        if (editingPost?.id === id) setEditingPost(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ─── AI Generate ───
  const handleGenerate = async () => {
    if (!aiSubject.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiSubject,
          subject: aiSubject,
          keywords: aiKeywords,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newPost: BlogPost = {
          ...EMPTY_POST,
          title: data.title || aiSubject,
          slug: data.slug || aiSubject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          content: data.content || "",
          excerpt: data.excerpt || "",
          meta_title: data.title || aiSubject,
          meta_description: data.meta_description || "",
          tags: data.tags || [],
        };
        setEditingPost(newPost);
        if (data.suggested_images) {
          setSuggestedImages(data.suggested_images);
          // Auto-search the first suggested image
          if (data.suggested_images.length > 0) {
            setImageQuery(data.suggested_images[0].search_query);
            searchImages(data.suggested_images[0].search_query);
          }
        }
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Generate error:", err);
      alert("Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Image search ───
  const searchImages = async (query?: string) => {
    const q = query || imageQuery;
    if (!q.trim()) return;
    setSearchingImages(true);
    try {
      const res = await fetch(`/api/admin/blog/images?q=${encodeURIComponent(q)}&per_page=12`);
      const data = await res.json();
      if (data.success) setImages(data.images || []);
    } catch (err) {
      console.error("Image search error:", err);
    } finally {
      setSearchingImages(false);
    }
  };

  // ─── Insert image into content ───
  const insertImageIntoContent = (image: PexelsImage, altText?: string) => {
    if (!editingPost) return;
    const alt = altText || image.alt || imageQuery || "Real estate photo";
    const markdown = `\n\n![${alt}](${image.url})\n*Photo by [${image.photographer}](${image.photographer_url}) on Pexels*\n\n`;
    const editor = editorRef.current;
    if (editor) {
      const start = editor.selectionStart;
      const before = editingPost.content.slice(0, start);
      const after = editingPost.content.slice(start);
      setEditingPost({ ...editingPost, content: before + markdown + after });
      // Move cursor after inserted text
      setTimeout(() => {
        editor.selectionStart = editor.selectionEnd = start + markdown.length;
        editor.focus();
      }, 50);
    } else {
      setEditingPost({ ...editingPost, content: editingPost.content + markdown });
    }
  };

  // ─── Set as featured image ───
  const setFeaturedImage = (image: PexelsImage) => {
    if (!editingPost) return;
    setEditingPost({
      ...editingPost,
      featured_image: image.url,
      featured_image_alt: image.alt || imageQuery || "Featured blog image",
    });
  };

  // ─── Markdown toolbar helpers ───
  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const editor = editorRef.current;
    if (!editor || !editingPost) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editingPost.content.slice(start, end) || placeholder;
    const newContent = editingPost.content.slice(0, start) + before + selected + after + editingPost.content.slice(end);
    setEditingPost({ ...editingPost, content: newContent });
    setTimeout(() => {
      editor.selectionStart = start + before.length;
      editor.selectionEnd = start + before.length + selected.length;
      editor.focus();
    }, 50);
  };

  // ─── Handle drag and drop ───
  const handleDragStart = (e: React.DragEvent, image: PexelsImage) => {
    setDraggedImage(image);
    e.dataTransfer.setData("text/plain", image.url);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedImage && editingPost) {
      insertImageIntoContent(draggedImage);
      setDraggedImage(null);
    }
  };

  const handleEditorDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleFeaturedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedImage && editingPost) {
      setFeaturedImage(draggedImage);
      setDraggedImage(null);
    }
  };

  const handleFeaturedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // ─── Auto-generate slug from title ───
  const handleTitleChange = (title: string) => {
    if (!editingPost) return;
    const slug = editingPost.id
      ? editingPost.slug  // Don't auto-change slug on existing posts
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setEditingPost({ ...editingPost, title, slug });
  };

  // ─── Word count ───
  const wordCount = editingPost ? editingPost.content.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // ─── Render post list ───
  if (!editingPost) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Blog Manager</h1>
              <p className="text-muted-foreground mt-1">Create SEO-optimized blog posts with AI</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/blog" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Blog
                </Link>
              </Button>
              <Button onClick={handleNewPost} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PenLine className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No blog posts yet</h3>
              <p className="text-muted-foreground mb-6">Create your first SEO-optimized blog post with AI</p>
              <Button onClick={handleNewPost} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Sparkles className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-accent/30 transition-colors group"
                >
                  {/* Thumbnail */}
                  {post.featured_image ? (
                    <img
                      src={post.featured_image}
                      alt={post.featured_image_alt || post.title}
                      className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{post.title || "Untitled"}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        post.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                      <span>{post.read_time_minutes || readTime} min read</span>
                      {post.published_at && (
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {post.status === "published" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)}>
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => post.id && handleDelete(post.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Render editor (two-column layout) ───
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Top bar */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setEditingPost(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">All Posts</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span className="text-border">·</span>
            <span>{readTime} min read</span>
            {saved && (
              <>
                <span className="text-border">·</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Saved
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">

          {/* ═══ LEFT COLUMN — Editor ═══ */}
          <div className="space-y-4">
            {/* Title */}
            <input
              type="text"
              value={editingPost.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post Title..."
              className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 pb-2"
            />

            {/* Slug */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>/blog/</span>
              <input
                type="text"
                value={editingPost.slug}
                onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                className="bg-muted/50 rounded px-2 py-1 text-sm text-foreground border border-border/50 min-w-0 flex-1"
              />
            </div>

            {/* Markdown toolbar */}
            <div className="flex items-center gap-1 bg-card rounded-xl border border-border p-2 flex-wrap">
              <button onClick={() => insertMarkdown("**", "**", "bold text")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Bold">
                <Bold className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("*", "*", "italic text")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Italic">
                <Italic className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="w-[1px] h-5 bg-border mx-1" />
              <button onClick={() => insertMarkdown("\n## ", "\n", "Heading")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Heading 2">
                <Heading2 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("\n### ", "\n", "Subheading")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Heading 3">
                <Heading3 className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="w-[1px] h-5 bg-border mx-1" />
              <button onClick={() => insertMarkdown("\n- ", "\n", "List item")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Bullet List">
                <List className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("\n1. ", "\n", "List item")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Numbered List">
                <ListOrdered className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="w-[1px] h-5 bg-border mx-1" />
              <button onClick={() => insertMarkdown("[", "](url)", "link text")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Link">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("\n> ", "\n", "Quote text")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Blockquote">
                <Quote className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("`", "`", "code")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Inline Code">
                <Code className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("\n---\n", "", "")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Horizontal Rule">
                <Minus className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => insertMarkdown("\n![Alt text](", ")\n", "image-url")} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Image">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content editor */}
            <textarea
              ref={editorRef}
              value={editingPost.content}
              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
              onDrop={handleEditorDrop}
              onDragOver={handleEditorDragOver}
              placeholder="Start writing your blog post in Markdown...

## Your First Section

Write compelling content here. Drag images from the toolbox on the right to insert them.

- Use bullet points for scannable content
- Bold **key phrases** for emphasis
- Include questions as headers for SEO"
              className="w-full min-h-[700px] bg-card rounded-xl border border-border p-6 text-foreground text-base leading-relaxed font-mono resize-y outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-muted-foreground/30"
              style={{ tabSize: 2 }}
            />
          </div>

          {/* ═══ RIGHT COLUMN — Toolbox ═══ */}
          <div className="space-y-4">

            {/* ── AI Generation ── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowAiSection(!showAiSection)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground text-sm">AI Content Generator</span>
                </div>
                {showAiSection ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showAiSection && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Topic / Title</Label>
                    <Input
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      placeholder="e.g., 5 Listing Photo Mistakes That Cost You Showings"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Target Keywords (optional)</Label>
                    <Input
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder="e.g., real estate listing photos, photo tips"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !aiSubject.trim()}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Blog Post
                      </>
                    )}
                  </Button>

                  {/* Suggested images from AI */}
                  {suggestedImages.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Images:</p>
                      <div className="space-y-1.5">
                        {suggestedImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setImageQuery(img.search_query);
                              searchImages(img.search_query);
                            }}
                            className="w-full text-left text-xs px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <span className="text-foreground font-medium">{img.search_query}</span>
                            <span className="text-muted-foreground block mt-0.5">{img.placement}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Featured Image ── */}
            <div className="bg-card rounded-xl border border-border p-4">
              <Label className="text-xs text-muted-foreground mb-2 block font-semibold">Featured Image</Label>
              <div
                onDrop={handleFeaturedDrop}
                onDragOver={handleFeaturedDragOver}
                className={`rounded-xl border-2 border-dashed transition-all ${
                  editingPost.featured_image
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border hover:border-accent/40"
                } overflow-hidden`}
              >
                {editingPost.featured_image ? (
                  <div className="relative group">
                    <img
                      src={editingPost.featured_image}
                      alt={editingPost.featured_image_alt || "Featured"}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingPost({ ...editingPost, featured_image: "", featured_image_alt: "" })}
                        className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Drag an image here from the search below</p>
                  </div>
                )}
              </div>
              {editingPost.featured_image && (
                <Input
                  value={editingPost.featured_image_alt}
                  onChange={(e) => setEditingPost({ ...editingPost, featured_image_alt: e.target.value })}
                  placeholder="Alt text for featured image..."
                  className="mt-2 text-xs"
                />
              )}
            </div>

            {/* ── Pexels Image Search ── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowImageSection(!showImageSection)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground text-sm">Image Search (Pexels)</span>
                </div>
                {showImageSection ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showImageSection && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={imageQuery}
                      onChange={(e) => setImageQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchImages()}
                      placeholder="Search real estate photos..."
                      className="text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchImages()}
                      disabled={searchingImages}
                      className="px-3"
                    >
                      {searchingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Image grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, image)}
                          className="group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-border hover:border-accent/50 transition-colors"
                        >
                          <img
                            src={image.thumbnail}
                            alt={image.alt}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <button
                              onClick={() => insertImageIntoContent(image)}
                              className="bg-accent text-accent-foreground rounded px-2 py-0.5 text-[10px] font-semibold hover:bg-accent/90 w-full text-center"
                            >
                              Insert
                            </button>
                            <button
                              onClick={() => setFeaturedImage(image)}
                              className="bg-white/20 text-white rounded px-2 py-0.5 text-[10px] font-semibold hover:bg-white/30 w-full text-center"
                            >
                              Set Featured
                            </button>
                          </div>
                          <div className="absolute top-1 left-1">
                            <GripVertical className="h-3 w-3 text-white/50 group-hover:text-white/80" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Drag images to the editor or featured image area · Photos from Pexels
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── SEO Settings ── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowSeoSection(!showSeoSection)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-foreground text-sm">SEO Settings</span>
                </div>
                {showSeoSection ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showSeoSection && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Meta Title <span className="text-muted-foreground/50">({(editingPost.meta_title || editingPost.title).length}/60)</span></Label>
                    <Input
                      value={editingPost.meta_title || editingPost.title}
                      onChange={(e) => setEditingPost({ ...editingPost, meta_title: e.target.value })}
                      placeholder="SEO title (under 60 chars)"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Meta Description <span className="text-muted-foreground/50">({(editingPost.meta_description || "").length}/155)</span></Label>
                    <Textarea
                      value={editingPost.meta_description}
                      onChange={(e) => setEditingPost({ ...editingPost, meta_description: e.target.value })}
                      placeholder="155-character description for search results..."
                      className="text-sm resize-none h-16"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Excerpt</Label>
                    <Textarea
                      value={editingPost.excerpt}
                      onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      placeholder="Short summary for blog listing cards..."
                      className="text-sm resize-none h-16"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Tags (comma separated)</Label>
                    <Input
                      value={editingPost.tags.join(", ")}
                      onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                      placeholder="real estate, listing photos, marketing"
                      className="text-sm"
                    />
                  </div>

                  {/* SEO Preview */}
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Google Preview:</p>
                    <div>
                      <p className="text-blue-600 text-sm font-medium truncate">
                        {editingPost.meta_title || editingPost.title || "Blog Post Title"}
                      </p>
                      <p className="text-emerald-700 text-xs truncate">
                        realestatephoto2video.com/blog/{editingPost.slug || "post-slug"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {editingPost.meta_description || editingPost.excerpt || "Meta description will appear here..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
