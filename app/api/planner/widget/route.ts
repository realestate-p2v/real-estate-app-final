// app/api/planner/widget/route.ts
// Lightweight endpoint for the dashboard compact widget
// Returns today/tomorrow/overdue schedule items + compact content scores

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Parallel queries
    const [todayRes, tomorrowRes, overdueRes, propertiesRes] = await Promise.all([
      supabase
        .from("marketing_schedule")
        .select("id, property_id, scheduled_date, platform, content_type, caption, status, asset_url")
        .eq("user_id", userId)
        .eq("scheduled_date", today)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("marketing_schedule")
        .select("id, property_id, scheduled_date, platform, content_type, caption, status, asset_url")
        .eq("user_id", userId)
        .eq("scheduled_date", tomorrow)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("marketing_schedule")
        .select("id, property_id, scheduled_date, platform, content_type, caption, status, asset_url")
        .eq("user_id", userId)
        .lt("scheduled_date", today)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true })
        .limit(5),
      supabase
        .from("agent_properties")
        .select("id, address")
        .eq("user_id", userId),
    ]);

    const properties = propertiesRes.data || [];
    const propertyMap = new Map(
      properties.map((p: { id: string; address: string }) => [p.id, p.address])
    );

    // Attach property addresses to schedule items
    const enrichItem = (item: {
      id: string;
      property_id?: string;
      scheduled_date: string;
      platform: string;
      content_type: string;
      caption?: string;
      status: string;
      asset_url?: string;
    }) => ({
      ...item,
      propertyAddress: item.property_id ? propertyMap.get(item.property_id) || "Unknown" : "Personal",
    });

    return NextResponse.json({
      today: (todayRes.data || []).map(enrichItem),
      tomorrow: (tomorrowRes.data || []).map(enrichItem),
      overdue: (overdueRes.data || []).map(enrichItem),
      todayDate: today,
      tomorrowDate: tomorrow,
    });
  } catch (error) {
    console.error("Widget API error:", error);
    return NextResponse.json({ error: "Failed to load widget data" }, { status: 500 });
  }
}
