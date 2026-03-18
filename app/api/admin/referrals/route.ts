import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { isAdmin: admin } = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const supabase = createAdminClient();

    // Get all referral codes with their earnings
    const { data: codes, error: cErr } = await supabase
      .from("referral_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (cErr) throw cErr;

    const { data: earnings, error: eErr } = await supabase
      .from("referral_earnings")
      .select("*")
      .order("created_at", { ascending: false });

    if (eErr) throw eErr;

    // Attach earnings to each code
    const enriched = (codes || []).map((code: any) => {
      const codeEarnings = (earnings || []).filter((e: any) => e.referral_code_id === code.id);
      const totalEarned = codeEarnings.reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
      const totalPaid = codeEarnings.filter((e: any) => e.status === "paid").reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
      const totalPending = totalEarned - totalPaid;

      return {
        ...code,
        earnings: codeEarnings,
        stats: {
          totalEarned,
          totalPaid,
          totalPending,
          totalOrders: codeEarnings.length,
          pendingCount: codeEarnings.filter((e: any) => e.status === "pending").length,
        },
      };
    });

    // Summary stats
    const totalPendingPayouts = enriched.reduce((s: number, c: any) => s + c.stats.totalPending, 0);
    const totalPendingCount = enriched.reduce((s: number, c: any) => s + c.stats.pendingCount, 0);
    const partnersWithPending = enriched.filter((c: any) => c.stats.totalPending > 0).length;

    return NextResponse.json({
      success: true,
      codes: enriched,
      summary: {
        totalPartners: (codes || []).length,
        activePartners: (codes || []).filter((c: any) => c.status === "active").length,
        totalPendingPayouts,
        totalPendingCount,
        partnersWithPending,
      },
    });
  } catch (error) {
    console.error("Admin referrals error:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { isAdmin: admin } = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Mark individual earning as paid
    if (body.action === "mark_paid") {
      const { error } = await supabase
        .from("referral_earnings")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", body.earning_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Mark ALL pending earnings for a partner as paid
    if (body.action === "mark_all_paid") {
      const { error } = await supabase
        .from("referral_earnings")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("referral_code_id", body.code_id)
        .eq("status", "pending");

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Toggle partner status
    if (body.action === "toggle_status") {
      const { data: current } = await supabase
        .from("referral_codes")
        .select("status")
        .eq("id", body.code_id)
        .single();

      const newStatus = current?.status === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("referral_codes")
        .update({ status: newStatus })
        .eq("id", body.code_id);

      if (error) throw error;
      return NextResponse.json({ success: true, status: newStatus });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin referrals POST error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
