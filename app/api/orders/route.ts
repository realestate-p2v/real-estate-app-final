// app/api/orders/route.ts
// Phase 1A update — additive changes only. Preserves existing contract:
// - GET admin fetch (unchanged)
// - POST create order (extends payload, preserves all existing fields)
// - PATCH status update (unchanged)
//
// New behavior on POST:
// - Accepts promoted_order_id: if present, UPDATE the existing draft
//   order (promoted by the autosave hook) instead of INSERT new.
// - Accepts agent_property_id: links the order to the existing draft
//   property row.
// - Accepts special_features (jsonb), room_tags (jsonb), photo_editing
//   (bool), is_first_order (bool), listing_status (text).
// - Accepts vertical_addon (bool): paid $15 upgrade that tells the pipeline
//   to render a separately-framed vertical at Minimax instead of cropping
//   the landscape. Pricing is already baked into totalPrice by the
//   frontend (matches the pattern used by photo_editing / 1080P / URL
//   service — one Stripe line item for the computed total). We just
//   persist the flag so pipeline.py can read it.
// - On first order: writes agent_info to lens_usage so returning users
//   get auto-fill on their second+ orders. Per Matt: second+ orders
//   pre-fill from profile; edits on those orders stay per-order (do NOT
//   write back to lens_usage).

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensurePropertyExists } from "@/lib/utils/portfolio";

// ─────────────────────────────────────────────────────────────────────────
// GET — admin dashboard fetch (unchanged)
// ─────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// POST — create or promote order
// ─────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      // Existing fields (preserved)
      customer,
      uploadedPhotos,
      listing_url,
      listing_package_price,
      listing_package_label,
      listing_instructions,
      resolution,
      orientation,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyBedrooms,
      propertyBathrooms,
      musicSelection,
      musicFile,
      branding,
      voiceover,
      voiceoverScript,
      voiceoverVoice,
      includeEditedPhotos,
      includeUnbranded,
      customIntroCardUrl,
      customOutroCardUrl,
      totalPrice,
      specialInstructions,
      is_quick_video,
      utm_source,
      utm_medium,
      utm_campaign,

      // Phase 1A additions
      agent_property_id,
      promoted_order_id,
      special_features,
      room_tags,
      photo_editing,
      is_first_order,
      listing_status,
      agent_info,

      // Vertical add-on (v1.3): paid $15 upgrade for a separately-framed
      // vertical render at Minimax. Pipeline reads orders.vertical_addon.
      vertical_addon,
    } = body;

    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer email is required" },
        { status: 400 }
      );
    }

    // Auth (unchanged — optional for guest checkout)
    let userId: string | null = null;
    try {
      const authSupabase = await createClient();
      const {
        data: { user },
      } = await authSupabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      /* not logged in */
    }

    const supabase = createAdminClient();
    const photoCount = uploadedPhotos?.length || 0;

    // Vertical add-on sanity: coerce to strict bool, and refuse to honor
    // the flag on first-order flows. The frontend already hides the UI
    // and zeroes the payload on that path, but we defend in depth here
    // too — no amount of payload-tampering can result in a first-order
    // row with vertical_addon = true.
    const verticalAddonResolved = !!vertical_addon && !is_first_order;

    // ── Build the payload that applies to both INSERT and UPDATE paths ──
    const orderFields: Record<string, any> = {
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      photos: uploadedPhotos || [],
      photo_count: photoCount,
      listing_url: listing_url || null,
      listing_package_price: listing_package_price || null,
      listing_package_label: listing_package_label || null,
      listing_instructions: listing_instructions || null,
      resolution: resolution || "768P",
      orientation: orientation || "both",
      property_address: propertyAddress || null,
      property_city: propertyCity || null,
      property_state: propertyState || null,
      property_bedrooms: propertyBedrooms ? parseInt(propertyBedrooms) : null,
      property_bathrooms: propertyBathrooms ? parseInt(propertyBathrooms) : null,
      music_selection: musicSelection || null,
      music_file: musicFile || null,
      branding: branding || { type: "unbranded" },
      voiceover: voiceover || false,
      voiceover_script: voiceoverScript || null,
      voiceover_voice: voiceoverVoice || null,
      include_edited_photos: includeEditedPhotos || false,
      include_unbranded: includeUnbranded || false,
      include_address_on_card: body.includeAddressOnCard ?? true,
      custom_intro_card_url: customIntroCardUrl || null,
      custom_outro_card_url: customOutroCardUrl || null,
      total_price: totalPrice || 0,
      special_instructions: specialInstructions || null,
      is_quick_video: is_quick_video || false,
      referral_code: body.referral_code || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,

      // Phase 1A additions
      agent_property_id: agent_property_id || null,
      special_features: special_features || {},
      room_tags: room_tags || [],
      photo_editing: !!photo_editing,
      is_first_order: !!is_first_order,

      // v1.3: vertical add-on flag. Pipeline reads this to decide whether
      // to render vertical separately at Minimax (true) or crop from the
      // landscape via ffmpeg (false).
      vertical_addon: verticalAddonResolved,
    };

    let orderId: string;
    let orderRow: any = null;
    let insertError: any = null;

    if (promoted_order_id) {
      // ── Update the existing draft row that autosave just promoted ──
      orderId = promoted_order_id;
      const { data, error } = await supabase
        .from("orders")
        .update({
          ...orderFields,
          user_id: userId, // lock in user at promotion time
          status: "pending_payment",
          is_draft: false,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select()
        .single();

      orderRow = data;
      insertError = error;

      if (insertError) {
        console.error("Error promoting draft order:", insertError);
        // Fall through to INSERT as a safety net — never lose an order.
        orderId = randomUUID();
      }
    }

    if (!orderRow) {
      // ── Fresh INSERT path ──
      if (!orderId!) orderId = randomUUID();

      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_id: orderId,
          user_id: userId,
          status: "pending_payment",
          ...orderFields,
        })
        .select()
        .single();

      orderRow = data;
      insertError = error;
    }

    if (insertError || !orderRow) {
      console.error("Error creating order:", insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || "Order create failed" },
        { status: 500 }
      );
    }

    // ── Ensure property portfolio entry exists (unchanged behavior) ──
    if (propertyAddress && userId) {
      try {
        await ensurePropertyExists(supabase, userId, propertyAddress, {
          city: propertyCity,
          state: propertyState,
          bedrooms: propertyBedrooms ? parseInt(propertyBedrooms) : undefined,
          bathrooms: propertyBathrooms ? parseInt(propertyBathrooms) : undefined,
        });
      } catch (err) {
        console.error("Portfolio auto-create failed:", err);
      }
    }

    // ── Mirror special_features to the linked agent_properties row ──
    if (agent_property_id && special_features && Object.keys(special_features).length > 0) {
      try {
        await supabase
          .from("agent_properties")
          .update({ special_features_v2: special_features })
          .eq("id", agent_property_id);
      } catch (err) {
        console.error("[orders] special_features mirror failed:", err);
      }
    }

    // ── Save agent info to lens_usage on first order ──
    // Per Matt: second+ orders do NOT write edits back to the profile.
    if (userId && is_first_order && agent_info) {
      try {
        const updates: Record<string, any> = {};
        if (agent_info.name) updates.saved_agent_name = agent_info.name;
        if (agent_info.phone) updates.saved_phone = agent_info.phone;
        if (agent_info.email) updates.saved_email = agent_info.email;
        if (agent_info.company) updates.saved_company = agent_info.company;
        if (agent_info.headshot_url) updates.saved_headshot_url = agent_info.headshot_url;
        if (agent_info.logo_url) updates.saved_logo_url = agent_info.logo_url;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("lens_usage")
            .upsert(
              { user_id: userId, ...updates },
              { onConflict: "user_id" }
            );
        }
      } catch (err) {
        console.error("[orders] lens_usage profile save failed:", err);
      }
    }

    // ── Mirror listing_status to agent_properties if provided ──
    if (agent_property_id && listing_status) {
      try {
        await supabase
          .from("agent_properties")
          .update({ listing_status })
          .eq("id", agent_property_id);
      } catch (err) {
        console.error("[orders] listing_status mirror failed:", err);
      }
    }

    console.log(
      "[Orders] Created order:",
      orderId,
      userId ? `(user: ${userId.slice(0, 8)})` : "(no user)",
      is_first_order ? "(first order 🎉)" : "",
      is_quick_video ? "(quick video)" : "",
      verticalAddonResolved ? "(vertical add-on +$15)" : ""
    );

    return NextResponse.json({
      success: true,
      data: { orderId, order: orderRow },
    });
  } catch (error) {
    console.error("Server error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PATCH — order status update (unchanged)
// ─────────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const validStatuses = ["New", "Processing", "Delivered"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
