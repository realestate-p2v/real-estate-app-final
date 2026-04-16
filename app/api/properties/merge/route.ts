import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { primaryId, mergeIds } = await req.json();

    if (!primaryId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
      return NextResponse.json(
        { error: "primaryId and mergeIds[] required" },
        { status: 400 }
      );
    }

    // Verify all properties belong to this user
    const allIds = [primaryId, ...mergeIds];
    const { data: props, error: fetchErr } = await supabase
      .from("agent_properties")
      .select("id, address, address_normalized, status, user_id")
      .in("id", allIds)
      .eq("user_id", user.id);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!props || props.length !== allIds.length) {
      return NextResponse.json(
        { error: "One or more properties not found or not owned by you" },
        { status: 403 }
      );
    }

    const primary = props.find((p: any) => p.id === primaryId);
    if (!primary) {
      return NextResponse.json(
        { error: "Primary property not found" },
        { status: 400 }
      );
    }

    const results: {
      mergedId: string;
      address: string;
      assetsMoved: Record<string, number>;
    }[] = [];

    for (const mergeId of mergeIds) {
      const merged = props.find((p: any) => p.id === mergeId);
      const assetsMoved: Record<string, number> = {};

      // Move lens_staging records
      const { data: stagingMoved } = await supabase
        .from("lens_staging")
        .update({ property_id: primaryId })
        .eq("property_id", mergeId)
        .eq("user_id", user.id)
        .select("id");
      assetsMoved.staging = stagingMoved?.length || 0;

      // Move design_exports records
      const { data: exportsMoved } = await supabase
        .from("design_exports")
        .update({ property_id: primaryId })
        .eq("property_id", mergeId)
        .eq("user_id", user.id)
        .select("id");
      assetsMoved.exports = exportsMoved?.length || 0;

      // Move booking_slots
      const { data: slotsMoved } = await supabase
        .from("booking_slots")
        .update({ property_id: primaryId })
        .eq("property_id", mergeId)
        .eq("user_id", user.id)
        .select("id");
      assetsMoved.slots = slotsMoved?.length || 0;

      // Move showing_requests
      const { data: showingsMoved } = await supabase
        .from("showing_requests")
        .update({ property_id: primaryId })
        .eq("property_id", mergeId)
        .eq("agent_user_id", user.id)
        .select("id");
      assetsMoved.showings = showingsMoved?.length || 0;

      // Update lens_sessions address to match primary (they match by address, not FK)
      if (merged?.address_normalized && primary.address_normalized) {
        const { data: sessionsMoved } = await supabase
          .from("lens_sessions")
          .update({ property_address: primary.address_normalized })
          .eq("user_id", user.id)
          .eq("property_address", merged.address_normalized)
          .select("id");
        assetsMoved.sessions = sessionsMoved?.length || 0;
      }

      // NEW: Update orders.property_address to primary's address
      // Orders match by address string, not FK — without this, the planner won't find media after merge
      if (merged?.address && primary.address) {
        // Match orders using the first part of the merged address (street number + street name)
        const mergedFirstPart = merged.address.split(",")[0].trim();

        // Get all orders for this user that contain the merged address
        const { data: userOrders } = await supabase
          .from("orders")
          .select("id, property_address")
          .eq("user_id", user.id);

        const ordersToUpdate = (userOrders || []).filter((o: any) => {
          const orderAddr = (o.property_address || "").toLowerCase();
          const mergedAddr = mergedFirstPart.toLowerCase();
          return orderAddr.includes(mergedAddr) || mergedAddr.includes(orderAddr.split(",")[0].trim());
        });

        if (ordersToUpdate.length > 0) {
          const orderIds = ordersToUpdate.map((o: any) => o.id);
          const { data: ordersUpdated } = await supabase
            .from("orders")
            .update({ property_address: primary.address })
            .in("id", orderIds)
            .eq("user_id", user.id)
            .select("id");
          assetsMoved.orders = ordersUpdated?.length || 0;
        } else {
          assetsMoved.orders = 0;
        }
      }

      // Mark the merged property
      const { error: mergeErr } = await supabase
        .from("agent_properties")
        .update({
          merged_into_id: primaryId,
          status: "merged",
          merge_history: {
            merged_at: new Date().toISOString(),
            original_status: merged?.status,
            original_address: merged?.address, // Store for undo
            assets_moved: assetsMoved,
          },
        })
        .eq("id", mergeId)
        .eq("user_id", user.id);

      if (mergeErr) {
        console.error(`Failed to mark property ${mergeId} as merged:`, mergeErr);
        continue;
      }

      // Insert property_merges record
      const canUndoUntil = new Date();
      canUndoUntil.setDate(canUndoUntil.getDate() + 30);

      await supabase.from("property_merges").insert({
        primary_id: primaryId,
        merged_id: mergeId,
        user_id: user.id,
        assets_moved: assetsMoved,
        can_undo_until: canUndoUntil.toISOString(),
      });

      results.push({
        mergedId: mergeId,
        address: merged?.address || "",
        assetsMoved,
      });
    }

    return NextResponse.json({
      success: true,
      primaryId,
      primaryAddress: primary.address,
      merged: results,
    });
  } catch (err: any) {
    console.error("Merge error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
