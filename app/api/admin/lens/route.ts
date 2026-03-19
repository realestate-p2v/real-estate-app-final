import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Waitlist stats
    const { data: waitlistAll, error: wErr } = await supabase
      .from("lens_waitlist")
      .select("id, email, name, interest, company, created_at")
      .order("created_at", { ascending: false });

    const waitlist = waitlistAll || [];
    const waitlistTotal = waitlist.length;
    const waitlistIndividual = waitlist.filter((w) => w.interest === "individual").length;
    const waitlistBrokerage = waitlist.filter((w) => w.interest === "brokerage").length;

    // Waitlist signups last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = waitlist.filter(
      (w) => new Date(w.created_at) >= sevenDaysAgo
    ).length;

    // Waitlist signups last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const todaySignups = waitlist.filter(
      (w) => new Date(w.created_at) >= oneDayAgo
    ).length;

    // Recent waitlist entries (last 20)
    const recentWaitlist = waitlist.slice(0, 20);

    // Subscriber stats (placeholder — will pull from lens_subscriptions when table exists)
    // For now, return zeros so the UI is ready
    const subscribers = {
      total: 0,
      individual: 0,
      brokerage: 0,
      brokerageAgents: 0,
      mrr: 0,
      arr: 0,
    };

    // Analyses stats (placeholder — will pull from lens_analyses when table exists)
    const analyses = {
      totalAllTime: 0,
      thisMonth: 0,
      today: 0,
      avgPerUser: 0,
    };

    // Revenue stats (placeholder)
    const revenue = {
      mtd: 0,
      lastMonth: 0,
      ltv: 0,
      churnRate: 0,
    };

    return NextResponse.json({
      success: true,
      waitlist: {
        total: waitlistTotal,
        individual: waitlistIndividual,
        brokerage: waitlistBrokerage,
        recentSignups,
        todaySignups,
        entries: recentWaitlist,
      },
      subscribers,
      analyses,
      revenue,
    });
  } catch (err) {
    console.error("Admin Lens API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
