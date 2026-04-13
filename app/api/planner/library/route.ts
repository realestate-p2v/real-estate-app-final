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

// Template types that belong in Flyers tab (Design Studio outputs only)
const FLYER_TEMPLATE_TYPES = [
  "just_listed", "open_house", "price_reduced", "just_sold",
  "yard_sign", "property_pdf",
];

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
      supabase.from("agent_properties").select("id, address, address_normalized, photos, optimized_photos").eq("user_id", userId),
      // All orders — filter by property address after fetch; payment_status=paid confirmed correct
      supabase.from("orders").select("id, property_address, photos, delivery_url, clip_urls, payment_status, created_at").eq("user_id", userId).eq("payment_status", "paid"),
      supabase.from("design_exports").select("id, property_id, template_type, export_url, created_at").eq("user_id", userId),
      supabase.from("lens_staging").select("id, property_id, staged_url, room_type, style, created_at").eq("user_id", userId),
      // FIXED: property_data (JSONB), description (not content)
      supabase.from("lens_descriptions").select("id, property_data, description, style, created_at").eq("user_id", userId),
    ]);

    const properties = propertiesRes.data || [];
    const orders = ordersRes.data || [];
    const exports_ = exportsRes.data || [];
    const staging = stagingRes.data || [];
    const descriptions = descriptionsRes.data || [];

    const propertyMap = new Map(properties.map((p: { id: string; address: string }) => [p.id, p.address]));

    // If filtering by property, find the property's address for matching address-based records
    let filterAddress = "";
    let filterAddressNorm = "";
    if (propertyId) {
      const prop = properties.find((p: { id: string; address: string; address_normalized?: string }) => p.id === propertyId);
      filterAddress = prop?.address || "";
      filterAddressNorm = prop?.address_normalized || filterAddress.toLowerCase().split(",")[0];
    }

    // Helper: does an order's property_address match the selected property?
    const orderMatchesProperty = (orderAddr: string) => {
      if (!filterAddress) return true;
      const norm = orderAddr?.toLowerCase() || "";
      return norm.includes(filterAddressNorm.toLowerCase()) || filterAddressNorm.toLowerCase().includes(norm.split(",")[0]);
    };

    // Helper: does a description match the selected property?
    const descMatchesProperty = (desc: { property_data?: { address?: string } }) => {
      if (!filterAddress) return true;
      const descAddr = (desc.property_data?.address || "").toLowerCase().replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
      const norm = filterAddressNorm.toLowerCase().replace(/[.,\-#]/g, "").replace(/\s+/g, " ").trim();
      return descAddr.startsWith(norm) || norm.startsWith(descAddr.split(",")[0]);
    };

    const assets: LibraryAsset[] = [];

    // ── Photos from orders ──────────────────────────────────────────────────
    // orders.photos is an array of objects with secure_url (from the property page source of truth)
    if (filterType === "all" || filterType === "photos") {
      orders
        .filter((o: { property_address: string }) => orderMatchesProperty(o.property_address))
        .forEach((order: { id: string; property_address: string; photos: unknown; created_at: string }) => {
          const photos = Array.isArray(order.photos) ? order.photos : [];
          photos.forEach((photo: string | { url?: string; secure_url?: string }, idx: number) => {
            // FIXED: photos are objects with secure_url (confirmed from property page)
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
      orders
        .filter((o: { property_address: string }) => orderMatchesProperty(o.property_address))
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
    // FIXED: clip objects have url, clip_file, or drive_url (confirmed from property page)
    if (filterType === "all" || filterType === "clips") {
      orders
        .filter((o: { property_address: string }) => orderMatchesProperty(o.property_address))
        .forEach((order: { id: string; property_address: string; clip_urls: unknown; created_at: string }) => {
          const clips = Array.isArray(order.clip_urls) ? order.clip_urls : [];
          clips.forEach((clip: string | { url?: string; clip_file?: string; drive_url?: string; photo_url?: string; label?: string }, idx: number) => {
            const clipUrl = typeof clip === "string"
              ? clip
              : clip?.url || clip?.clip_file || clip?.drive_url || "";
            const clipLabel = typeof clip === "object" && clip?.label ? clip.label : `Clip ${idx + 1}`;
            const thumbUrl = typeof clip === "object" ? clip?.photo_url || "" : "";
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

    // ── Flyers — Design Studio listing flyers only (not branding cards, remixes, drone) ──
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
    // FIXED: filter by property address match when property selected
    if (filterType === "all" || filterType === "descriptions") {
      descriptions
        .filter(descMatchesProperty)
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

    // Sort by date descending
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
