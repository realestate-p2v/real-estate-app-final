// app/api/orders/free-first-video/route.ts
// Phase 1A — free-first-video submission endpoint.
//
// Flow:
// 1. Verify authenticated user has an unused free-first-video credit
//    (lens_usage.free_first_video_available=true, free_first_video_used=false)
// 2. Verify photo count is within promo bounds (5–10 clips free; 11+ rejected
//    because the form should send paid orders through /api/checkout)
// 3. Promote the draft order OR insert a new row at status='new'
//    (skips Stripe entirely; pipeline picks up on status='new')
// 4. Mark free_first_video_used=true on lens_usage
// 5. Save agent info to lens_usage (first-order side effect)
// 6. Mirror special_features + listing_status to agent_properties
// 7. Return orderId so the form can redirect to /order/processing

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensurePropertyExists } from "@/lib/utils/portfolio";

const FREE_FIRST_VIDEO_MAX_CLIPS = 10;
const FREE_FIRST_VIDEO_MIN_CLIPS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ── Auth required: free-first-video is tied to a user account ──
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const authSupabase = await createClient();
      const {
        data: { user },
      } = await authSupabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    } catch {
      /* not logged in */
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You need to be signed in to claim your free video.",
        },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // ── Verify the user actually has an unused free-first-video credit ──
    const { data: usage, error: usageError } = await supabase
      .from("lens_usage")
      .select(
        "free_first_video_available, free_first_video_used, is_subscriber, subscription_tier, trial_expires_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (usageError) {
      console.error("[free-first-video] usage fetch error:", usageError);
      return NextResponse.json(
        { success: false, error: "Could not verify your account." },
        { status: 500 }
      );
    }

    if (!usage?.free_first_video_available) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your free first video credit is not active. Please contact support if you believe this is an error.",
        },
        { status: 403 }
      );
    }

    if (usage.free_first_video_used) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your free first video has already been claimed. Please place a paid order instead.",
        },
        { status: 403 }
      );
    }

    // ── Guard: only legit Quick Video counts qualify for the zero-cost path ──
    const {
      customer,
      uploadedPhotos,
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
      includeEditedPhotos,
      includeUnbranded,
      customIntroCardUrl,
      customOutroCardUrl,
      specialInstructions,
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
    } = body;

    const photoCount = uploadedPhotos?.length || 0;

    if (photoCount < FREE_FIRST_VIDEO_MIN_CLIPS) {
      return NextResponse.json(
        {
          success: false,
          error: `Your free video needs at least ${FREE_FIRST_VIDEO_MIN_CLIPS} photos.`,
        },
        { status: 400 }
      );
    }

    if (photoCount > FREE_FIRST_VIDEO_MAX_CLIPS) {
      return NextResponse.json(
        {
          success: false,
          error: `Your free video covers up to ${FREE_FIRST_VIDEO_MAX_CLIPS} photos. For more, please place a paid order.`,
        },
        { status: 400 }
      );
    }

    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer email is required." },
        { status: 400 }
      );
    }

    // ── Compute any add-on charges that might survive on a "free" order ──
    // Per Matt: "Only base video free; add-ons still chargeable." But we're
    // also skipping Stripe here. If the user selected chargeable add-ons
    // (1080P, or photo editing while non-subscriber), reject — they should
    // be going through /api/checkout instead.
    const addon1080 = resolution === "1080P";
    // Photo editing is free for subscribers/trial users (all free-first
    // users are trial subscribers by construction), so this shouldn't add cost.
    // If somehow a non-subscriber reaches this endpoint with photo editing on,
    // reject.
    const hasPaidAddons = addon1080 || (includeEditedPhotos && !usage.is_subscriber);

    if (hasPaidAddons) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your selected add-ons require payment. Please use the standard checkout.",
        },
        { status: 400 }
      );
    }

    // ── Build the order row ──
    const orderFields: Record<string, any> = {
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      photos: uploadedPhotos || [],
      photo_count: photoCount,
      listing_url: null,
      listing_package_price: null,
      listing_package_label: "Free First Video",
      listing_instructions: null,
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
      voiceover: false,
      voiceover_script: null,
      voiceover_voice: null,
      include_edited_photos: !!includeEditedPhotos,
      include_unbranded: !!includeUnbranded,
      include_address_on_card: body.includeAddressOnCard ?? true,
      custom_intro_card_url: customIntroCardUrl || null,
      custom_outro_card_url: customOutroCardUrl || null,
      total_price: 0,
      special_instructions: specialInstructions || null,
      is_quick_video: true,
      referral_code: body.referral_code || "free_first_video",
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,

      // Phase 1A
      agent_property_id: agent_property_id || null,
      special_features: special_features || {},
      room_tags: room_tags || [],
      photo_editing: !!photo_editing,
      is_first_order: true, // always true for this endpoint
    };

    let orderId: string;
    let orderRow: any = null;

    if (promoted_order_id) {
      orderId = promoted_order_id;
      const { data, error } = await supabase
        .from("orders")
        .update({
          ...orderFields,
          user_id: userId,
          status: "new", // pipeline trigger — skip pending_payment
          payment_status: "free_first_video",
          is_draft: false,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .select()
        .single();

      if (error) {
        console.error("[free-first-video] promote error:", error);
      } else {
        orderRow = data;
      }
    }

    if (!orderRow) {
      orderId = orderId! || randomUUID();
      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_id: orderId,
          user_id: userId,
          status: "new",
          payment_status: "free_first_video",
          ...orderFields,
        })
        .select()
        .single();

      if (error) {
        console.error("[free-first-video] insert error:", error);
        return NextResponse.json(
          { success: false, error: "Could not create your order. Try again." },
          { status: 500 }
        );
      }
      orderRow = data;
    }

    // ── Mark the credit used (atomically) ──
    // If this fails we still return success — the order exists. Log for support.
    try {
      await supabase
        .from("lens_usage")
        .update({
          free_first_video_used: true,
          free_first_video_used_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("free_first_video_used", false); // idempotency guard
    } catch (err) {
      console.error("[free-first-video] credit mark failed:", err);
    }

    // ── Ensure property portfolio entry exists ──
    if (propertyAddress) {
      try {
        await ensurePropertyExists(supabase, userId, propertyAddress, {
          city: propertyCity,
          state: propertyState,
          bedrooms: propertyBedrooms ? parseInt(propertyBedrooms) : undefined,
          bathrooms: propertyBathrooms ? parseInt(propertyBathrooms) : undefined,
        });
      } catch (err) {
        console.error("[free-first-video] portfolio create failed:", err);
      }
    }

    // ── Mirror special_features + listing_status to agent_properties ──
    if (agent_property_id) {
      try {
        const updates: Record<string, any> = {};
        if (special_features && Object.keys(special_features).length > 0) {
          updates.special_features_v2 = special_features;
        }
        if (listing_status) updates.listing_status = listing_status;
        if (Object.keys(updates).length > 0) {
          await supabase
            .from("agent_properties")
            .update(updates)
            .eq("id", agent_property_id);
        }
      } catch (err) {
        console.error("[free-first-video] property mirror failed:", err);
      }
    }

    // ── Save agent info to lens_usage (first-order side effect) ──
    if (agent_info) {
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
            .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" });
        }
      } catch (err) {
        console.error("[free-first-video] lens_usage profile save failed:", err);
      }
    }

    console.log(
      "[free-first-video] Order created:",
      orderId,
      `user:${userId.slice(0, 8)}`,
      `${photoCount}/${FREE_FIRST_VIDEO_MAX_CLIPS} clips`,
      userEmail ? `(${userEmail})` : ""
    );

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        order: orderRow,
      },
    });
  } catch (error) {
    console.error("[free-first-video] server error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
