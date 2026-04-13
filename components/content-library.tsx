// components/content-library.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image, Video, Scissors, FileImage, Palette, RotateCcw, FileText, Camera,
  Loader2, Send, PlusCircle, Filter,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LibraryAsset {
  id: string;
  type: "photo" | "video" | "clip" | "flyer" | "staging" | "remix" | "description" | "drone";
  propertyId?: string;
  propertyAddress: string;
  thumbnailUrl?: string;
  assetUrl?: string;
  content?: string;
  label: string;
  createdAt: string;
}

interface Property {
  id: string;
  address: string;
}

interface ContentLibraryProps {
  properties: Property[];
  onSendToChat: (asset: LibraryAsset) => void;
  onUseInPost: (asset: LibraryAsset) => void;
}

// ─── Filter Tabs ────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All", icon: Filter },
  { key: "photos", label: "Photos", icon: Image },
  { key: "videos", label: "Videos", icon: Video },
  { key: "clips", label: "Clips", icon: Scissors },
  { key: "flyers", label: "Flyers", icon: FileImage },
  { key: "staging", label: "Staging", icon: Palette },
  { key: "remixes", label: "Remixes", icon: RotateCcw },
  { key: "descriptions", label: "Descriptions", icon: FileText },
  { key: "drone", label: "Drone", icon: Camera },
];

// ─── Asset Card ─────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  onSendToChat,
  onUseInPost,
}: {
  asset: LibraryAsset;
  onSendToChat: () => void;
  onUseInPost: () => void;
}) {
  const isVisual = asset.type !== "description";
  const addressShort = asset.propertyAddress.split(",")[0] || asset.propertyAddress;
  const typeLabel = asset.type.charAt(0).toUpperCase() + asset.type.slice(1);

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden hover:border-white/[0.12] transition-colors">
      {/* Preview */}
      {isVisual && asset.thumbnailUrl ? (
        <div className="relative aspect-[4/3] bg-white/[0.02] overflow-hidden">
          <img
            src={asset.thumbnailUrl}
            alt={asset.label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={onUseInPost}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
            >
              <PlusCircle className="h-3 w-3" /> Use in Post
            </button>
            <button
              onClick={onSendToChat}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-cyan-500 hover:bg-cyan-400 transition-colors"
            >
              <Send className="h-3 w-3" /> Send to Chat
            </button>
          </div>
        </div>
      ) : asset.type === "description" ? (
        <div className="p-3 bg-white/[0.02] min-h-[80px]">
          <p className="text-[11px] text-white/50 line-clamp-4 leading-relaxed">
            {asset.content?.slice(0, 200)}
          </p>
        </div>
      ) : (
        <div className="aspect-[4/3] bg-white/[0.02] flex items-center justify-center">
          <Video className="h-8 w-8 text-white/10" />
        </div>
      )}

      {/* Info */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/60 truncate">{addressShort}</p>
            <p className="text-[10px] text-white/25 truncate">{typeLabel} — {asset.label}</p>
          </div>
        </div>

        {/* Buttons for non-visual (descriptions) */}
        {!isVisual && (
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={onUseInPost}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors"
            >
              <PlusCircle className="h-2.5 w-2.5" /> Use
            </button>
            <button
              onClick={onSendToChat}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-colors"
            >
              <Send className="h-2.5 w-2.5" /> Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Content Library ───────────────────────────────────────────────────

export default function ContentLibrary({ properties, onSendToChat, onUseInPost }: ContentLibraryProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/planner/library?type=${activeTab}`;
      if (propertyFilter) url += `&propertyId=${propertyFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Library fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, propertyFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white/90">Content Library</p>
          <span className="text-[10px] text-white/25">{total} assets</span>
        </div>

        {/* Property filter */}
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-emerald-400/30 mb-2"
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.address.split(",")[0]}</option>
          ))}
        </select>

        {/* Filter tabs — horizontal scroll */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                    : "text-white/30 hover:text-white/50 border border-transparent"
                }`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-white/30">No assets found</p>
            <p className="text-xs text-white/15 mt-1">Create content with Lens tools to fill your library</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onSendToChat={() => onSendToChat(asset)}
                onUseInPost={() => onUseInPost(asset)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
