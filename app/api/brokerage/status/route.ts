import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ isBrokerage: false });
    }

    const adminSupabase = (await import("@/lib/supabase/admin")).default;

    const { data: member } = await adminSupabase
      .from("brokerage_members")
      .select("id, role, brokerage_id, brokerages(id, company, tier, per_clip_rate, status)")
      .eq("email", user.email)
      .single();

    if (!member || !(member as any).brokerages || (member as any).brokerages.status !== "active") {
      return NextResponse.json({ isBrokerage: false });
    }

    const brokerage = (member as any).brokerages;

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
