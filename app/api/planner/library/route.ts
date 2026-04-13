// app/api/planner/library/route.ts
// Content library aggregation — returns all marketing assets across all sources
// Filterable by type and property
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
      supabase.from("agent_properties").select("id, address, photos, optimized_photos").eq("user_id", userId),
      // FIXED: removed branded_video_url (doesn't exist); clip_urls is correct; payment_status 'paid' confirmed
      supabase.from("orders").select("id, property_address, photos, delivery_url, clip_urls, payment_status, created_at").eq("user_id", userId).eq("payment_status", "paid"),
      // design_exports: export_url and template_type confirmed correct
      supabase.from("design_exports").select("id, property_id, template_type, export_url, created_at").eq("user_id", userId),
      // lens_staging: staged_url, room_type, style confirmed correct
      supabase.from("lens_staging").select("id, property_id, staged_url, room_type, style, created_at").eq("user_id", userId),
      // FIXED: property_data (JSONB) not property_address; description not content
      supabase.from("lens_descriptions").select("id, property_data, description, style, created_at").eq("user_id", userId),
    ]);

    const properties = propertiesRes.data || [];
    const orders = ordersRes.data || [];
    const exports_ = exportsRes.data || [];
    const staging = stagingRes.data || [];
    const descriptions = descriptionsRes.data || [];

    const propertyMap = new Map(
      properties.map((p: { id: string; address: string }) => [p.id, p.address])
    );

    const assets: LibraryAsset[] = [];

    // Photos from orders
    if (filterType === "all" || filterType === "photos") {
      orders.forEach((order: { id: string; property_address: string; photos: unknown; created_at: string }) => {
        const photos = Array.isArray(order.photos) ? order.photos : [];
        photos.forEach((photo: string | { url?: string }, idx: number) => {
          const photoUrl = typeof photo === "string" ? photo : photo?.url || "";
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

    // Optimized photos from properties
    if (filterType === "all" || filterType === "photos") {
      properties.forEach((prop: { id: string; address: string; optimized_photos: unknown }) => {
        const photos = Array.isArray(prop.optimized_photos) ? prop.optimized_photos : [];
        photos.forEach((photo: string | { url?: string }, idx: number) => {
          const photoUrl = typeof photo === "string" ? photo : photo?.url || "";
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

    // Videos from orders (delivery_url only — no branded_video_url column)
    if (filterType === "all" || filterType === "videos") {
      orders.forEach((order: { id: string; property_address: string; delivery_url?: string; created_at: string }) => {
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

    // Clips from orders
    if (filterType === "all" || filterType === "clips") {
      orders.forEach((order: { id: string; property_address: string; clip_urls: unknown; created_at: string }) => {
        const clips = Array.isArray(order.clip_urls) ? order.clip_urls : [];
        clips.forEach((clip: string | { url?: string; label?: string }, idx: number) => {
          const clipUrl = typeof clip === "string" ? clip : clip?.url || "";
          const clipLabel = typeof clip === "object" && clip?.label ? clip.label : `Clip ${idx + 1}`;
          if (!clipUrl) return;
          assets.push({
            id: `clip-${order.id}-${idx}`,
            type: "clip",
            propertyAddress: order.property_address || "Unknown",
            assetUrl: clipUrl,
            label: clipLabel,
            createdAt: order.created_at,
          });
        });
      });
    }

    // Flyers / Graphics (design exports, non-remix non-drone)
    if (filterType === "all" || filterType === "flyers") {
      exports_
        .filter((e: { template_type?: string }) =>
          e.template_type &&
          !e.template_type.includes("video_remix") &&
          !e.template_type.includes("drone")
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

    // Staging
    if (filterType === "all" || filterType === "staging") {
      staging.forEach((s: { id: string; property_id?: string; staged_url: string; room_type?: string; style?: string; created_at: string }) => {
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

    // Remixes
    if (filterType === "all" || filterType === "remixes") {
      exports_
        .filter((e: { template_type?: string }) => e.template_type && e.template_type.includes("video_remix"))
        .forEach((exp: { id: string; property_id?: string; template_type: string; export_url: string; created_at: string }) => {
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

    // Descriptions
    // FIXED: property_data is JSONB (extract .address); description not content
    if (filterType === "all" || filterType === "descriptions") {
      descriptions.forEach((d: { id: string; property_data?: { address?: string }; description: string; style?: string; created_at: string }) => {
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

    // Drone
    if (filterType === "all" || filterType === "drone") {
      exports_
        .filter((e: { template_type?: string }) => e.template_type && e.template_type.includes("drone"))
        .forEach((exp: { id: string; property_id?: string; template_type: string; export_url: string; created_at: string }) => {
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

    // Filter by property if specified
    let filtered = assets;
    if (propertyId) {
      const propAddress = propertyMap.get(propertyId);
      filtered = assets.filter(
        (a) => a.propertyId === propertyId || (propAddress && a.propertyAddress === propAddress)
      );
    }

    filtered.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ assets: filtered, total: filtered.length });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}
