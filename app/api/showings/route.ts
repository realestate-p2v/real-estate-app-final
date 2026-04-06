import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  // Public — no auth required
  const body = await req.json();
  const { propertyId, agentUserId, visitorName, visitorEmail, visitorPhone, message, propertyInfo, source } = body;

  if (!propertyId || !agentUserId || !visitorName) {
    return NextResponse.json({ error: "propertyId, agentUserId, and visitorName required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("showing_requests")
    .insert({
      property_id: propertyId,
      agent_user_id: agentUserId,
      visitor_name: visitorName,
      visitor_email: visitorEmail || null,
      visitor_phone: visitorPhone || null,
      message: message || null,
      property_info: propertyInfo || null,
      source: source || "website",
      read: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify agent
  try {
    const { createNotification } = await import("@/lib/create-notification");
    await createNotification({
      userId: agentUserId,
      type: "showing_request",
      title: "New Showing Request",
      message: `${visitorName} requested a showing${propertyInfo?.address ? ` for ${propertyInfo.address}` : ""}`,
      link: `/dashboard/properties/${propertyId}`,
    });
  } catch (e) {
    console.error("Failed to create showing notification:", e);
  }

  // Send email
  try {
    const { data: agent } = await admin
      .from("lens_usage")
      .select("saved_agent_name, saved_email")
      .eq("user_id", agentUserId)
      .single();

    if (agent?.saved_email && process.env.SENDGRID_API_KEY) {
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: agent.saved_email }] }],
          from: { email: "notifications@realestatephoto2video.com", name: "P2V" },
          subject: `Showing Request from ${visitorName}`,
          content: [{
            type: "text/html",
            value: `<p>Hi ${agent.saved_agent_name || ""},</p><p><strong>${visitorName}</strong>${visitorEmail ? ` (${visitorEmail})` : ""}${visitorPhone ? ` — ${visitorPhone}` : ""} requested a showing${propertyInfo?.address ? ` for <strong>${propertyInfo.address}</strong>` : ""}.</p>${message ? `<p>Message: "${message}"</p>` : ""}<p><a href="https://realestatephoto2video.com/dashboard/properties/${propertyId}">View Property</a></p>`,
          }],
        }),
      });
    }
  } catch (e) {
    console.error("Failed to send showing email:", e);
  }

  return NextResponse.json({ success: true, id: data.id });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId, read } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

  const { error } = await supabase
    .from("showing_requests")
    .update({ read: read ?? true })
    .eq("id", requestId)
    .eq("agent_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
