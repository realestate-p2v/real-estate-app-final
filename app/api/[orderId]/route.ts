import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/orders/[orderId] — fetch a single order for the delivery page
// Authenticated users: matches user_id
// Unauthenticated: matches order_id (for email link access)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let order = null;

    if (user) {
      // Logged in — try matching by id or order_id with user_id check
      const { data: byId } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (byId) {
        order = byId;
      } else {
        const { data: byOrderId } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .single();
        order = byOrderId;
      }
    }

    // Fallback: try by order_id without user check (for email link access)
    // Only return limited fields for security
    if (!order) {
      const { data: byOrderId } = await supabase
        .from("orders")
        .select("id, order_id, status, customer_name, property_address, property_city, property_state, property_bedrooms, property_bathrooms, photo_count, resolution, orientation, delivery_url, edited_photos_url, created_at, include_edited_photos, music_selection, branding_type")
        .eq("order_id", orderId)
        .in("status", ["complete", "approved"])
        .single();
      order = byOrderId;
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
