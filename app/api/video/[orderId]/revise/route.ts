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

    // Try by id first, then by order_id
    let { data: order, error } = await supabase
      .from("orders")
      .select("id, revision_count, revisions_allowed, clip_urls, resolution, property_address, status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      const result = await supabase
        .from("orders")
        .select("id, revision_count, revisions_allowed, clip_urls, resolution, property_address, status")
        .eq("order_id", orderId)
        .single();
      order = result.data;
      error = result.error;
    }

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const realOrderId = order.id;

    // Get revision history
    const { data: revisions } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("order_id", realOrderId)
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

    const { clips, notes, sequence, newClips, adminBypass } = await request.json();

    // Allow empty clips array for reorder-only or new-clip-only submissions
    // But require at least SOME change: clips, sequence reorder, or newClips
    const hasClipChanges = clips && Array.isArray(clips) && clips.length > 0;
    const hasNewClips = newClips && Array.isArray(newClips) && newClips.length > 0;
    const hasSequence = sequence && Array.isArray(sequence) && sequence.length > 0;

    if (!hasClipChanges && !hasNewClips && !hasSequence) {
      return NextResponse.json({ success: false, error: "No changes submitted" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try by id first, then by order_id
    let order = null;
    let orderError = null;

    const result1 = await supabase
      .from("orders")
      .select("id, revision_count, revisions_allowed, resolution, property_address, customer_email")
      .eq("id", orderId)
      .single();
    
    if (result1.data) {
      order = result1.data;
    } else {
      const result2 = await supabase
        .from("orders")
        .select("id, revision_count, revisions_allowed, resolution, property_address, customer_email")
        .eq("order_id", orderId)
        .single();
      order = result2.data;
      orderError = result2.error;
    }

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const realOrderId = order.id;

    // Verify admin bypass server-side
    const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
    const isAdminRequest = adminBypass && order.customer_email && ADMIN_EMAILS.includes(order.customer_email);

    const revisionNumber = (order.revision_count || 0) + 1;
    const isFree = revisionNumber <= (order.revisions_allowed || 1);

    // Calculate cost for paid revisions
    let paymentAmount = 0;
    if (!isFree && hasClipChanges) {
      const clipCount = clips.length;
      const is1080 = order.resolution === "1080P";
      let pricePerClip;
      if (clipCount === 1) pricePerClip = is1080 ? 2.49 : 1.99;
      else if (clipCount <= 5) pricePerClip = is1080 ? 1.99 : 1.49;
      else if (clipCount <= 15) pricePerClip = is1080 ? 1.74 : 1.24;
      else pricePerClip = is1080 ? 1.49 : 0.99;
      paymentAmount += Math.round(clipCount * pricePerClip * 100) / 100;
    }

    // New clips always cost $4.95 each
    const newClipCount = hasNewClips ? newClips.length : 0;
    if (newClipCount > 0) {
      paymentAmount += Math.round(newClipCount * 4.95 * 100) / 100;
    }
    paymentAmount = Math.round(paymentAmount * 100) / 100;

    // Admin skips payment entirely
    if (paymentAmount > 0 && !isAdminRequest) {
      return NextResponse.json({
        success: false,
        requiresPayment: true,
        paymentAmount,
        revisionNumber,
        clipCount: hasClipChanges ? clips.length : 0,
        newClipCount,
        message: `This revision requires payment of $${paymentAmount.toFixed(2)}.`,
      });
    }

    // Create revision request
    const { data: revision, error } = await supabase
      .from("revision_requests")
      .insert({
        order_id: realOrderId,
        revision_number: revisionNumber,
        is_paid: false,
        payment_amount: 0,
        status: "pending",
        clips: hasClipChanges ? clips : [],
        notes: notes || "",
        sequence: sequence || null,
        new_clips: hasNewClips ? newClips : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const revisionNotes = hasClipChanges
      ? clips.map((c: any) =>
          `[${c.position}] ${c.camera_direction || ""} ${c.problem_description || ""} ${c.action === "remove" ? "REMOVE" : ""}`.trim()
        ).join(", ")
      : "";

    const updateData: any = {
      status: "revision_requested",
      revision_count: revisionNumber,
      clip_reorder: sequence || null,
    };
    if (hasClipChanges) {
      updateData.client_revision_notes = clips;
      updateData.revision_notes = revisionNotes;
    }
    if (hasNewClips) {
      updateData.new_clips = newClips;
    }

    await supabase
      .from("orders")
      .update(updateData)
      .eq("id", realOrderId);

    // Telegram notification
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const clipSummary = hasClipChanges
          ? clips.map((c: any) =>
              `  [${c.position}] ${c.action === "remove" ? "REMOVE" : c.camera_direction || "change"} — ${c.problem_description || "no notes"}`
            ).join("\n")
          : "  No clip changes";
        const reorderNote = sequence && sequence.some((s: any) => s.original_position !== s.new_position)
          ? `\n🔀 Clips reordered: ${sequence.map((s: any) => `${s.original_position}→${s.new_position}`).join(", ")}`
          : "";
        const newClipNote = newClipCount > 0
          ? `\n➕ ${newClipCount} new clip${newClipCount !== 1 ? "s" : ""} added`
          : "";
        const telegramMsg = `🔄 *Client Revision Request*\n\n📍 *${order.property_address || orderId.slice(0, 8)}*\nRevision #${revisionNumber} (free)${reorderNote}${newClipNote}\n${hasClipChanges ? `${clips.length} clip(s) affected` : "Reorder only"}\n\n${clipSummary}\n\n${notes ? `📝 Notes: ${notes}\n\n` : ""}Go to admin dashboard to review.`;
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
      isFree: true,
      message: `Revision ${revisionNumber} submitted (free). We'll process it within 24 hours.`,
    });
  } catch (error) {
    console.error("[Public Revision API] POST error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
