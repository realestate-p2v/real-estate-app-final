"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getClipPlaybackUrl, isCloudinaryUrl, isDriveUrl } from "@/components/video-player";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Camera,
  Trash2,
  RefreshCw,
  Play,
  Send,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface ClipData {
  position: number;
  clip_file: string;
  // Old Drive format
  drive_url: string;
  file_id: string;
  // New Cloudinary format
  url: string;
  cloudinary_public_id: string;
  // Shared fields
  description: string;
  photo_url: string;
  camera_direction: string;
  camera_speed: string;
}

interface RevisionClip {
  position: number;
  original_position: number;
  file_id: string;
  playback_url: string;
  description: string;
  action: "keep" | "revise" | "remove";
  camera_direction: string;
  camera_speed: string;
  custom_motion: string;
  problem_description: string;
}

const DIRECTIONS = [
  { key: "push_in", label: "Fwd" },
  { key: "pull_back", label: "Back" },
  { key: "diagonal_top_left", label: "Fwd + L" },
  { key: "diagonal_top_right", label: "Fwd + R" },
  { key: "diagonal_bottom_left", label: "Back + L" },
  { key: "diagonal_bottom_right", label: "Back + R" },
  { key: "tilt_up", label: "Look Up" },
  { key: "tilt_down", label: "Look Down" },
  { key: "orbit_left", label: "Orbit L" },
  { key: "orbit_right", label: "Orbit R" },
  { key: "rise", label: "Rise" },
  { key: "bring_to_life", label: "✨ Bring to Life" },
];

const SPEEDS = [
  { key: "slow", label: "Slow" },
  { key: "medium", label: "Med" },
];

// ── Clip Preview Component ──
// Handles both Cloudinary URLs and Drive file IDs
function ClipPreview({ clip, isRemoved }: { clip: RevisionClip; isRemoved: boolean }) {
  const url = clip.playback_url;

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Play className="h-6 w-6 text-white/40" />
      </div>
    );
  }

  // Cloudinary or direct URL: use native video
  if (isCloudinaryUrl(url) || !isDriveUrl(url)) {
    return (
      <>
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {isRemoved && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
        )}
      </>
    );
  }

  // Drive URL: extract file ID for iframe
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : clip.file_id;

  if (fileId) {
    return (
      <>
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
        {isRemoved && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Play className="h-6 w-6 text-white/40" />
    </div>
  );
}

export default function DashboardRevisionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<RevisionClip[]>([]);
  const [originalClips, setOriginalClips] = useState<ClipData[]>([]);
  const [revisionCount, setRevisionCount] = useState(0);
  const [revisionsAllowed, setRevisionsAllowed] = useState(1);
  const [resolution, setResolution] = useState("768P");
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClips, setNoClips] = useState(false);
  const [expandedClip, setExpandedClip] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      setError("Payment was cancelled. You can try submitting your revision again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (orderId) fetchRevisionData();
  }, [orderId]);

  const fetchRevisionData = async () => {
    try {
      const res = await fetch(`/api/revisions?orderId=${orderId}`);
      if (res.status === 401) {
        router.push(`/login?redirect=/dashboard/video/${orderId}/revise`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRevisionCount(data.revisionCount);
        setRevisionsAllowed(data.revisionsAllowed);
        setResolution(data.resolution);
        setOriginalClips(data.clipUrls || []);

        if (!data.clipUrls || data.clipUrls.length === 0) {
          setNoClips(true);
        } else {
          setClips(
            data.clipUrls.map((clip: ClipData) => ({
              position: clip.position,
              original_position: clip.position,
              file_id: clip.file_id || "",
              playback_url: getClipPlaybackUrl(clip) || "",
              description: clip.description || `Clip ${clip.position}`,
              action: "keep" as const,
              camera_direction: clip.camera_direction || "",
              camera_speed: clip.camera_speed || "",
              custom_motion: "",
              problem_description: "",
            }))
          );
        }
      } else {
        setError(data.error || "Failed to load revision data");
      }
    } catch (err) {
      setError("Failed to load revision data");
    } finally {
      setLoading(false);
    }
  };

  const nextRevisionNumber = revisionCount + 1;
  const isFree = nextRevisionNumber <= revisionsAllowed;
  const revisedClips = clips.filter((c) => c.action === "revise" || c.action === "remove");
  const activeClips = clips.filter((c) => c.action !== "remove");

  const getRevisionCost = () => {
    if (isFree) return 0;
    const count = revisedClips.filter((c) => c.action === "revise").length;
    if (count === 0) return 0;
    const is1080 = resolution === "1080P";
    let perClip;
    if (count === 1) perClip = is1080 ? 2.49 : 1.99;
    else if (count <= 5) perClip = is1080 ? 1.99 : 1.49;
    else if (count <= 15) perClip = is1080 ? 1.74 : 1.24;
    else perClip = is1080 ? 1.49 : 0.99;
    return Math.round(count * perClip * 100) / 100;
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newClips = [...clips];
      const [moved] = newClips.splice(draggedIndex, 1);
      newClips.splice(dragOverIndex, 0, moved);
      setClips(newClips.map((c, i) => ({ ...c, position: i + 1 })));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveClip = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= clips.length) return;
    const newClips = [...clips];
    [newClips[index], newClips[newIndex]] = [newClips[newIndex], newClips[index]];
    setClips(newClips.map((c, i) => ({ ...c, position: i + 1 })));
  };

  const toggleRevise = (index: number) => {
    setClips(clips.map((c, i) => i === index ? { ...c, action: c.action === "revise" ? "keep" : "revise" } : c));
    if (clips[index].action !== "revise") setExpandedClip(index);
  };

  const removeClip = (index: number) => {
    setClips(clips.map((c, i) => i === index ? { ...c, action: c.action === "remove" ? "keep" : "remove" } : c));
  };

  const handleSubmit = async () => {
    const changedClips = clips.filter((c) => c.action === "revise" || c.action === "remove");
    if (changedClips.length === 0) {
      setError("Please mark at least one clip for revision or removal");
      return;
    }

    setSubmitting(true);
    setError(null);

    const clipPayload = changedClips.map((c) => ({
      position: c.original_position,
      camera_direction: c.camera_direction,
      camera_speed: c.camera_speed,
      custom_motion: c.custom_motion,
      problem_description: c.problem_description,
      action: c.action,
    }));

    // PAID revision → Stripe checkout
    if (!isFree && revisedClips.filter((c) => c.action === "revise").length > 0) {
      try {
        const res = await fetch("/api/revisions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, clips: clipPayload, notes: generalNotes }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          window.location.href = data.url;
          return;
        } else {
          setError(data.error || "Failed to create payment session.");
          setSubmitting(false);
        }
      } catch (err) {
        setError("Failed to connect to payment service.");
        setSubmitting(false);
      }
      return;
    }

    // FREE revision → submit directly via authenticated endpoint
    try {
      const res = await fetch("/api/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, clips: clipPayload, notes: generalNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else if (data.requiresPayment) {
        setError(data.message + " Redirecting to payment...");
        setTimeout(async () => {
          try {
            const checkoutRes = await fetch("/api/revisions/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, clips: clipPayload, notes: generalNotes }),
            });
            const checkoutData = await checkoutRes.json();
            if (checkoutData.success && checkoutData.url) window.location.href = checkoutData.url;
          } catch { /* keep error visible */ }
        }, 1500);
      } else {
        setError(data.error || "Failed to submit revision");
      }
    } catch (err) {
      setError("Failed to submit revision");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (<div className="min-h-screen bg-background"><Navigation /><div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>);
  }

  if (submitted) {
    return (<div className="min-h-screen bg-background"><Navigation /><div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4"><CheckCircle className="h-16 w-16 text-green-500 mx-auto" /><h1 className="text-2xl font-bold text-foreground">Revision Submitted!</h1><p className="text-muted-foreground">We've received your revision request and will process it within 24 hours. You'll receive an email when your updated video is ready.</p><div className="flex gap-3 justify-center"><Button asChild><Link href="/dashboard/videos">Back to My Videos</Link></Button></div></div></div>);
  }

  if (noClips) {
    return (<div className="min-h-screen bg-background"><Navigation /><div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4"><AlertCircle className="h-12 w-12 text-amber-500 mx-auto" /><h1 className="text-2xl font-bold text-foreground">Clips Not Available</h1><p className="text-muted-foreground">Individual clip data is not available for this order. Please contact support to request a revision.</p><Button asChild><Link href="/support">Contact Support</Link></Button></div></div>);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/videos" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Request Revision</h1>
            <p className="text-sm text-muted-foreground">
              Revision {nextRevisionNumber} of{" "}
              {isFree ? (<span className="text-green-600 font-semibold">{revisionsAllowed} free included</span>) : (<span className="text-amber-600 font-semibold">paid revision</span>)}{" "}
              · ~24hr turnaround
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl border border-border p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> Watch each clip below. Mark clips you want changed, describe the issue, and pick a new camera direction. You can also drag to reorder clips or remove them entirely. Unchanged clips will stay exactly as they are.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-red-400" /></button>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {clips.map((clip, index) => {
            const isRemoved = clip.action === "remove";
            const isRevising = clip.action === "revise";
            return (
              <div key={`${clip.original_position}-${index}`} draggable={!isRemoved}
                onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={handleDrop}
                className={`bg-card rounded-xl border overflow-hidden transition-all ${isRemoved ? "border-red-200 opacity-50" : isRevising ? "border-amber-400 ring-1 ring-amber-200" : dragOverIndex === index ? "border-primary border-2" : "border-border"} ${draggedIndex === index ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-3 p-3">
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                    <button onClick={() => moveClip(index, "up")} disabled={index === 0} className={`p-0.5 ${index === 0 ? "text-muted-foreground/20" : "hover:bg-muted rounded"}`}><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveClip(index, "down")} disabled={index === clips.length - 1} className={`p-0.5 ${index === clips.length - 1 ? "text-muted-foreground/20" : "hover:bg-muted rounded"}`}><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isRemoved ? "bg-red-100 text-red-500 line-through" : isRevising ? "bg-amber-100 text-amber-700" : "bg-primary text-primary-foreground"}`}>{index + 1}</div>

                  {/* Clip preview — universal player */}
                  <div className="w-64 h-[144px] sm:w-80 sm:h-[180px] rounded-lg overflow-hidden flex-shrink-0 bg-black relative">
                    <ClipPreview clip={clip} isRemoved={isRemoved} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{clip.description || `Clip ${clip.original_position}`}</p>
                    <p className="text-xs text-muted-foreground">{clip.camera_direction || "Auto"} · {clip.camera_speed || "Default"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleRevise(index)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isRevising ? "bg-amber-100 border-amber-300 text-amber-700" : "border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700"}`}><RefreshCw className="h-3 w-3 inline mr-1" />Revise</button>
                    <button onClick={() => removeClip(index)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${isRemoved ? "bg-red-100 border-red-300 text-red-700" : "border-border text-muted-foreground hover:border-red-300 hover:text-red-600"}`}><Trash2 className="h-3 w-3 inline mr-1" />{isRemoved ? "Restore" : "Remove"}</button>
                  </div>
                </div>
                {isRevising && (
                  <div className="border-t border-border p-4 bg-amber-50/30 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">New camera direction:</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_direction: "", custom_motion: "" } : c))} className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${!clip.camera_direction && !clip.custom_motion ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border hover:bg-muted"}`}>🤖 Auto</button>
                        {DIRECTIONS.map((d) => (<button key={d.key} onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_direction: d.key, custom_motion: "" } : c))} className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${clip.camera_direction === d.key ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border hover:bg-muted"}`}>{d.label}</button>))}
                      </div>
                    </div>
                    {clip.camera_direction !== "bring_to_life" && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Speed:</p>
                        <div className="flex gap-1.5">
                          {SPEEDS.map((s) => (<button key={s.key} onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_speed: s.key } : c))} className={`text-xs py-1.5 px-4 rounded-lg border transition-all ${clip.camera_speed === s.key ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border hover:bg-muted"}`}>{s.label}</button>))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">{clip.camera_direction === "bring_to_life" ? "Describe the action (warm, friendly actions work best):" : "Or describe your own camera movement:"}</p>
                      <Input value={clip.custom_motion || ""} onChange={(e) => setClips(clips.map((c, i) => i === index ? { ...c, custom_motion: e.target.value, camera_direction: e.target.value ? "" : c.camera_direction } : c))} placeholder={clip.camera_direction === "bring_to_life" ? "e.g. Agent waves warmly at camera and smiles" : "e.g. Slowly zoom into the fireplace then pan right"} maxLength={80} className="text-sm h-9" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Describe the problem & what you want:</p>
                      <Textarea value={clip.problem_description} onChange={(e) => setClips(clips.map((c, i) => i === index ? { ...c, problem_description: e.target.value } : c))} placeholder="e.g., Camera moves too fast to the right. I'd prefer a slow push-in toward the fireplace." rows={2} className="text-sm" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-sm font-semibold text-foreground mb-2">Additional Notes (optional)</p>
          <Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} placeholder="Any general feedback or requests for the overall video..." rows={3} className="text-sm" />
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-foreground">Revision Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-black text-foreground">{activeClips.length}</div><div className="text-xs text-muted-foreground">Clips in video</div></div>
            <div><div className="text-2xl font-black text-amber-600">{revisedClips.filter(c => c.action === "revise").length}</div><div className="text-xs text-muted-foreground">Clips to revise</div></div>
            <div><div className="text-2xl font-black text-red-500">{revisedClips.filter(c => c.action === "remove").length}</div><div className="text-xs text-muted-foreground">Clips to remove</div></div>
          </div>

          {!isFree && revisedClips.filter(c => c.action === "revise").length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <p className="font-semibold text-amber-800">Paid Revision — ${getRevisionCost().toFixed(2)}</p>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                Your {revisionsAllowed} free revision{revisionsAllowed !== 1 ? "s have" : " has"} been used. This revision costs ${getRevisionCost().toFixed(2)} for {revisedClips.filter(c => c.action === "revise").length} clip(s). Removals and reordering are always free.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-amber-700">
                <CreditCard className="h-3.5 w-3.5" />
                <span>You'll be redirected to a secure Stripe checkout to complete payment.</span>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting || revisedClips.length === 0}
            className={`w-full py-5 text-lg ${!isFree && revisedClips.filter(c => c.action === "revise").length > 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-accent hover:bg-accent/90"}`}>
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {!isFree ? "Redirecting to payment..." : "Submitting..."}</>
            ) : isFree ? (
              <><Send className="h-5 w-5 mr-2" />Submit Revision (Free)</>
            ) : revisedClips.filter(c => c.action === "revise").length > 0 ? (
              <><CreditCard className="h-5 w-5 mr-2" />Pay ${getRevisionCost().toFixed(2)} & Submit Revision</>
            ) : (
              <><Send className="h-5 w-5 mr-2" />Submit Changes (Free — removals/reorder only)</>
            )}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
