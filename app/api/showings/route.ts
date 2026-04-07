import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/create-notification";

// POST /api/showings — create a showing request (public, no auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      propertyId,
      agentUserId,
      visitorName,
      visitorEmail,
      visitorPhone,
      message,
      propertyInfo,
      source,
    } = body;

    if (!propertyId || !agentUserId || !visitorName) {
      return NextResponse.json(
        { error: "propertyId, agentUserId, and visitorName required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin.from("showing_requests").insert({
      property_id: propertyId,
      agent_user_id: agentUserId,
      visitor_name: visitorName,
      visitor_email: visitorEmail || null,
      visitor_phone: visitorPhone || null,
      message: message || null,
      property_info: propertyInfo || null,
      source: source || "website",
      read: false,
    }).select("id").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get property address for notification context
    const { data: propData } = await admin
      .from("agent_properties")
      .select("address")
      .eq("id", propertyId)
      .single();

    const propertyAddress = propData?.address || propertyInfo?.address || "your property";

    // In-app notification
    await createNotification({
      userId: agentUserId,
      type: "showing_request",
      title: "Showing Request",
      message: `${visitorName} wants to see ${propertyAddress}`,
      link: `/dashboard/properties/${propertyId}`,
      metadata: {
        requestId: data?.id,
        propertyId,
        visitorName,
        visitorEmail,
        visitorPhone,
        source,
      },
    });

    // Email notification (best-effort)
    try {
      if (process.env.SENDGRID_API_KEY) {
        const { data: agentData } = await admin
          .from("lens_usage")
          .select("saved_agent_name, saved_email")
          .eq("user_id", agentUserId)
          .single();

        const { data: authData } = await admin.auth.admin.getUserById(agentUserId);
        const agentEmail = agentData?.saved_email || authData?.user?.email;
        const agentName = agentData?.saved_agent_name || "Agent";

        if (agentEmail) {
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: agentEmail }] }],
              from: {
                email: "notifications@realestatephoto2video.com",
                name: "P2V Notifications",
              },
              subject: `Showing Request: ${propertyAddress}`,
              content: [
                {
                  type: "text/html",
                  value: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                      <h2 style="color: #111;">New Showing Request</h2>
                      <p>Hi ${agentName},</p>
                      <p>Someone is interested in seeing <strong>${propertyAddress}</strong>.</p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
                      <p><strong>Name:</strong> ${visitorName}</p>
                      ${visitorEmail ? `<p><strong>Email:</strong> ${visitorEmail}</p>` : ""}
                      ${visitorPhone ? `<p><strong>Phone:</strong> ${visitorPhone}</p>` : ""}
                      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
                      ${source ? `<p><strong>Source:</strong> ${source}</p>` : ""}
                      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
                      <p style="color: #888; font-size: 12px;">Real Estate Photo 2 Video</p>
                    </div>
                  `,
                },
              ],
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error("Showing request email notification failed:", emailErr);
    }

    return NextResponse.json({ success: true, requestId: data?.id });
  } catch (err: any) {
    console.error("POST /api/showings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/showings?agentUserId=xxx — list showing requests (agent auth required)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = req.nextUrl.searchParams.get("propertyId");

    let query = supabase
      .from("showing_requests")
      .select("*")
      .eq("agent_user_id", user.id)
      .order("created_at", { ascending: false });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    console.error("GET /api/showings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/showings — mark as read (agent auth required)
// Body: { requestId, read: true }
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, read } = await req.json();
    if (!requestId) {
      return NextResponse.json(
        { error: "requestId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("showing_requests")
      .update({ read: read !== false })
      .eq("id", requestId)
      .eq("agent_user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/showings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
