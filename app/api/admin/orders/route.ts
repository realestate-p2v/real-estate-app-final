import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "revisions") {
      const { data: revisions, error } = await supabase
        .from("revision_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, revisions: revisions || [] });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error) {
    console.error("[Admin Orders] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { orderId, status, revisionNotes, clientRevisionNotes, deliveryUrl } = await request.json();
    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "orderId and status required" }, { status: 400 });
    }

    const validStatuses = [
      "new", "pending", "processing", "awaiting_approval",
      "approved", "complete", "delivered", "closed",
      "revision_requested", "client_revision_requested", "error"
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status: ${status}` }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const updateData: any = { status };

    // If approving, set approved_at
    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    // If manual delivery URL provided
    if (deliveryUrl) {
      updateData.delivery_url = deliveryUrl;
    }

    // If requesting revision with notes
    if (revisionNotes) {
      updateData.revision_notes = revisionNotes;
    }

    // If admin overrode client revision clip settings
    if (clientRevisionNotes) {
      updateData.client_revision_notes = clientRevisionNotes;
      // Also rebuild the pipeline revision_notes string
      const clipNotes = clientRevisionNotes.map((c: any) =>
        `[${c.position}] ${c.camera_direction || ""} ${c.camera_speed || ""} ${c.problem_description || ""} ${c.action === "remove" ? "REMOVE" : ""}`.trim()
      ).join(", ");
      updateData.revision_notes = clipNotes;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("[Admin Orders] PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
