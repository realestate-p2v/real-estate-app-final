import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const propertyId = req.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  // If authenticated owner: return all slots. If public: only available slots for next 2 weeks.
  if (user) {
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("user_id")
      .eq("id", propertyId)
      .single();

    if (prop && prop.user_id === user.id) {
      const { data, error } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("property_id", propertyId)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ slots: data });
    }
  }

  // Public view: available slots for next 14 days
  const today = new Date().toISOString().split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("booking_slots")
    .select("id, property_id, slot_date, slot_time, duration_min, status")
    .eq("property_id", propertyId)
    .eq("status", "available")
    .gte("slot_date", today)
    .lte("slot_date", twoWeeks)
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, slots } = body;

  if (!propertyId || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "propertyId and slots[] required" }, { status: 400 });
  }

  // Verify property ownership
  const { data: prop } = await supabase
    .from("agent_properties")
    .select("user_id")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const insertRows = slots.map((s: any) => ({
    property_id: propertyId,
    user_id: user.id,
    slot_date: s.date,
    slot_time: s.time,
    duration_min: s.duration || 30,
    status: "available",
  }));

  const { data, error } = await supabase
    .from("booking_slots")
    .insert(insertRows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { slotId, action, visitorName, visitorEmail, visitorPhone, notes } = body;

  if (!slotId || !action) {
    return NextResponse.json({ error: "slotId and action required" }, { status: 400 });
  }

  if (action === "book") {
    if (!visitorName || !visitorEmail) {
      return NextResponse.json({ error: "Name and email required to book" }, { status: 400 });
    }

    // Book the slot (public — no auth required)
    const { data: slot, error: fetchErr } = await supabase
      .from("booking_slots")
      .select("*, property_id")
      .eq("id", slotId)
      .eq("status", "available")
      .single();

    if (fetchErr || !slot) {
      return NextResponse.json({ error: "Slot not available" }, { status: 400 });
    }

    const { error } = await supabase
      .from("booking_slots")
      .update({
        status: "booked",
        booked_by_name: visitorName,
        booked_by_email: visitorEmail,
        booked_by_phone: visitorPhone || null,
        notes: notes || null,
      })
      .eq("id", slotId)
      .eq("status", "available");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify agent
    try {
      const { createNotification } = await import("@/lib/create-notification");
      await createNotification({
        userId: slot.user_id,
        type: "booking",
        title: "New Booking",
        message: `${visitorName} booked a showing on ${slot.slot_date} at ${slot.slot_time}`,
        link: `/dashboard/properties/${slot.property_id}`,
      });
    } catch (e) {
      console.error("Failed to create booking notification:", e);
    }

    // Send email via SendGrid
    try {
      const { data: agent } = await supabase
        .from("lens_usage")
        .select("saved_agent_name, saved_email")
        .eq("user_id", slot.user_id)
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
            subject: `New Booking: ${visitorName} on ${slot.slot_date}`,
            content: [{
              type: "text/html",
              value: `<p>Hi ${agent.saved_agent_name || ""},</p><p><strong>${visitorName}</strong> (${visitorEmail}${visitorPhone ? ", " + visitorPhone : ""}) booked a showing on <strong>${slot.slot_date} at ${slot.slot_time}</strong>.</p>${notes ? `<p>Notes: ${notes}</p>` : ""}<p><a href="https://realestatephoto2video.com/dashboard/properties/${slot.property_id}">View Property</a></p>`,
            }],
          }),
        });
      }
    } catch (e) {
      console.error("Failed to send booking email:", e);
    }

    return NextResponse.json({ success: true });
  }

  if (action === "cancel") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("booking_slots")
      .update({
        status: "available",
        booked_by_name: null,
        booked_by_email: null,
        booked_by_phone: null,
        notes: null,
      })
      .eq("id", slotId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slotId = req.nextUrl.searchParams.get("slotId");
  if (!slotId) return NextResponse.json({ error: "slotId required" }, { status: 400 });

  const { error } = await supabase
    .from("booking_slots")
    .delete()
    .eq("id", slotId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
