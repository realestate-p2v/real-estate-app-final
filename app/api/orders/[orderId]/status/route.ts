// app/api/orders/[orderId]/status/route.ts
// Phase 1A — status polling endpoint for the processing interstitial.
//
// Returns the minimum info the interstitial needs to compute progress and
// decide when to redirect to the delivery page:
//   - video_status: derived from orders.status + orders.delivery_url
//     ('complete' when delivery_url exists; 'processing' when status='new'
//     or 'processing'; 'failed' when status='failed'; 'pending' when
//     payment not yet captured)
//   - description_status: orders.description_status (written by the
//     sample-content trigger built in a later phase)
//   - sample_content_generated: orders.sample_content_generated
//   - is_first_order: orders.is_first_order
//   - delivered_at, payment_status, error_message passed through
//
// Auth: requires the requester to be the order owner OR the admin.
// Anonymous orders (legacy) are accessible by orderId alone — matches
// existing behavior where the success page reads orders by orderId.

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "order_id, user_id, status, payment_status, delivery_url, delivered_at, description_status, sample_content_generated, is_first_order, error_message"
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      console.error("[order-status] fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Lookup failed" },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // ── Auth check ──
    // If the order has a user_id, require the requester to match OR be admin.
    // If the order has no user_id (legacy guest checkout), allow access by
    // orderId alone — this matches how /order/success currently works.
    if (order.user_id) {
      try {
        const authSupabase = await createClient();
        const {
          data: { user },
        } = await authSupabase.auth.getUser();
        const requesterId = user?.id || null;
        const requesterEmail = user?.email || null;
        const isAdmin = requesterEmail ? ADMIN_EMAILS.includes(requesterEmail) : false;

        if (!isAdmin && requesterId !== order.user_id) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error("[order-status] auth check error:", err);
        return NextResponse.json(
          { success: false, error: "Auth failed" },
          { status: 401 }
        );
      }
    }

    // ── Derive video_status from existing orders columns ──
    const status = String(order.status || "").toLowerCase();
    let video_status: "pending" | "processing" | "complete" | "failed" | "unknown" = "unknown";

    if (order.delivery_url || order.delivered_at) {
      video_status = "complete";
    } else if (status === "failed" || status === "error") {
      video_status = "failed";
    } else if (status === "new" || status === "processing") {
      video_status = "processing";
    } else if (status === "pending_payment") {
      video_status = "pending";
    } else {
      // Fall back: if payment_status is paid/admin_bypass/free_first_video
      // we treat it as processing.
      const ps = String(order.payment_status || "").toLowerCase();
      if (ps === "paid" || ps === "admin_bypass" || ps === "free_first_video") {
        video_status = "processing";
      } else {
        video_status = "pending";
      }
    }

    return NextResponse.json({
      success: true,
      video_status,
      description_status: order.description_status || null,
      sample_content_generated: !!order.sample_content_generated,
      is_first_order: !!order.is_first_order,
      delivered_at: order.delivered_at,
      payment_status: order.payment_status,
      error_message: order.error_message || null,
    });
  } catch (err) {
    console.error("[order-status] server error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
