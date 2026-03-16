import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, clips, notes } = body;

    if (!orderId || !clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderId and clips are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the order — try by id first, then by order_id
    let order: any = null;
    const result1 = await supabase
      .from("orders")
      .select("id, order_id, revision_count, revisions_allowed, resolution, property_address, customer_email, customer_name")
      .eq("id", orderId)
      .single();

    if (result1.data) {
      order = result1.data;
    } else {
      const result2 = await supabase
        .from("orders")
        .select("id, order_id, revision_count, revisions_allowed, resolution, property_address, customer_email, customer_name")
        .eq("order_id", orderId)
        .single();
      order = result2.data;
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const realOrderId = order.id;
    const revisionNumber = (order.revision_count || 0) + 1;
    const isFree = revisionNumber <= (order.revisions_allowed || 1);

    // If this is a free revision, don't create a checkout — tell frontend to submit directly
    if (isFree) {
      return NextResponse.json({
        success: false,
        error: "This revision is free. Submit directly without payment.",
        isFree: true,
      });
    }

    // Calculate per-clip pricing with volume tiers
    const clipCount = clips.filter((c: any) => c.action === "revise").length;
    if (clipCount === 0) {
      return NextResponse.json({
        success: false,
        error: "No clips marked for revision. Removals and reordering are free.",
      });
    }

    const is1080 = order.resolution === "1080P";
    let pricePerClip: number;
    if (clipCount === 1) pricePerClip = is1080 ? 2.49 : 1.99;
    else if (clipCount <= 5) pricePerClip = is1080 ? 1.99 : 1.49;
    else if (clipCount <= 15) pricePerClip = is1080 ? 1.74 : 1.24;
    else pricePerClip = is1080 ? 1.49 : 0.99;

    const totalAmount = Math.round(clipCount * pricePerClip * 100) / 100;
    const amountCents = Math.round(totalAmount * 100);

    const origin = request.headers.get("origin") || "https://realestatephoto2video.com";

    // Store the pending revision data so we can retrieve it after payment
    // We store clips + notes in a pending revision_requests row with status "awaiting_payment"
    const { data: pendingRevision, error: insertError } = await supabase
      .from("revision_requests")
      .insert({
        order_id: realOrderId,
        revision_number: revisionNumber,
        is_paid: true,
        payment_amount: totalAmount,
        status: "awaiting_payment",
        clips,
        notes: notes || "",
      })
      .select("id")
      .single();

    if (insertError || !pendingRevision) {
      console.error("[Revision Checkout] Failed to create pending revision:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create revision request" },
        { status: 500 }
      );
    }

    // Build a nice description for the Stripe line item
    const address = order.property_address || `Order ${(order.order_id || order.id).slice(0, 8)}`;
    const description = `${clipCount} clip${clipCount !== 1 ? "s" : ""} × $${pricePerClip.toFixed(2)}/clip (${order.resolution || "768P"})`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Video Revision — ${address}`,
              description,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/video/${orderId}/revise/success?session_id={CHECKOUT_SESSION_ID}&revision_id=${pendingRevision.id}`,
      cancel_url: `${origin}/video/${orderId}/revise?cancelled=true`,
      customer_email: order.customer_email || undefined,
      metadata: {
        type: "revision",
        orderId: realOrderId,
        urlOrderId: orderId,
        revisionId: pendingRevision.id,
        revisionNumber: String(revisionNumber),
        clipCount: String(clipCount),
        totalAmount: totalAmount.toFixed(2),
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount: totalAmount,
      clipCount,
      pricePerClip,
    });
  } catch (error) {
    console.error("[Revision Checkout] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
