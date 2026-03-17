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
      return NextResponse.json({ isBrokerage: false });
    }

    const adminSupabase = createAdminClient();

    // Step 1: Find member by email
    const { data: member, error: memberErr } = await adminSupabase
      .from("brokerage_members")
      .select("id, role, brokerage_id")
      .eq("email", user.email.toLowerCase())
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ isBrokerage: false });
    }

    // Step 2: Get the brokerage
    const { data: brokerage, error: brokerageErr } = await adminSupabase
      .from("brokerages")
      .select("id, company, tier, per_clip_rate, status")
      .eq("id", member.brokerage_id)
      .eq("status", "active")
      .single();

    if (brokerageErr || !brokerage) {
      return NextResponse.json({ isBrokerage: false });
    }

    return NextResponse.json({
      isBrokerage: true,
      brokerage: {
        id: brokerage.id,
        company: brokerage.company,
        tier: brokerage.tier,
        perClipRate: brokerage.per_clip_rate,
      },
      role: member.role,
    });
  } catch (error) {
    console.error("Brokerage status error:", error);
    return NextResponse.json({ isBrokerage: false });
  }
}
