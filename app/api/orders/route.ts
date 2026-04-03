import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { ensurePropertyExists } from "@/lib/utils/portfolio"

// GET all orders for admin dashboard
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST to create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
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
    } = body
    
    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: "Customer email is required" },
        { status: 400 }
      )
    }

    // Try to get authenticated user's ID
    let userId = null;
    try {
      const authSupabase = await createClient();
      const { data: { user } } = await authSupabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Not logged in — that's fine, order still works
    }

    const orderId = randomUUID()
    const photoCount = uploadedPhotos?.length || 0

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        user_id: userId,
        status: "pending_payment",
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
        orientation: orientation || "landscape",
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
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Auto-create property portfolio entry
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
        // Don't fail the order if portfolio creation fails
      }
    }

    console.log("[Orders] Created order:", orderId, userId ? `(user: ${userId.slice(0, 8)})` : "(no user)", includeUnbranded ? "(+unbranded copy)" : "", is_quick_video ? "(quick video)" : "")

    return NextResponse.json({
      success: true,
      data: { orderId, order: data },
    })
  } catch (error) {
    console.error("Server error creating order:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH to update order status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      )
    }

    const validStatuses = ["New", "Processing", "Delivered"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("orders")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
