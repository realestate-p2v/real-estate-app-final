// components/post-creator.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Calendar, Copy, ExternalLink, Check } from "lucide-react";

interface Property {
  id: string;
  address: string;
}

interface PostCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialAssetUrl?: string;
  initialPropertyId?: string;
  properties: Property[];
  onScheduled: () => void;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "blog", label: "Blog" },
];

const CONTENT_TYPES = [
  { value: "new_listing", label: "New Listing" },
  { value: "just_sold", label: "Just Sold" },
  { value: "price_reduced", label: "Price Reduced" },
  { value: "staging_reveal", label: "Staging Reveal" },
  { value: "open_house", label: "Open House" },
  { value: "video_share", label: "Video Tour" },
  { value: "market_update", label: "Market Update" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "personal", label: "Personal / Brand" },
  { value: "tip", label: "Real Estate Tip" },
];

export default function PostCreator({
  isOpen,
  onClose,
  initialDate,
  initialAssetUrl,
  initialPropertyId,
  properties,
  onScheduled,
}: PostCreatorProps) {
  const [propertyId, setPropertyId] = useState(initialPropertyId || "");
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("new_listing");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [caption, setCaption] = useState("");
  const [assetUrl, setAssetUrl] = useState(initialAssetUrl || "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync initial values when they change
  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialAssetUrl) setAssetUrl(initialAssetUrl);
    if (initialPropertyId) setPropertyId(initialPropertyId);
  }, [initialDate, initialAssetUrl, initialPropertyId]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCaption("");
      setGenerating(false);
      setSaving(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerateCaption = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/planner/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || undefined,
          platform,
          contentType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCaption(data.caption || "");
      }
    } catch (err) {
      console.error("Caption generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/planner/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propertyId || null,
          scheduledDate: date,
          platform,
          contentType,
          caption: caption || null,
          assetUrl: assetUrl || null,
        }),
      });
      if (res.ok) {
        onScheduled();
        onClose();
      }
    } catch (err) {
      console.error("Schedule error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePostNow = async () => {
    // Copy caption
    if (caption) {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
    }

    // Record the action
    await fetch("/api/planner/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionType: "social_share",
        propertyId: propertyId || null,
        platform,
        contentType,
      }),
    });

    // Open platform
    const urls: Record<string, string> = {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
    };
    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }

    // Download asset if present
    if (assetUrl) {
      const a = document.createElement("a");
      a.href = assetUrl;
      a.download = "";
      a.target = "_blank";
      a.click();
    }

    setTimeout(() => {
      onScheduled();
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-white/[0.08] rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-bold text-white/90">Create a Post</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors">
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Property */}
          <div>
            <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-400/30"
            >
              <option value="">Personal / Agent Brand</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.address.split(",")[0]}</option>
              ))}
            </select>
          </div>

          {/* Platform + Content Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-400/30"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-400/30"
              />
            </div>
          </div>

          {/* Content Type */}
          <div>
            <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-emerald-400/30"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Asset Preview */}
          {assetUrl && (
            <div>
              <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider block mb-1.5">Asset</label>
              <div className="relative">
                <img src={assetUrl} alt="" className="w-full h-32 object-cover rounded-xl border border-white/[0.06]" />
                <button
                  onClick={() => setAssetUrl("")}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="h-3 w-3 text-white/60" />
                </button>
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Caption</label>
              <button
                onClick={handleGenerateCaption}
                disabled={generating}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-3 w-3" /> Generate Caption</>
                )}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="Write your caption or generate one with AI..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-400/30 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <button
            onClick={handleSchedule}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling...</>
            ) : (
              <><Calendar className="h-4 w-4" /> Schedule Post</>
            )}
          </button>
          <button
            onClick={handlePostNow}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <ExternalLink className="h-4 w-4" />}
            {copied ? "Copied!" : "Post Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
