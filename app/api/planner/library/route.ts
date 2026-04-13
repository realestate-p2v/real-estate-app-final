// app/api/planner/library/route.ts
// Content library aggregation — returns all marketing assets across all sources
// GET /api/planner/library?type=all&propertyId=optional

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface LibraryAsset {
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

// Only real listing flyers from Design Studio (not branding cards, remixes, drone)
const FLYER_TEMPLATE_TYPES = [
  "just_listed", "open_house", "price_reduced", "just_sold", "yard_sign", "property_pdf",
];

// Normalize an address string for loose matching
function normalizeAddr(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\bstreet\b/g, "st").replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd").replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln").replace(/\broad\b/g, "rd")
    .replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
}

// Returns true if two address strings refer to the same property
function addressesMatch(a: string, b: string): boolean {
  const na = normalizeAddr(a).split(",")[0];
  const nb = normalizeAddr(b).split(",")[0];
  return na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na));
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const url = new URL(req.url);
    const filterType = url.searchParams.get("type") || "all";
    const propertyId = url.searchParams.get("propertyId");

    const [propertiesRes, ordersRes, exportsRes, stagingRes, descriptionsRes] = await Promise.all([
      supabase.from("agent_properties")
        .select("id, address, address_normalized, photos, optimized_photos")
        .eq("user_id", userId)
        .is("merged_into_id", null), // exclude merged properties
      supabase.from("orders")
        .select("id, property_address, photos, delivery_url, clip_urls, payment_status, created_at")
        .eq("user_id", userId)
        .eq("payment_status", "paid"),
      supabase.from("design_exports")
        .select("id, property_id, template_type, export_url, created_at")
        .eq("user_id", userId),
      supabase.from("lens_staging")
        .select("id, property_id, staged_url, room_type, style, created_at")
        .eq("user_id", userId),
      supabase.from("lens_descriptions")
        .select("id, property_data, description, style, created_at")
        .eq("user_id", userId),
    ]);

    const properties = propertiesRes.data || [];
    const allOrders = ordersRes.data || [];
    const exports_ = exportsRes.data || [];
    const staging = stagingRes.data || [];
    const descriptions = descriptionsRes.data || [];

    const propertyMap = new Map(
      properties.map((p: { id: string; address: string }) => [p.id, p.address])
    );

    // Only show orders that match a currently active (non-merged) property
    const activeOrders = allOrders.filter((o: { property_address: string }) =>
      properties.some((p: { address: string }) => addressesMatch(o.property_address, p.address))
    );

    // When filtering by a specific property, get its address for matching
    let filterProp: { address: string; address_normalized?: string } | null = null;
    if (propertyId) {
      filterProp = properties.find((p: { id: string }) => p.id === propertyId) || null;
    }

    // Does an order match the selected property filter?
    const orderMatchesFilter = (orderAddr: string): boolean => {
      if (!filterProp) return true;
      return addressesMatch(orderAddr, filterProp.address);
    };

    // Does a description match the selected property filter?
    const descMatchesFilter = (desc: { property_data?: { address?: string } }): boolean => {
      if (!filterProp) return true;
      const descAddr = desc.property_data?.address || "";
      return addressesMatch(descAddr, filterProp.address);
    };

    const assets: LibraryAsset[] = [];

    // ── Photos from orders ──────────────────────────────────────────────────
    if (filterType === "all" || filterType === "photos") {
      activeOrders
        .filter((o: { property_address: string }) => orderMatchesFilter(o.property_address))
        .forEach((order: { id: string; property_address: string; photos: unknown; created_at: string }) => {
          const photos = Array.isArray(order.photos) ? order.photos : [];
          photos.forEach((photo: string | { url?: string; secure_url?: string }, idx: number) => {
            const photoUrl = typeof photo === "string"
              ? photo
              : photo?.secure_url || photo?.url || "";
            if (!photoUrl) return;
            assets.push({
              id: `photo-${order.id}-${idx}`,
              type: "photo",
              propertyAddress: order.property_address || "Unknown",
              thumbnailUrl: photoUrl,
              assetUrl: photoUrl,
              label: `Photo ${idx + 1}`,
              createdAt: order.created_at,
            });
          });
        });
    }

    // ── Optimized photos from agent_properties ──────────────────────────────
    if (filterType === "all" || filterType === "photos") {
      properties
        .filter((p: { id: string }) => !propertyId || p.id === propertyId)
        .forEach((prop: { id: string; address: string; optimized_photos: unknown }) => {
          const photos = Array.isArray(prop.optimized_photos) ? prop.optimized_photos : [];
          photos.forEach((photo: string | { url?: string; secure_url?: string }, idx: number) => {
            const photoUrl = typeof photo === "string"
              ? photo
              : photo?.secure_url || photo?.url || "";
            if (!photoUrl) return;
            assets.push({
              id: `opt-${prop.id}-${idx}`,
              type: "photo",
              propertyId: prop.id,
              propertyAddress: prop.address || "Unknown",
              thumbnailUrl: photoUrl,
              assetUrl: photoUrl,
              label: `Optimized ${idx + 1}`,
              createdAt: "",
            });
          });
        });
    }

    // ── Videos from orders ──────────────────────────────────────────────────
    if (filterType === "all" || filterType === "videos") {
      activeOrders
        .filter((o: { property_address: string }) => orderMatchesFilter(o.property_address))
        .forEach((order: { id: string; property_address: string; delivery_url?: string; created_at: string }) => {
          if (order.delivery_url) {
            assets.push({
              id: `video-${order.id}`,
              type: "video",
              propertyAddress: order.property_address || "Unknown",
              assetUrl: order.delivery_url,
              label: "Listing Video",
              createdAt: order.created_at,
            });
          }
        });
    }

    // ── Clips from orders ───────────────────────────────────────────────────
    if (filterType === "all" || filterType === "clips") {
      activeOrders
        .filter((o: { property_address: string }) => orderMatchesFilter(o.property_address))
        .forEach((order: { id: string; property_address: string; clip_urls: unknown; created_at: string }) => {
          const clips = Array.isArray(order.clip_urls) ? order.clip_urls : [];
          clips.forEach((clip: string | { url?: string; clip_file?: string; drive_url?: string; photo_url?: string; label?: string }, idx: number) => {
            const clipUrl = typeof clip === "string"
              ? clip
              : clip?.url || clip?.clip_file || clip?.drive_url || "";
            const clipLabel = typeof clip === "object" && clip?.label ? clip.label : `Clip ${idx + 1}`;
            const thumbUrl = typeof clip === "object" ? (clip?.photo_url || "") : "";
            if (!clipUrl) return;
            assets.push({
              id: `clip-${order.id}-${idx}`,
              type: "clip",
              propertyAddress: order.property_address || "Unknown",
              thumbnailUrl: thumbUrl || undefined,
              assetUrl: clipUrl,
              label: clipLabel,
              createdAt: order.created_at,
            });
          });
        });
    }

    // ── Graphics / Flyers — Design Studio listing flyers only ───────────────
    if (filterType === "all" || filterType === "flyers") {
      exports_
        .filter((e: { template_type?: string; property_id?: string }) =>
          e.template_type &&
          FLYER_TEMPLATE_TYPES.includes(e.template_type) &&
          (!propertyId || e.property_id === propertyId)
        )
        .forEach((exp: { id: string; property_id?: string; template_type: string; export_url: string; created_at: string }) => {
          assets.push({
            id: `flyer-${exp.id}`,
            type: "flyer",
            propertyId: exp.property_id || undefined,
            propertyAddress: exp.property_id ? propertyMap.get(exp.property_id) || "Unknown" : "Personal",
            thumbnailUrl: exp.export_url,
            assetUrl: exp.export_url,
            label: exp.template_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            createdAt: exp.created_at,
          });
        });
    }

    // ── Staging ─────────────────────────────────────────────────────────────
    if (filterType === "all" || filterType === "staging") {
      staging
        .filter((s: { property_id?: string }) => !propertyId || s.property_id === propertyId)
        .forEach((s: { id: string; property_id?: string; staged_url: string; room_type?: string; style?: string; created_at: string }) => {
          assets.push({
            id: `staging-${s.id}`,
            type: "staging",
            propertyId: s.property_id || undefined,
            propertyAddress: s.property_id ? propertyMap.get(s.property_id) || "Unknown" : "Unknown",
            thumbnailUrl: s.staged_url,
            assetUrl: s.staged_url,
            label: `${s.room_type || "Room"} — ${s.style || "Styled"}`,
            createdAt: s.created_at,
          });
        });
    }

    // ── Remixes ─────────────────────────────────────────────────────────────
    if (filterType === "all" || filterType === "remixes") {
      exports_
        .filter((e: { template_type?: string; property_id?: string }) =>
          e.template_type?.includes("video_remix") &&
          (!propertyId || e.property_id === propertyId)
        )
        .forEach((exp: { id: string; property_id?: string; export_url: string; created_at: string }) => {
          assets.push({
            id: `remix-${exp.id}`,
            type: "remix",
            propertyId: exp.property_id || undefined,
            propertyAddress: exp.property_id ? propertyMap.get(exp.property_id) || "Unknown" : "Personal",
            assetUrl: exp.export_url,
            label: "Video Remix",
            createdAt: exp.created_at,
          });
        });
    }

    // ── Descriptions ────────────────────────────────────────────────────────
    if (filterType === "all" || filterType === "descriptions") {
      descriptions
        .filter(descMatchesFilter)
        .forEach((d: { id: string; property_data?: { address?: string }; description: string; style?: string; created_at: string }) => {
          assets.push({
            id: `desc-${d.id}`,
            type: "description",
            propertyAddress: d.property_data?.address || "Unknown",
            content: d.description,
            label: `${d.style || "Standard"} Description`,
            createdAt: d.created_at,
          });
        });
    }

    // ── Drone ────────────────────────────────────────────────────────────────
    if (filterType === "all" || filterType === "drone") {
      exports_
        .filter((e: { template_type?: string; property_id?: string }) =>
          e.template_type?.includes("drone") &&
          (!propertyId || e.property_id === propertyId)
        )
        .forEach((exp: { id: string; property_id?: string; export_url: string; created_at: string }) => {
          assets.push({
            id: `drone-${exp.id}`,
            type: "drone",
            propertyId: exp.property_id || undefined,
            propertyAddress: exp.property_id ? propertyMap.get(exp.property_id) || "Unknown" : "Personal",
            thumbnailUrl: exp.export_url,
            assetUrl: exp.export_url,
            label: "Drone Annotation",
            createdAt: exp.created_at,
          });
        });
    }

    assets.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ assets, total: assets.length });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}
