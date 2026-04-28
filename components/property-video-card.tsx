// components/property-video-card.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAccent } from "@/components/dashboard-shell";
import { getClipPlaybackUrl, isCloudinaryUrl, isDriveUrl } from "@/components/video-player";
import {
  Loader2, CheckCircle, AlertCircle, GripVertical, ChevronUp, ChevronDown, X,
  Trash2, RefreshCw, Play, Send, DollarSign, CreditCard, Plus, ExternalLink,
  Download, Film, Pencil, Sparkles, Check,
} from "lucide-react";

/* ─── Constants ─────────────────────────────────────────────── */

const NEW_CLIP_PRICE = 4;

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

/* ─── Types ─────────────────────────────────────────────────── */

interface ClipData {
  position: number;
  clip_file?: string;
  drive_url?: string;
  file_id?: string;
  url?: string;
  cloudinary_public_id?: string;
  description?: string;
  photo_url?: string;
  camera_direction?: string;
  camera_speed?: string;
}

interface RevisionClip {
  position: number;
  original_position: number;
  file_id: string;
  playback_url: string;
  photo_url: string;
  description: string;
  action: "keep" | "revise" | "remove" | "new";
  camera_direction: string;
  camera_speed: string;
  custom_motion: string;
  problem_description: string;
  is_new: boolean;
  uploaded_file?: File;
  uploaded_preview?: string;
}

type VideoState = "processing" | "awaiting_review" | "editing" | "accepted";

interface PropertyVideoCardProps {
  order: any;
  isEditing: boolean;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onAccepted: () => void;
  onChangesSubmitted: () => void;
}

/* ─── Helper ────────────────────────────────────────────────── */

function getVideoState(order: any, isEditing: boolean): VideoState {
  if (isEditing) return "editing";
  if (order.approved_at) return "accepted";
  if (order.awaiting_approval_at || order.delivered_at) return "awaiting_review";
  return "processing";
}

/* ─── Clip preview ──────────────────────────────────────────── */

function ClipPreview({ clip, isRemoved }: { clip: RevisionClip; isRemoved: boolean }) {
  const url = clip.playback_url;
  const posterUrl = clip.uploaded_preview || clip.photo_url || undefined;

  if (clip.is_new && posterUrl) {
    return (
      <>
        <img src={posterUrl} alt={clip.description} className="w-full h-full object-cover" />
        {isRemoved && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
        )}
      </>
    );
  }

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {posterUrl ? (
          <img src={posterUrl} alt={clip.description} className="w-full h-full object-cover" />
        ) : (
          <Play className="h-6 w-6 text-white/40" />
        )}
      </div>
    );
  }

  if (isCloudinaryUrl(url) || !isDriveUrl(url)) {
    return (
      <>
        <video src={url} controls playsInline preload="metadata" poster={posterUrl} className="w-full h-full object-cover" />
        {isRemoved && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
        )}
      </>
    );
  }

  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : clip.file_id;

  if (fileId) {
    return (
      <>
        <iframe src={`https://drive.google.com/file/d/${fileId}/preview`} className="w-full h-full" allow="autoplay" />
        {isRemoved && (
          <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
        )}
      </>
    );
  }

  return <div className="w-full h-full flex items-center justify-center"><Play className="h-6 w-6 text-white/40" /></div>;
}

/* ═══════════════════════════════════════════════════════════════
   Main component — three-state property video card
   ═══════════════════════════════════════════════════════════════ */

export default function PropertyVideoCard({
  order,
  isEditing,
  onEnterEdit,
  onCancelEdit,
  onAccepted,
  onChangesSubmitted,
}: PropertyVideoCardProps) {
  const a = useAccent();
  const state = getVideoState(order, isEditing);
  const orderId = order.order_id || order.id;

  /* Shared state */
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  /* Editing state — only used when state === "editing" */
  const [clips, setClips] = useState<RevisionClip[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  /* Load revision data once when entering edit mode */
  useEffect(() => {
    if (!isEditing || editLoaded) return;
    const fetchData = async () => {
      setEditLoading(true);
      try {
        // Admin check
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
        if (user?.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
          setAdminEmail(user.email);
        }

        const res = await fetch(`/api/video/${orderId}/revise`);
        if (!res.ok) {
          setError("Order not found");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setRevisionCount(data.revisionCount);
          setRevisionsAllowed(data.revisionsAllowed);
          setResolution(data.resolution);
          if (!data.clipUrls || data.clipUrls.length === 0) {
            setNoClips(true);
          } else {
            setClips(
              data.clipUrls.map((clip: ClipData) => ({
                position: clip.position,
                original_position: clip.position,
                file_id: clip.file_id || "",
                playback_url: getClipPlaybackUrl(clip) || "",
                photo_url: clip.photo_url || "",
                description: clip.description || `Clip ${clip.position}`,
                action: "keep" as const,
                camera_direction: clip.camera_direction || "",
                camera_speed: clip.camera_speed || "",
                custom_motion: "",
                problem_description: "",
                is_new: false,
              }))
            );
          }
        } else {
          setError(data.error || "Failed to load revision data");
        }
      } catch {
        setError("Failed to load revision data");
      } finally {
        setEditLoading(false);
        setEditLoaded(true);
      }
    };
    fetchData();
  }, [isEditing, editLoaded, orderId]);

  /* Derived edit values */
  const nextRevisionNumber = revisionCount + 1;
  const isFree = nextRevisionNumber <= revisionsAllowed;
  const revisedClips = clips.filter((c) => c.action === "revise" || c.action === "remove");
  const newClips = clips.filter((c) => c.is_new);
  const activeClips = clips.filter((c) => c.action !== "remove");
  const isReorderOnly = (() => {
    const existingClips = clips.filter((c) => !c.is_new && c.action !== "remove");
    const originalOrder = existingClips.map((c) => c.original_position);
    return originalOrder.some((pos, i) => i > 0 && pos < originalOrder[i - 1]);
  })();
  const hasChanges = revisedClips.length > 0 || newClips.length > 0 || isReorderOnly;

  const getRevisionCost = () => {
    let total = 0;
    total += newClips.length * NEW_CLIP_PRICE;
    if (!isFree) {
      const count = revisedClips.filter((c) => c.action === "revise").length;
      if (count > 0) {
        const is1080 = resolution === "1080P";
        let perClip;
        if (count === 1) perClip = is1080 ? 2.49 : 1.99;
        else if (count <= 5) perClip = is1080 ? 1.99 : 1.49;
        else if (count <= 15) perClip = is1080 ? 1.74 : 1.24;
        else perClip = is1080 ? 1.49 : 0.99;
        total += Math.round(count * perClip * 100) / 100;
      }
    }
    return Math.round(total * 100) / 100;
  };

  const getRevisionCostBreakdown = () => {
    const reviseCount = revisedClips.filter((c) => c.action === "revise").length;
    const newCount = newClips.length;
    let reviseCost = 0;
    const newCost = Math.round(newCount * NEW_CLIP_PRICE * 100) / 100;
    if (!isFree && reviseCount > 0) {
      const is1080 = resolution === "1080P";
      let perClip;
      if (reviseCount === 1) perClip = is1080 ? 2.49 : 1.99;
      else if (reviseCount <= 5) perClip = is1080 ? 1.99 : 1.49;
      else if (reviseCount <= 15) perClip = is1080 ? 1.74 : 1.24;
      else perClip = is1080 ? 1.49 : 0.99;
      reviseCost = Math.round(reviseCount * perClip * 100) / 100;
    }
    return { reviseCount, reviseCost, newCount, newCost };
  };

  const totalCost = getRevisionCost();
  const needsPayment = !isAdmin && totalCost > 0;

  /* Drag & drop / reorder */
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updated = [...clips];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(dragOverIndex, 0, moved);
      setClips(updated.map((c, i) => ({ ...c, position: i + 1 })));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const moveClip = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= clips.length) return;
    const updated = [...clips];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setClips(updated.map((c, i) => ({ ...c, position: i + 1 })));
  };

  /* Clip actions */
  const toggleEdit = (index: number) => {
    setClips(clips.map((c, i) => i === index ? { ...c, action: c.action === "revise" ? "keep" : "revise" } : c));
    if (clips[index].action !== "revise") setExpandedClip(index);
  };

  const removeClip = (index: number) => {
    const clip = clips[index];
    if (clip.is_new) {
      if (clip.uploaded_preview) URL.revokeObjectURL(clip.uploaded_preview);
      const updated = clips.filter((_, i) => i !== index);
      setClips(updated.map((c, i) => ({ ...c, position: i + 1 })));
      return;
    }
    setClips(clips.map((c, i) => i === index ? { ...c, action: c.action === "remove" ? "keep" : "remove" } : c));
  };

  const triggerAddClip = (afterIndex: number) => {
    setAddingAtIndex(afterIndex);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || addingAtIndex === null) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP)");
      e.target.value = "";
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB");
      e.target.value = "";
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const insertAt = addingAtIndex + 1;
    const newClip: RevisionClip = {
      position: insertAt,
      original_position: -1,
      file_id: "",
      playback_url: "",
      photo_url: "",
      description: file.name.replace(/\.[^/.]+$/, ""),
      action: "new",
      camera_direction: "",
      camera_speed: "",
      custom_motion: "",
      problem_description: "",
      is_new: true,
      uploaded_file: file,
      uploaded_preview: previewUrl,
    };
    const updated = [...clips];
    updated.splice(insertAt, 0, newClip);
    setClips(updated.map((c, i) => ({ ...c, position: i + 1 })));
    setExpandedClip(insertAt);
    setAddingAtIndex(null);
    e.target.value = "";
  };

  /* Submit changes (preserves the existing revision page submit logic) */
  const handleSubmit = async () => {
    if (!hasChanges) {
      setError("No changes to submit. Reorder clips, mark clips for editing/removal, or add new clips.");
      return;
    }
    for (const clip of newClips) {
      if (!clip.uploaded_file) {
        setError("All new clips must have a photo uploaded");
        return;
      }
    }
    setSubmitting(true);
    setError(null);

    let newClipPayloads: { position: number; photo_url: string; camera_direction: string; camera_speed: string; custom_motion: string; description: string }[] = [];
    if (newClips.length > 0) {
      try {
        for (const clip of newClips) {
          if (!clip.uploaded_file) continue;
          const sigRes = await fetch("/api/cloudinary-signature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder: "photo2video/revision-clips" }),
          });
          const sigData = await sigRes.json();
          if (!sigData.success) {
            setError(`Upload failed for "${clip.description}": could not get upload credentials.`);
            setSubmitting(false);
            return;
          }
          const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
          const resizedBlob = await new Promise<Blob>((resolve) => {
            const img = document.createElement("img");
            img.onload = () => {
              const canvas = document.createElement("canvas");
              let { width, height } = img;
              const maxDim = 1920;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height / width) * maxDim);
                  width = maxDim;
                } else {
                  width = Math.round((width / height) * maxDim);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => resolve(blob || clip.uploaded_file!), "image/jpeg", 0.85);
              URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(clip.uploaded_file!);
          });
          const formData = new FormData();
          formData.append("file", resizedBlob, clip.uploaded_file.name);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", folder);
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: formData });
          const result = await uploadRes.json();
          if (!result.secure_url) {
            setError(`Failed to upload photo for "${clip.description}": ${result.error?.message || "Unknown error"}`);
            setSubmitting(false);
            return;
          }
          newClipPayloads.push({
            position: clip.position,
            photo_url: result.secure_url,
            camera_direction: clip.camera_direction,
            camera_speed: clip.camera_speed,
            custom_motion: clip.custom_motion,
            description: clip.description,
          });
        }
      } catch {
        setError("Failed to upload new clip photos. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const changedClips = clips.filter((c) => c.action === "revise" || c.action === "remove");
    const clipPayload = changedClips.map((c) => ({
      position: c.original_position,
      camera_direction: c.camera_direction,
      camera_speed: c.camera_speed,
      custom_motion: c.custom_motion,
      problem_description: c.problem_description,
      action: c.action,
    }));
    const sequencePayload = clips
      .filter((c) => c.action !== "remove")
      .map((c, i) => ({
        original_position: c.original_position,
        new_position: i + 1,
        is_new: c.is_new,
      }));
    const payload = { orderId, clips: clipPayload, notes: generalNotes, sequence: sequencePayload, newClips: newClipPayloads };

    if (needsPayment) {
      try {
        const res = await fetch("/api/revisions/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.url) {
          window.location.href = data.url;
          return;
        } else if (data.isFree) {
          // fall through to direct submit
        } else {
          setError(data.error || "Failed to create payment session.");
          setSubmitting(false);
          return;
        }
      } catch {
        setError("Failed to connect to payment service.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/video/${orderId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: clipPayload.length > 0 ? clipPayload : [],
          notes: generalNotes,
          sequence: sequencePayload,
          newClips: newClipPayloads,
          adminBypass: isAdmin || undefined,
          adminEmail: isAdmin ? adminEmail : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onChangesSubmitted();
        }, 2000);
      } else if (data.requiresPayment) {
        setError(data.message + " Redirecting to payment...");
        setTimeout(async () => {
          try {
            const checkoutRes = await fetch("/api/revisions/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const checkoutData = await checkoutRes.json();
            if (checkoutData.success && checkoutData.url) {
              window.location.href = checkoutData.url;
            }
          } catch {}
        }, 1500);
      } else {
        setError(data.error || "Failed to submit changes");
      }
    } catch {
      setError("Failed to submit changes");
    } finally {
      setSubmitting(false);
    }
  };

  /* Accept video — sets approved_at on the order */
  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { error: updateError } = await supabase
        .from("orders")
        .update({ approved_at: new Date().toISOString() })
        .eq("id", order.id);
      if (updateError) {
        setAcceptError("Could not accept video. Please try again.");
        setAccepting(false);
        return;
      }
      onAccepted();
    } catch {
      setAcceptError("Could not accept video. Please try again.");
      setAccepting(false);
    }
  };

  /* Status badge for top bar */
  const sc: Record<string, string> = {
    delivered: "text-green-300 bg-green-400/15 ring-green-400/30",
    complete: "text-green-300 bg-green-400/15 ring-green-400/30",
    processing: "text-amber-300 bg-amber-400/15 ring-amber-400/30",
    new: "text-blue-300 bg-blue-400/15 ring-blue-400/30",
    pending_payment: "text-white/60 bg-white/10 ring-white/20",
  };

  const versions: { url: string; label: string; isBranded: boolean }[] = [];
  if (order.delivery_url) versions.push({ url: order.delivery_url, label: "Branded", isBranded: true });
  if (order.unbranded_delivery_url) versions.push({ url: order.unbranded_delivery_url, label: "Unbranded", isBranded: false });

  /* ─── Render ────────────────────────────────────────────── */

  return (
    <div className={`rounded-xl bg-white/[0.03] border overflow-hidden ${
      state === "awaiting_review" ? "border-cyan-400/30 ring-1 ring-cyan-400/20" : "border-white/[0.06]"
    }`}>
      {/* Hidden file input for new clip uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Top bar — common to all states */}
      <div className="p-4 flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-white">
              {order.is_quick_video ? "Quick Video" : order.listing_package_label || "Listing Video"}
            </p>
            {state === "awaiting_review" && (
              <span className="text-xs font-bold text-cyan-300 bg-cyan-400/15 ring-1 ring-cyan-400/30 px-2 py-0.5 rounded-full">
                ● Ready for review
              </span>
            )}
            {state === "accepted" && (
              <span className="text-xs font-bold text-green-300 bg-green-400/15 ring-1 ring-green-400/30 px-2 py-0.5 rounded-full">
                ✓ Accepted
              </span>
            )}
            {state === "editing" && (
              <span className="text-xs font-bold text-amber-300 bg-amber-400/15 ring-1 ring-amber-400/30 px-2 py-0.5 rounded-full">
                Editing
              </span>
            )}
            {state === "processing" && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ring-1 capitalize ${sc[order.status] || sc.pending_payment}`}>
                {order.status?.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 mt-1">
            {order.photo_count} photos · {order.orientation} · {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        {state === "accepted" && order.delivery_url && (
          <Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold">
            <Link href={`/video/${orderId}`}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Share</Link>
          </Button>
        )}
      </div>

      {/* ═════════ STATE: Awaiting Review ═════════ */}
      {state === "awaiting_review" && (
        <div className="p-4 space-y-4">
          {versions.length > 0 ? (
            <div className={versions.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
              {versions.map(v => (
                <div key={v.label} className="space-y-2">
                  {versions.length > 1 && (
                    <p className={`text-xs font-bold ${v.isBranded ? a.textLight : "text-white/60"}`}>
                      {v.isBranded ? "🎨 Branded" : "📎 Unbranded"}
                    </p>
                  )}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={v.url} controls playsInline preload="metadata" className="w-full h-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            </div>
          )}

          <div className="rounded-xl bg-cyan-400/[0.06] border border-cyan-400/20 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-cyan-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Your video is ready</p>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Watch the video, then accept it or request changes. You have 1 free re-render of existing clips. Adding new clips is $4 each.
                </p>
              </div>
            </div>
          </div>

          {acceptError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{acceptError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold"
            >
              {accepting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Accepting...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />Looks great — Accept video</>
              )}
            </Button>
            <Button
              onClick={onEnterEdit}
              className="flex-1 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
            >
              <Pencil className="h-4 w-4 mr-2" />Make changes
            </Button>
          </div>
        </div>
      )}

      {/* ═════════ STATE: Accepted ═════════ */}
      {state === "accepted" && (
        <div className="p-4 space-y-3">
          {versions.length > 0 && (
            <div className={versions.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
              {versions.map(v => (
                <div key={v.label} className="space-y-2">
                  {versions.length > 1 && (
                    <p className={`text-xs font-bold ${v.isBranded ? a.textLight : "text-white/60"}`}>
                      {v.isBranded ? "🎨 Branded" : "📎 Unbranded"}
                    </p>
                  )}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={v.url} controls playsInline preload="metadata" className="w-full h-full" />
                  </div>
                  <a
                    href={v.url.includes("/upload/") ? v.url.replace("/upload/", "/upload/fl_attachment/") : v.url}
                    download
                    className="inline-flex items-center gap-1 text-sm font-semibold text-white/60 hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />Download {v.label}
                  </a>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={onEnterEdit}
              size="sm"
              className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add or edit clips
            </Button>
          </div>
        </div>
      )}

      {/* ═════════ STATE: Processing ═════════ */}
      {state === "processing" && (
        <div className="p-4">
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/40 mx-auto mb-2" />
              <p className="text-sm text-white/60">Your video is being created...</p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ STATE: Editing ═════════ */}
      {state === "editing" && (
        <div className="p-4">
          {editLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            </div>
          )}

          {!editLoading && submitted && (
            <div className="text-center py-10 space-y-3">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Changes Submitted!</h3>
              <p className="text-sm text-white/60">
                We've received your changes and will process them within 24 hours.
              </p>
            </div>
          )}

          {!editLoading && !submitted && noClips && (
            <div className="text-center py-10 space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Clips Not Available</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Individual clip data is not available for this order. This may be because it was processed before our clip preview feature was added. Please contact support.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button asChild size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold">
                  <Link href="/support">Contact Support</Link>
                </Button>
                <Button onClick={onCancelEdit} size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!editLoading && !submitted && !noClips && (
            <>
              {/* Header bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-white">Make changes</p>
                  <p className="text-xs text-white/55 mt-0.5">
                    Revision {nextRevisionNumber} ·{" "}
                    {isFree ? (
                      <span className="text-green-300 font-semibold">Free re-render of existing clips</span>
                    ) : (
                      <span className="text-amber-300 font-semibold">Paid revision</span>
                    )}{" "}
                    · New clips $4 each · ~24hr turnaround
                  </p>
                </div>
                <Button onClick={onCancelEdit} size="sm" className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold">
                  Cancel
                </Button>
              </div>

              {/* Instructions */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-4">
                <p className="text-xs text-white/65 leading-relaxed">
                  <strong className="text-white">How it works:</strong> Watch each clip below. Mark clips you want changed, describe the issue, and pick a new camera direction. Drag to reorder, remove clips you don't want, or add new clips ($4 each). Unchanged clips stay exactly as they are.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 flex-1">{error}</p>
                  <button onClick={() => setError(null)}>
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              )}

              {/* Add-clip-at-top */}
              <button
                onClick={() => triggerAddClip(-1)}
                className="w-full py-3 mb-3 border-2 border-dashed border-green-400/30 bg-green-400/[0.04] rounded-xl text-sm font-semibold text-green-300 hover:border-green-400/60 hover:bg-green-400/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add new clip · $4 each
              </button>

              {/* Clip list */}
              <div className="space-y-3 mb-5">
                {clips.map((clip, index) => {
                  const isRemoved = clip.action === "remove";
                  const isRevising = clip.action === "revise";
                  const isNew = clip.is_new;
                  return (
                    <div key={`clip-${clip.original_position}-${index}-${clip.is_new ? "new" : "existing"}`}>
                      <div
                        draggable={!isRemoved}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          isNew
                            ? "border-green-400/40 ring-1 ring-green-400/15 bg-green-400/[0.03]"
                            : isRemoved
                            ? "border-red-400/30 opacity-60 bg-white/[0.02]"
                            : isRevising
                            ? "border-amber-400/40 ring-1 ring-amber-400/15 bg-amber-400/[0.03]"
                            : dragOverIndex === index
                            ? "border-cyan-400/50 border-2 bg-white/[0.03]"
                            : "border-white/[0.06] bg-white/[0.02]"
                        } ${draggedIndex === index ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Drag handle + reorder */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <GripVertical className="h-4 w-4 text-white/30 cursor-grab" />
                            <button
                              onClick={() => moveClip(index, "up")}
                              disabled={index === 0}
                              className={`p-1 rounded-md transition-colors ${index === 0 ? "text-white/15" : "text-white/50 hover:bg-white/[0.06] hover:text-white"}`}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveClip(index, "down")}
                              disabled={index === clips.length - 1}
                              className={`p-1 rounded-md transition-colors ${index === clips.length - 1 ? "text-white/15" : "text-white/50 hover:bg-white/[0.06] hover:text-white"}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Position number */}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isNew ? "bg-green-400/20 text-green-200" :
                            isRemoved ? "bg-red-400/20 text-red-300 line-through" :
                            isRevising ? "bg-amber-400/20 text-amber-200" :
                            "bg-white/[0.08] text-white/80"
                          }`}>
                            {index + 1}
                          </div>

                          {/* Clip preview */}
                          <div className="w-44 h-[100px] sm:w-56 sm:h-[126px] rounded-lg overflow-hidden flex-shrink-0 bg-black relative">
                            <ClipPreview clip={clip} isRemoved={isRemoved} />
                          </div>

                          {/* Clip info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {isNew && <span className="text-green-300 mr-1">NEW</span>}
                              {clip.description || `Clip ${clip.original_position}`}
                            </p>
                            <p className="text-xs text-white/50 mt-0.5">
                              {isNew ? (
                                <span className="text-green-300 font-medium">$4 · New clip</span>
                              ) : (
                                <>{clip.camera_direction || "Auto"} · {clip.camera_speed || "Default"}</>
                              )}
                            </p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!isNew && (
                              <button
                                onClick={() => toggleEdit(index)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  isRevising
                                    ? "bg-amber-400/15 border-amber-400/40 text-amber-200"
                                    : "border-white/[0.1] text-white/60 hover:border-amber-400/40 hover:text-amber-200"
                                }`}
                              >
                                <Pencil className="h-3 w-3 inline mr-1" />Edit
                              </button>
                            )}
                            <button
                              onClick={() => removeClip(index)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                isRemoved
                                  ? "bg-red-400/15 border-red-400/40 text-red-200"
                                  : "border-white/[0.1] text-white/60 hover:border-red-400/40 hover:text-red-300"
                              }`}
                            >
                              <Trash2 className="h-3 w-3 inline mr-1" />
                              {isNew ? "Delete" : isRemoved ? "Restore" : "Remove"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded controls — for revise OR new clips */}
                        {(isRevising || isNew) && (
                          <div className={`border-t border-white/[0.06] p-4 space-y-3 ${
                            isNew ? "bg-green-400/[0.02]" : "bg-amber-400/[0.02]"
                          }`}>
                            <div>
                              <p className="text-xs font-semibold text-white mb-2">Camera direction:</p>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_direction: "", custom_motion: "" } : c))}
                                  className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                                    !clip.camera_direction && !clip.custom_motion
                                      ? `${a.bg} ${a.border} ${a.textLight} font-semibold`
                                      : "border-white/[0.1] text-white/60 hover:bg-white/[0.04]"
                                  }`}
                                >
                                  🤖 Auto
                                </button>
                                {DIRECTIONS.map((d) => (
                                  <button
                                    key={d.key}
                                    onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_direction: d.key, custom_motion: "" } : c))}
                                    className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                                      clip.camera_direction === d.key
                                        ? `${a.bg} ${a.border} ${a.textLight} font-semibold`
                                        : "border-white/[0.1] text-white/60 hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {clip.camera_direction !== "bring_to_life" && (
                              <div>
                                <p className="text-xs font-semibold text-white mb-2">Speed:</p>
                                <div className="flex gap-1.5">
                                  {SPEEDS.map((s) => (
                                    <button
                                      key={s.key}
                                      onClick={() => setClips(clips.map((c, i) => i === index ? { ...c, camera_speed: s.key } : c))}
                                      className={`text-xs py-1.5 px-4 rounded-lg border transition-all ${
                                        clip.camera_speed === s.key
                                          ? `${a.bg} ${a.border} ${a.textLight} font-semibold`
                                          : "border-white/[0.1] text-white/60 hover:bg-white/[0.04]"
                                      }`}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-white mb-1">
                                {clip.camera_direction === "bring_to_life"
                                  ? "Describe the action (warm, friendly actions work best):"
                                  : "Or describe your own camera movement:"}
                              </p>
                              <Input
                                value={clip.custom_motion || ""}
                                onChange={(e) => setClips(clips.map((c, i) => i === index ? { ...c, custom_motion: e.target.value, camera_direction: e.target.value ? "" : c.camera_direction } : c))}
                                placeholder={clip.camera_direction === "bring_to_life"
                                  ? "e.g. Agent waves warmly at camera and smiles"
                                  : "e.g. Slowly zoom into the fireplace then pan right"}
                                maxLength={80}
                                className="text-sm h-9 bg-white/[0.04] border-white/[0.1] text-white"
                              />
                            </div>
                            {!isNew && (
                              <div>
                                <p className="text-xs font-semibold text-white mb-1">What needs fixing? (optional)</p>
                                <Input
                                  value={clip.problem_description || ""}
                                  onChange={(e) => setClips(clips.map((c, i) => i === index ? { ...c, problem_description: e.target.value } : c))}
                                  placeholder="e.g. Front entrance, Backyard pool area"
                                  maxLength={80}
                                  className="text-sm h-9 bg-white/[0.04] border-white/[0.1] text-white"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Add-clip-here button between clips */}
                      <button
                        onClick={() => triggerAddClip(index)}
                        className="w-full py-2 mt-2 border-2 border-dashed border-green-400/20 rounded-xl text-xs font-medium text-green-300/70 hover:border-green-400/50 hover:text-green-300 hover:bg-green-400/[0.04] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="h-3 w-3" />
                        Add clip here · $4
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* General Notes */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-4">
                <p className="text-xs font-semibold text-white mb-2">Additional Notes (optional)</p>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Any general direction or requests..."
                  rows={3}
                  className="text-sm bg-white/[0.04] border-white/[0.1] text-white"
                />
              </div>

              {/* Summary + Submit */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
                <h3 className="font-bold text-white text-sm">Summary</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-xl font-black text-white">{activeClips.length}</div>
                    <div className="text-[10px] text-white/55 mt-0.5">Clips in video</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-300">{revisedClips.filter(c => c.action === "revise").length}</div>
                    <div className="text-[10px] text-white/55 mt-0.5">To re-render</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-red-300">{revisedClips.filter(c => c.action === "remove").length}</div>
                    <div className="text-[10px] text-white/55 mt-0.5">To remove</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-green-300">{newClips.length}</div>
                    <div className="text-[10px] text-white/55 mt-0.5">New clips</div>
                  </div>
                </div>

                {needsPayment && (
                  <div className="rounded-lg bg-amber-400/10 border border-amber-400/30 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-amber-300" />
                      <p className="font-semibold text-amber-200 text-sm">Payment Required — ${totalCost.toFixed(2)}</p>
                    </div>
                    <div className="text-xs text-amber-200/80 space-y-0.5 mb-1.5">
                      {(() => {
                        const breakdown = getRevisionCostBreakdown();
                        return (
                          <>
                            {breakdown.newCount > 0 && (
                              <p>{breakdown.newCount} new clip{breakdown.newCount !== 1 ? "s" : ""} × ${NEW_CLIP_PRICE.toFixed(2)} = ${breakdown.newCost.toFixed(2)}</p>
                            )}
                            {breakdown.reviseCount > 0 && breakdown.reviseCost > 0 && (
                              <p>{breakdown.reviseCount} re-rendered clip{breakdown.reviseCount !== 1 ? "s" : ""} = ${breakdown.reviseCost.toFixed(2)}</p>
                            )}
                            <p className="text-amber-200/60">Removals and reordering are always free.</p>
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-200/80">
                      <CreditCard className="h-3 w-3" />
                      <span>Secure Stripe checkout</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !hasChanges}
                  className={`w-full py-4 text-sm font-bold ${
                    needsPayment
                      ? "bg-amber-500 hover:bg-amber-400 text-white"
                      : `${a.btnBg} ${a.btnBgHover} text-white`
                  }`}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />{needsPayment ? "Redirecting to payment..." : "Submitting..."}</>
                  ) : needsPayment ? (
                    <><CreditCard className="h-4 w-4 mr-2" />Pay ${totalCost.toFixed(2)} & Submit</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Submit Changes (Free)</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
