import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { isAdmin: admin } = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const supabase = createAdminClient();

    const { data: brokerages, error: bErr } = await supabase
      .from("brokerages")
      .select("*")
      .order("created_at", { ascending: false });

    if (bErr) throw bErr;

    const { data: members, error: mErr } = await supabase
      .from("brokerage_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (mErr) throw mErr;

    const brokerageIds = (brokerages || []).map((b: any) => b.id);
    let orders: any[] = [];
    if (brokerageIds.length > 0) {
      const { data: orderData, error: oErr } = await supabase
        .from("orders")
        .select("id, order_id, brokerage_id, status, property_address, customer_email, photos, created_at, delivery_url")
        .in("brokerage_id", brokerageIds)
        .order("created_at", { ascending: false });

      if (!oErr && orderData) orders = orderData;
    }

    const enriched = (brokerages || []).map((b: any) => {
      const bMembers = (members || []).filter((m: any) => m.brokerage_id === b.id);
      const bOrders = orders.filter((o: any) => o.brokerage_id === b.id);
      const totalClips = bOrders.reduce((sum: number, o: any) => sum + (o.photos?.length || 0), 0);
      const totalVideos = bOrders.length;
      const completedVideos = bOrders.filter((o: any) =>
        ["complete", "delivered", "closed", "approved", "awaiting_approval"].includes(o.status)
      ).length;
      const usageCost = totalClips * (b.per_clip_rate || 3.29);
      const minSpend = b.min_monthly_spend || 0;

      return {
        ...b,
        members: bMembers,
        orders: bOrders,
        stats: {
          totalVideos,
          completedVideos,
          totalClips,
          estimatedCost: usageCost,
          totalDue: Math.max(usageCost, minSpend),
        },
      };
    });

    return NextResponse.json({ success: true, brokerages: enriched });
  } catch (error) {
    console.error("Admin brokerages error:", error);
    return NextResponse.json({ error: "Failed to fetch brokerages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { isAdmin: admin } = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    if (body.action === "create_brokerage") {
      const { data, error } = await supabase
        .from("brokerages")
        .insert({
          company: body.company,
          contact_name: body.contact_name,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone || null,
          tier: body.tier || "growth",
          per_clip_rate: body.per_clip_rate || 3.29,
          min_monthly_spend: body.min_monthly_spend || 0,
          status: "active",
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, brokerage: data });
    }

    if (body.action === "add_member") {
      const { data, error } = await supabase
        .from("brokerage_members")
        .insert({
          brokerage_id: body.brokerage_id,
          email: body.email.toLowerCase().trim(),
          name: body.name || null,
          role: body.role || "agent",
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, member: data });
    }

    if (body.action === "remove_member") {
      const { error } = await supabase
        .from("brokerage_members")
        .delete()
        .eq("id", body.member_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (body.action === "update_brokerage") {
      const updates: any = {};
      if (body.status !== undefined) updates.status = body.status;
      if (body.tier !== undefined) updates.tier = body.tier;
      if (body.per_clip_rate !== undefined) updates.per_clip_rate = body.per_clip_rate;
      if (body.min_monthly_spend !== undefined) updates.min_monthly_spend = body.min_monthly_spend;
      if (body.notes !== undefined) updates.notes = body.notes;

      const { data, error } = await supabase
        .from("brokerages")
        .update(updates)
        .eq("id", body.brokerage_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, brokerage: data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin brokerages POST error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
