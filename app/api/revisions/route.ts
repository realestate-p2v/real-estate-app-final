import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    // Verify order belongs to user
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, revision_count, revisions_allowed, clip_urls, resolution")
      .eq("id", orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Get revision history
    const { data: revisions } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      revisionCount: order.revision_count || 0,
      revisionsAllowed: order.revisions_allowed || 1,
      clipUrls: order.clip_urls || [],
      resolution: order.resolution || "768P",
      revisions: revisions || [],
    });
  } catch (error) {
    console.error("[Revisions API] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, clips, notes } = await request.json();
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });
    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ success: false, error: "At least one clip revision required" }, { status: 400 });
    }

    // Verify order belongs to user
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, revision_count, revisions_allowed, resolution, property_address")
      .eq("id", orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const revisionNumber = (order.revision_count || 0) + 1;
    const isFree = revisionNumber <= (order.revisions_allowed || 1);

    // Calculate cost for paid revisions
    let paymentAmount = 0;
    if (!isFree) {
      const clipCount = clips.length;
      const is1080 = order.resolution === "1080P";
      let pricePerClip;
      if (clipCount === 1) pricePerClip = is1080 ? 2.49 : 1.99;
      else if (clipCount <= 5) pricePerClip = is1080 ? 1.99 : 1.49;
      else if (clipCount <= 15) pricePerClip = is1080 ? 1.74 : 1.24;
      else pricePerClip = is1080 ? 1.49 : 0.99;
      paymentAmount = Math.round(clipCount * pricePerClip * 100) / 100;
    }

    // For paid revisions, we'd redirect to Stripe checkout here
    // For now, create the revision request and flag it
    if (!isFree && paymentAmount > 0) {
      return NextResponse.json({
        success: false,
        requiresPayment: true,
        paymentAmount,
        revisionNumber,
        clipCount: clips.length,
        message: `Revision ${revisionNumber} requires payment of $${paymentAmount.toFixed(2)} for ${clips.length} clip(s).`,
      });
    }

    // Create revision request
    const { data: revision, error } = await supabase
      .from("revision_requests")
      .insert({
        order_id: orderId,
        revision_number: revisionNumber,
        is_paid: !isFree,
        payment_amount: paymentAmount,
        status: "pending",
        clips,
        notes: notes || "",
      })
      .select()
      .single();

    if (error) {
      console.error("[Revisions API] Insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Build revision notes string for pipeline
    const revisionNotes = clips.map((c: any) =>
      `[${c.position}] ${c.camera_direction || ""} ${c.problem_description || ""} ${c.action === "remove" ? "REMOVE" : ""}`.trim()
    ).join(", ");

    // Update order status to trigger pipeline
    await supabase
      .from("orders")
      .update({
        status: "client_revision_requested",
        revision_count: revisionNumber,
        client_revision_notes: clips,
        revision_notes: revisionNotes,
      })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      revision,
      revisionNumber,
      isFree,
      message: `Revision ${revisionNumber} submitted${isFree ? " (free)" : ""}. We'll process it within 24 hours.`,
    });
  } catch (error) {
    console.error("[Revisions API] POST error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
