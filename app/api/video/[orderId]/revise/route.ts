import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params;
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, revision_count, revisions_allowed, clip_urls, resolution, property_address, status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
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
      address: order.property_address || "",
      status: order.status,
      revisions: revisions || [],
    });
  } catch (error) {
    console.error("[Public Revision API] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params;
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });

    const { clips, notes } = await request.json();
    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ success: false, error: "At least one clip revision required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, revision_count, revisions_allowed, resolution, property_address, customer_email")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
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
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const revisionNotes = clips.map((c: any) =>
      `[${c.position}] ${c.camera_direction || ""} ${c.problem_description || ""} ${c.action === "remove" ? "REMOVE" : ""}`.trim()
    ).join(", ");

    await supabase
      .from("orders")
      .update({
        status: "revision_requested",
        revision_count: revisionNumber,
        client_revision_notes: clips,
        revision_notes: revisionNotes,
      })
      .eq("id", orderId);

    // Telegram notification
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const clipSummary = clips.map((c: any) =>
          `  [${c.position}] ${c.action === "remove" ? "REMOVE" : c.camera_direction || "change"} — ${c.problem_description || "no notes"}`
        ).join("\n");
        const telegramMsg = `🔄 *Client Revision Request*\n\n📍 *${order.property_address || orderId.slice(0, 8)}*\nRevision #${revisionNumber} ${isFree ? "(free)" : `($${paymentAmount})`}\n${clips.length} clip(s) affected\n\n${clipSummary}\n\n${notes ? `📝 Notes: ${notes}\n\n` : ""}Go to admin dashboard to review.`;
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: "Markdown" }),
        });
      }
    } catch (telegramErr) {
      console.error("[Public Revision API] Telegram failed:", telegramErr);
    }

    return NextResponse.json({
      success: true,
      revision,
      revisionNumber,
      isFree,
      message: `Revision ${revisionNumber} submitted${isFree ? " (free)" : ""}. We'll process it within 24 hours.`,
    });
  } catch (error) {
    console.error("[Public Revision API] POST error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
