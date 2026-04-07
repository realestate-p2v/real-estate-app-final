import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/create-notification";

// POST /api/showings — public visitor submits a contact/showing request
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
      source,
      propertyAddress,
    } = body;

    if (!propertyId || !visitorName || !visitorEmail) {
      return NextResponse.json(
        { error: "propertyId, visitorName, and visitorEmail are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Look up the agent user_id from the property if not provided
    let agentId = agentUserId;
    if (!agentId) {
      const { data: prop } = await admin
        .from("agent_properties")
        .select("user_id")
        .eq("id", propertyId)
        .single();
      agentId = prop?.user_id;
    }

    if (!agentId) {
      return NextResponse.json(
        { error: "Could not find property owner" },
        { status: 400 }
      );
    }

    // Save to showing_requests table
    const { error: insertErr } = await admin
      .from("showing_requests")
      .insert({
        property_id: propertyId,
        agent_user_id: agentId,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone || null,
        message: message || null,
        source: source || "property_website",
      });

    if (insertErr) {
      console.error("Insert showing request error:", insertErr);
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    // Create in-app notification for the agent
    await createNotification({
      userId: agentId,
      type: "showing_request",
      title: "New Inquiry",
      message: `${visitorName} sent a message about ${propertyAddress || "your property"}`,
      link: `/dashboard/properties`,
      metadata: {
        propertyId,
        visitorName,
        visitorEmail,
        visitorPhone,
        propertyAddress,
      },
    });

    // Send email notification via SendGrid (best-effort)
    try {
      if (process.env.SENDGRID_API_KEY) {
        const { data: agentData } = await admin
          .from("lens_usage")
          .select("saved_email")
          .eq("user_id", agentId)
          .single();

        const { data: authData } = await admin.auth.admin.getUserById(agentId);
        const agentEmail = agentData?.saved_email || authData?.user?.email;

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
              subject: `New Inquiry: ${propertyAddress || "Your Property"}`,
              content: [
                {
                  type: "text/html",
                  value: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                      <h2 style="color: #111;">New Property Inquiry</h2>
                      <p><strong>Property:</strong> ${propertyAddress || "—"}</p>
                      <p><strong>From:</strong> ${visitorName}</p>
                      <p><strong>Email:</strong> ${visitorEmail}</p>
                      ${visitorPhone ? `<p><strong>Phone:</strong> ${visitorPhone}</p>` : ""}
                      ${message ? `<p><strong>Message:</strong></p><p style="background: #f5f5f5; padding: 12px; border-radius: 8px;">${message}</p>` : ""}
                      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/showings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/showings — agent gets their showing requests
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
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

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

// PATCH /api/showings — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json(
        { error: "requestId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("showing_requests")
      .update({ read: true })
      .eq("id", requestId)
      .eq("agent_id", user.id);

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
