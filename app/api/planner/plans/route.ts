// app/api/planner/plans/route.ts
// CRUD for marketing_plans + lifecycle campaign auto-generation
// GET — list plans
// POST — create a plan (manual or auto-generated lifecycle)
// PATCH — update plan
// DELETE — archive/delete plan

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaignForStatus, getCampaignName, generateScheduleDates } from "@/lib/planner/lifecycle";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "active";

    const { data: plans, error } = await supabase
      .from("marketing_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get schedule item counts per plan
    const planIds = (plans || []).map((p: { id: string }) => p.id);
    let scheduleCounts: Record<string, number> = {};

    if (planIds.length > 0) {
      const { data: counts } = await supabase
        .from("marketing_schedule")
        .select("plan_id")
        .in("plan_id", planIds);

      if (counts) {
        scheduleCounts = counts.reduce((acc: Record<string, number>, item: { plan_id: string }) => {
          acc[item.plan_id] = (acc[item.plan_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    const enriched = (plans || []).map((plan: { id: string }) => ({
      ...plan,
      itemCount: scheduleCounts[plan.id] || 0,
    }));

    return NextResponse.json({ plans: enriched });
  } catch (error) {
    console.error("Plans GET error:", error);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, propertyIds, autoGenerate, propertyId, propertyStatus } = body;

    // Auto-generate lifecycle campaign
    if (autoGenerate && propertyId && propertyStatus) {
      // Get property address
      const { data: prop } = await supabase
        .from("agent_properties")
        .select("address")
        .eq("id", propertyId)
        .single();

      const address = prop?.address || "Unknown";
      const campaign = getCampaignForStatus(propertyStatus);

      if (!campaign) {
        return NextResponse.json({ error: "No campaign template for this status" }, { status: 400 });
      }

      // Clear existing pending auto-generated items for this property
      await supabase
        .from("marketing_schedule")
        .delete()
        .eq("user_id", session.user.id)
        .eq("property_id", propertyId)
        .eq("auto_generated", true)
        .eq("status", "pending");

      // Create the plan
      const { data: plan, error: planError } = await supabase
        .from("marketing_plans")
        .insert({
          user_id: session.user.id,
          name: getCampaignName(propertyStatus, address),
          description: `Auto-generated ${propertyStatus} campaign`,
          property_ids: [propertyId],
          auto_generated: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Generate schedule items
      const scheduled = generateScheduleDates(new Date(), campaign);
      const items = scheduled.map(({ step, scheduledDate }) => ({
        user_id: session.user.id,
        property_id: propertyId,
        plan_id: plan.id,
        scheduled_date: scheduledDate,
        platform: step.platform,
        content_type: step.contentType,
        caption: null,
        auto_generated: true,
        status: "pending",
      }));

      const { error: scheduleError } = await supabase
        .from("marketing_schedule")
        .insert(items);

      if (scheduleError) throw scheduleError;

      return NextResponse.json({ plan, itemsCreated: items.length });
    }

    // Manual plan creation
    if (!name) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const { data: plan, error } = await supabase
      .from("marketing_plans")
      .insert({
        user_id: session.user.id,
        name,
        description: description || null,
        property_ids: propertyIds || [],
        auto_generated: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Plans POST error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, name, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from("marketing_plans")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ plan: data });
  } catch (error) {
    console.error("Plans PATCH error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
    }

    // Soft delete — archive the plan
    const { error } = await supabase
      .from("marketing_plans")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ archived: true });
  } catch (error) {
    console.error("Plans DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
