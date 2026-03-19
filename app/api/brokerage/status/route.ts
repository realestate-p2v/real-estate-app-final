import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ isBrokerage: false, success: false });
    }

    const adminSupabase = createAdminClient();

    // Step 1: Find member by email
    const { data: member, error: memberErr } = await adminSupabase
      .from("brokerage_members")
      .select("id, role, brokerage_id")
      .eq("email", user.email.toLowerCase())
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ isBrokerage: false, success: false });
    }

    // Step 2: Get the brokerage
    const { data: brokerage, error: brokerageErr } = await adminSupabase
      .from("brokerages")
      .select("id, company, tier, per_clip_rate, status")
      .eq("id", member.brokerage_id)
      .eq("status", "active")
      .single();

    if (brokerageErr || !brokerage) {
      return NextResponse.json({ isBrokerage: false, success: false });
    }

    // Step 3: Get member count for this brokerage
    const { count: memberCount } = await adminSupabase
      .from("brokerage_members")
      .select("id", { count: "exact", head: true })
      .eq("brokerage_id", brokerage.id);

    // Step 4: Get all orders for this brokerage
    const { data: orders } = await adminSupabase
      .from("orders")
      .select("id, order_id, status, property_address, customer_email, photos, created_at, delivery_url")
      .eq("brokerage_id", brokerage.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      isBrokerage: true,
      success: true,
      brokerage: {
        id: brokerage.id,
        company: brokerage.company,
        tier: brokerage.tier,
        per_clip_rate: brokerage.per_clip_rate,
        perClipRate: brokerage.per_clip_rate,
        status: brokerage.status,
      },
      role: member.role,
      orders: orders || [],
      memberCount: memberCount || 0,
    });
  } catch (error) {
    console.error("Brokerage status error:", error);
    return NextResponse.json({ isBrokerage: false, success: false });
  }
}
