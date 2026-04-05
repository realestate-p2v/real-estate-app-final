import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const NEW_CLIP_PRICE = 4.95;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, clips, notes, sequence, newClips } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const hasClipChanges = clips && Array.isArray(clips) && clips.length > 0;
    const hasNewClips = newClips && Array.isArray(newClips) && newClips.length > 0;

    if (!hasClipChanges && !hasNewClips) {
      return NextResponse.json(
        { success: false, error: "No billable changes. Reordering and removals are free — submit directly." },
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

    // ── Calculate pricing ──

    // Revised clips — tiered pricing (only if past free revisions)
    const reviseClips = hasClipChanges ? clips.filter((c: any) => c.action === "revise") : [];
    const reviseCount = reviseClips.length;
    let reviseCost = 0;
    let pricePerReviseClip = 0;

    if (!isFree && reviseCount > 0) {
      const is1080 = order.resolution === "1080P";
      if (reviseCount === 1) pricePerReviseClip = is1080 ? 2.49 : 1.99;
      else if (reviseCount <= 5) pricePerReviseClip = is1080 ? 1.99 : 1.49;
      else if (reviseCount <= 15) pricePerReviseClip = is1080 ? 1.74 : 1.24;
      else pricePerReviseClip = is1080 ? 1.49 : 0.99;
      reviseCost = Math.round(reviseCount * pricePerReviseClip * 100) / 100;
    }

    // New clips — always $4.95 each regardless of free/paid revision status
    const newClipCount = hasNewClips ? newClips.length : 0;
    const newClipCost = Math.round(newClipCount * NEW_CLIP_PRICE * 100) / 100;

    const totalAmount = Math.round((reviseCost + newClipCost) * 100) / 100;
    const amountCents = Math.round(totalAmount * 100);

    // If everything is actually free (free revision, no new clips)
    if (totalAmount === 0) {
      return NextResponse.json({
        success: false,
        error: "This revision is free. Submit directly without payment.",
        isFree: true,
      });
    }

    const origin = request.headers.get("origin") || "https://realestatephoto2video.com";

    // Store the pending revision data so we can retrieve it after payment
    const { data: pendingRevision, error: insertError } = await supabase
      .from("revision_requests")
      .insert({
        order_id: realOrderId,
        revision_number: revisionNumber,
        is_paid: true,
        payment_amount: totalAmount,
        status: "awaiting_payment",
        clips: hasClipChanges ? clips : [],
        notes: notes || "",
        sequence: sequence || null,
        new_clips: hasNewClips ? newClips : null,
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

    // Build Stripe line items
    const address = order.property_address || `Order ${(order.order_id || order.id).slice(0, 8)}`;
    const lineItems: any[] = [];

    if (reviseCost > 0) {
      const reviseDescription = `${reviseCount} clip${reviseCount !== 1 ? "s" : ""} × $${pricePerReviseClip.toFixed(2)}/clip (${order.resolution || "768P"})`;
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Video Revision — ${address}`,
            description: reviseDescription,
          },
          unit_amount: Math.round(reviseCost * 100),
        },
        quantity: 1,
      });
    }

    if (newClipCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `New Clips — ${address}`,
            description: `${newClipCount} new clip${newClipCount !== 1 ? "s" : ""} × $${NEW_CLIP_PRICE.toFixed(2)}/clip`,
          },
          unit_amount: Math.round(newClipCost * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
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
        reviseClipCount: String(reviseCount),
        newClipCount: String(newClipCount),
        totalAmount: totalAmount.toFixed(2),
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount: totalAmount,
      reviseCount,
      newClipCount,
      pricePerReviseClip,
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
