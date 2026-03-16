import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { sessionId, revisionId } = await request.json();

    if (!sessionId || !revisionId) {
      return NextResponse.json(
        { success: false, error: "sessionId and revisionId are required" },
        { status: 400 }
      );
    }

    // Verify the Stripe session is actually paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify this session is for a revision (prevent reuse)
    if (session.metadata?.type !== "revision" || session.metadata?.revisionId !== revisionId) {
      return NextResponse.json(
        { success: false, error: "Invalid session for this revision" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the pending revision request
    const { data: revision, error: revisionError } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("id", revisionId)
      .single();

    if (revisionError || !revision) {
      return NextResponse.json(
        { success: false, error: "Revision request not found" },
        { status: 404 }
      );
    }

    // Prevent double-confirmation
    if (revision.status !== "awaiting_payment") {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        message: "This revision has already been confirmed.",
      });
    }

    const realOrderId = revision.order_id;
    const clips = revision.clips || [];

    // Mark revision as paid and pending processing
    const { error: updateRevisionError } = await supabase
      .from("revision_requests")
      .update({
        status: "pending",
        is_paid: true,
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq("id", revisionId);

    if (updateRevisionError) {
      console.error("[Revision Confirm] Failed to update revision:", updateRevisionError);
      return NextResponse.json(
        { success: false, error: "Failed to update revision status" },
        { status: 500 }
      );
    }

    // Build revision notes string for pipeline
    const revisionNotes = clips
      .map(
        (c: any) =>
          `[${c.position}] ${c.camera_direction || ""} ${c.problem_description || ""} ${c.action === "remove" ? "REMOVE" : ""}`.trim()
      )
      .join(", ");

    // Update the order to trigger the pipeline
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "revision_requested",
        revision_count: revision.revision_number,
        client_revision_notes: clips,
        revision_notes: revisionNotes,
      })
      .eq("id", realOrderId);

    if (updateOrderError) {
      console.error("[Revision Confirm] Failed to update order:", updateOrderError);
      // Don't fail here — the revision is paid, we can fix the order manually
    }

    // Get order details for Telegram notification
    const { data: order } = await supabase
      .from("orders")
      .select("property_address, customer_email")
      .eq("id", realOrderId)
      .single();

    // Send Telegram notification
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const clipSummary = clips
          .map(
            (c: any) =>
              `  [${c.position}] ${c.action === "remove" ? "REMOVE" : c.camera_direction || "change"} — ${c.problem_description || "no notes"}`
          )
          .join("\n");
        const address = order?.property_address || realOrderId.slice(0, 8);
        const telegramMsg = `🔄💰 *Paid Revision Confirmed*\n\n📍 *${address}*\nRevision #${revision.revision_number} — *$${revision.payment_amount}*\n${clips.length} clip(s) affected\n\n${clipSummary}\n\n${revision.notes ? `📝 Notes: ${revision.notes}\n\n` : ""}✅ Payment confirmed via Stripe\nPipeline will process automatically.`;
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: telegramMsg,
              parse_mode: "Markdown",
            }),
          }
        );
      }
    } catch (telegramErr) {
      console.error("[Revision Confirm] Telegram notification failed:", telegramErr);
    }

    return NextResponse.json({
      success: true,
      revisionNumber: revision.revision_number,
      paymentAmount: revision.payment_amount,
      message: `Revision #${revision.revision_number} confirmed and paid ($${revision.payment_amount}). Processing will begin shortly.`,
    });
  } catch (error) {
    console.error("[Revision Confirm] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
