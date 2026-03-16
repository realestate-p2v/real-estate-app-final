import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Try by id first, then by order_id
    let { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      const result = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      order = result.data;
      error = result.error;
    }

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("[Order API] GET Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Only allow specific status transitions from the client
    const allowedStatuses = ["closed"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Only 'closed' is allowed from client." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Find the order
    let order: any = null;
    const result1 = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (result1.data) {
      order = result1.data;
    } else {
      const result2 = await supabase
        .from("orders")
        .select("id, status")
        .eq("order_id", orderId)
        .single();
      order = result2.data;
    }

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Only allow closing delivered/complete/approved orders
    const closableStatuses = ["delivered", "complete", "approved"];
    if (!closableStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot close order with status '${order.status}'` },
        { status: 400 }
      );
    }

    // Close the order
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "closed" })
      .eq("id", order.id);

    if (updateError) {
      console.error("[Order API] PATCH update error:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Order closed successfully" });
  } catch (error) {
    console.error("[Order API] PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
