// app/api/planner/sprint/delete/route.ts
// Deletes an active sprint plan and all its scheduled posts
// POST { planId?: string } — if no planId, deletes ALL active sprints for the user

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();
    const { planId } = body;

    if (planId) {
      // Delete specific plan's schedule rows
      await supabase.from("marketing_schedule").delete().eq("plan_id", planId).eq("user_id", userId);
      // Archive the plan
      await supabase.from("marketing_plans").update({ status: "archived" }).eq("id", planId).eq("user_id", userId);
    } else {
      // Get all active plans
      const { data: plans } = await supabase
        .from("marketing_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active");

      if (plans && plans.length > 0) {
        const planIds = plans.map(p => p.id);
        // Delete all schedule rows for these plans
        await supabase.from("marketing_schedule").delete().in("plan_id", planIds).eq("user_id", userId);
        // Archive all plans
        await supabase.from("marketing_plans").update({ status: "archived" }).in("id", planIds).eq("user_id", userId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sprint delete error:", error);
    return NextResponse.json({ error: "Failed to delete sprint" }, { status: 500 });
  }
}
