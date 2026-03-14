"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Loader2,
  Video,
  RefreshCw,
  Trash2,
  ExternalLink,
  Eye,
  Instagram,
  Youtube,
  Facebook,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Send,
  Wand2,
  FileText,
  Globe,
} from "lucide-react";

interface ContentVideo {
  id: string;
  title: string;
  subject: string;
  hook: string;
  script: any[];
  status: string;
  video_url: string;
  drive_url: string;
  duration_seconds: number;
  music_track: string;
  voice_id: string;
  orientation: string;
  platforms: Record<string, { posted: boolean; url: string; views: number }>;
  created_at: string;
  updated_at: string;
}

interface VideoIdea {
  title: string;
  hook: string;
  description: string;
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  scripted: { label: "Script Ready", color: "bg-blue-100 text-blue-700", icon: FileText },
  generating: { label: "Generating", color: "bg-purple-100 text-purple-700", icon: Loader2 },
  complete: { label: "Complete", color: "bg-green-100 text-green-700", icon: CheckCircle },
  error: { label: "Error", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Globe },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "linkedin", label: "LinkedIn", icon: Globe },
];

export default function ContentStudioPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<ContentVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // Idea generator
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);

  // Script builder
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
  const [script, setScript] = useState<any[]>([]);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [editingScript, setEditingScript] = useState(false);

  // Platform URL input
  const [editingPlatform, setEditingPlatform] = useState<{ videoId: string; platform: string } | null>(null);
  const [platformUrl, setPlatformUrl] = useState("");
  const [platformViews, setPlatformViews] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/content");
      if (res.status === 401 || res.status === 403) {
        setAuthorized(false);
      } else {
        const data = await res.json();
        setAuthorized(true);
        setVideos(data.videos || []);
      }
    } catch {
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const generateIdeas = async () => {
    if (!topic.trim()) return;
    setGeneratingIdeas(true);
    setIdeas([]);
    try {
      const res = await fetch("/api/admin/content/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.success) setIdeas(data.ideas || []);
    } catch (err) {
      console.error("Failed to generate ideas:", err);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const generateScript = async (idea: VideoIdea) => {
    setSelectedIdea(idea);
    setGeneratingScript(true);
    setScript([]);
    try {
      const res = await fetch("/api/admin/content/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: idea.title, hook: idea.hook, description: idea.description }),
      });
      const data = await res.json();
      if (data.success) {
        setScript(data.script || []);
        setEditingScript(true);
      }
    } catch (err) {
      console.error("Failed to generate script:", err);
    } finally {
      setGeneratingScript(false);
    }
  };

  const saveAndGenerate = async () => {
    if (!selectedIdea || script.length === 0) return;
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedIdea.title,
          subject: topic,
          hook: selectedIdea.hook,
          script,
          status: "scripted",
        }),
      });
      const data = await res.json();
      if (data.success && data.video) {
        setVideos([data.video, ...videos]);
        setSelectedIdea(null);
        setScript([]);
        setEditingScript(false);
        setIdeas([]);
        setTopic("");
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const triggerGeneration = async (videoId: string) => {
    try {
      await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      setVideos(videos.map(v => v.id === videoId ? { ...v, status: "generating" } : v));
    } catch (err) {
      console.error("Failed to trigger generation:", err);
    }
  };

  const updatePlatform = async (videoId: string, platform: string) => {
    try {
      const res = await fetch("/api/admin/content/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          platform,
          url: platformUrl,
          views: parseInt(platformViews) || 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.video) {
        setVideos(videos.map(v => v.id === videoId ? data.video : v));
      }
      setEditingPlatform(null);
      setPlatformUrl("");
      setPlatformViews("");
    } catch (err) {
      console.error("Failed to update platform:", err);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/content?id=${videoId}`, { method: "DELETE" });
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getTotalViews = (platforms: Record<string, any>) => {
    if (!platforms) return 0;
    return Object.values(platforms).reduce((sum: number, p: any) => sum + (p?.views || 0), 0);
  };

  if (loading) {
    return (<div className="min-h-screen bg-background"><Navigation /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>);
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background"><Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">This page is restricted to administrators.</p>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Studio</h1>
            <p className="text-muted-foreground mt-1">Generate, manage, and track short-form video content</p>
          </div>
        </div>

        {/* ═══ IDEA GENERATOR ═══ */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Generate Video Ideas
          </h2>
          <div className="flex gap-3">
            <Input
              placeholder="Enter a topic... e.g. 'listing photo mistakes', 'why agents need video', 'staging tips'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") generateIdeas(); }}
              className="flex-1 h-12"
            />
            <Button onClick={generateIdeas} disabled={generatingIdeas || !topic.trim()} className="h-12 px-6 bg-primary">
              {generatingIdeas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {generatingIdeas ? "Generating..." : "Generate Ideas"}
            </Button>
          </div>

          {/* Ideas */}
          {ideas.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Pick an idea to build a script:</p>
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => generateScript(idea)}
                  disabled={generatingScript}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedIdea?.title === idea.title
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <h3 className="font-bold text-foreground">{idea.title}</h3>
                  <p className="text-sm text-primary font-medium mt-0.5">{idea.hook}</p>
                  <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Script Preview */}
          {generatingScript && (
            <div className="mt-5 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Generating script...</p>
            </div>
          )}

          {editingScript && script.length > 0 && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Script Preview ({script.length} segments)</p>
                <p className="text-xs text-muted-foreground">~{script.length * 5}-{script.length * 7} seconds</p>
              </div>
              {script.map((seg: any, i: number) => (
                <div key={i} className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Segment {i + 1}</span>
                    <span className="text-xs text-muted-foreground">{seg.image_prompt?.slice(0, 60)}...</span>
                  </div>
                  <Textarea
                    value={seg.narration || ""}
                    onChange={(e) => {
                      const updated = [...script];
                      updated[i] = { ...updated[i], narration: e.target.value };
                      setScript(updated);
                    }}
                    rows={2}
                    className="text-sm"
                  />
                  <Input
                    value={seg.text_overlay || ""}
                    onChange={(e) => {
                      const updated = [...script];
                      updated[i] = { ...updated[i], text_overlay: e.target.value };
                      setScript(updated);
                    }}
                    placeholder="Text overlay (shown on screen)"
                    className="text-sm h-9"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <Button onClick={saveAndGenerate} className="bg-accent hover:bg-accent/90">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Script
                </Button>
                <Button variant="outline" onClick={() => { setEditingScript(false); setScript([]); setSelectedIdea(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ VIDEO ARCHIVE ═══ */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Archive ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
              No videos yet. Generate your first idea above.
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => {
                const statusInfo = STATUS_BADGES[video.status] || STATUS_BADGES.draft;
                const StatusIcon = statusInfo.icon;
                const totalViews = getTotalViews(video.platforms);

                return (
                  <div key={video.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-foreground truncate">{video.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.color}`}>
                              <StatusIcon className={`h-3 w-3 ${video.status === "generating" ? "animate-spin" : ""}`} />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{video.hook}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(video.created_at)}</span>
                            <span>{video.script?.length || 0} segments</span>
                            {totalViews > 0 && (
                              <span className="flex items-center gap-1 text-foreground font-semibold">
                                <Eye className="h-3 w-3" /> {totalViews.toLocaleString()} views
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {video.status === "scripted" && (
                            <Button size="sm" onClick={() => triggerGeneration(video.id)} className="bg-primary">
                              <Play className="mr-1 h-3.5 w-3.5" /> Generate
                            </Button>
                          )}
                          {video.drive_url && (
                            <Button asChild size="sm" variant="outline">
                              <a href={video.drive_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" /> View
                              </a>
                            </Button>
                          )}
                          <button onClick={() => deleteVideo(video.id)} className="p-2 text-muted-foreground hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Platform Tracking */}
                      {(video.status === "complete" || video.drive_url) && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Platform Distribution</p>
                          <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map(({ key, label, icon: PIcon }) => {
                              const pData = video.platforms?.[key];
                              const isPosted = pData?.posted;
                              const isEditing = editingPlatform?.videoId === video.id && editingPlatform?.platform === key;

                              return (
                                <div key={key} className="relative">
                                  <button
                                    onClick={() => {
                                      if (isEditing) {
                                        setEditingPlatform(null);
                                      } else {
                                        setEditingPlatform({ videoId: video.id, platform: key });
                                        setPlatformUrl(pData?.url || "");
                                        setPlatformViews(String(pData?.views || ""));
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                      isPosted
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-border text-muted-foreground hover:border-primary/40"
                                    }`}
                                  >
                                    <PIcon className="h-3.5 w-3.5" />
                                    {label}
                                    {isPosted && pData?.views > 0 && (
                                      <span className="ml-1">{pData.views.toLocaleString()}</span>
                                    )}
                                  </button>

                                  {isEditing && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-card rounded-lg border border-border shadow-lg p-3 z-50 space-y-2">
                                      <Input
                                        placeholder="Post URL"
                                        value={platformUrl}
                                        onChange={(e) => setPlatformUrl(e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                      <Input
                                        placeholder="View count"
                                        type="number"
                                        value={platformViews}
                                        onChange={(e) => setPlatformViews(e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => updatePlatform(video.id, key)} className="h-7 text-xs flex-1">
                                          Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingPlatform(null)} className="h-7 text-xs">
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
