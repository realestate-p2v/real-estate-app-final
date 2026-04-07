import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/create-notification";

// GET /api/bookings?propertyId=xxx
// Agent (auth): returns all slots for their property
// Public (no auth): returns only 'available' slots for next 2 weeks
export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if this user owns the property
    let isOwner = false;
    if (user) {
      const { data: prop } = await supabase
        .from("agent_properties")
        .select("id")
        .eq("id", propertyId)
        .eq("user_id", user.id)
        .single();
      isOwner = !!prop;
    }

    if (isOwner) {
      // Agent sees all slots for their property
      const { data, error } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("property_id", propertyId)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ slots: data || [] });
    } else {
      // Public visitor sees only available slots for next 2 weeks
      const today = new Date().toISOString().split("T")[0];
      const twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      const twoWeeksStr = twoWeeks.toISOString().split("T")[0];

      // Use admin client so RLS public SELECT works
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("booking_slots")
        .select(
          "id, property_id, slot_date, slot_time, duration_min, status"
        )
        .eq("property_id", propertyId)
        .eq("status", "available")
        .gte("slot_date", today)
        .lte("slot_date", twoWeeksStr)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ slots: data || [] });
    }
  } catch (err: any) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/bookings — create slot(s) (agent auth required)
// Body: { propertyId, slots: [{ date, time, durationMin }], recurring?: { dayOfWeek, time, durationMin, weeks } }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, slots, recurring } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: prop } = await supabase
      .from("agent_properties")
      .select("id")
      .eq("id", propertyId)
      .eq("user_id", user.id)
      .single();

    if (!prop) {
      return NextResponse.json(
        { error: "Property not found or not owned by you" },
        { status: 403 }
      );
    }

    const toInsert: {
      property_id: string;
      user_id: string;
      slot_date: string;
      slot_time: string;
      duration_min: number;
      status: string;
    }[] = [];

    // Individual slots
    if (Array.isArray(slots)) {
      for (const s of slots) {
        if (s.date && s.time) {
          toInsert.push({
            property_id: propertyId,
            user_id: user.id,
            slot_date: s.date,
            slot_time: s.time,
            duration_min: s.durationMin || 30,
            status: "available",
          });
        }
      }
    }

    // Recurring slots
    if (recurring) {
      const { dayOfWeek, time, durationMin, weeks } = recurring;
      const dayMap: Record<string, number> = {
        sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
      };
      const targetDay =
        dayMap[dayOfWeek?.toLowerCase()] ?? parseInt(dayOfWeek);
      const numWeeks = Math.min(weeks || 4, 12); // cap at 12 weeks

      const start = new Date();
      for (let w = 0; w < numWeeks; w++) {
        const d = new Date(start);
        d.setDate(d.getDate() + w * 7);
        // Find the next occurrence of targetDay
        const diff = (targetDay - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        // Skip if in the past
        if (d < start && w === 0 && diff === 0) {
          d.setDate(d.getDate() + 7);
        }
        const dateStr = d.toISOString().split("T")[0];
        toInsert.push({
          property_id: propertyId,
          user_id: user.id,
          slot_date: dateStr,
          slot_time: time,
          duration_min: durationMin || 30,
          status: "available",
        });
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid slots provided" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("booking_slots")
      .insert(toInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: data?.length || 0, slots: data });
  } catch (err: any) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings — book a slot (public) or cancel (agent)
// Body: { slotId, action: "book" | "cancel", visitorName?, visitorEmail?, visitorPhone?, notes? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotId, action } = body;

    if (!slotId || !action) {
      return NextResponse.json(
        { error: "slotId and action required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (action === "book") {
      // Public booking — no auth required
      const { visitorName, visitorEmail, visitorPhone, notes } = body;
      if (!visitorName) {
        return NextResponse.json(
          { error: "visitorName required" },
          { status: 400 }
        );
      }

      // Verify slot is available
      const { data: slot, error: slotErr } = await admin
        .from("booking_slots")
        .select("*")
        .eq("id", slotId)
        .eq("status", "available")
        .single();

      if (slotErr || !slot) {
        return NextResponse.json(
          { error: "Slot not available" },
          { status: 400 }
        );
      }

      // Book it
      const { error: updateErr } = await admin
        .from("booking_slots")
        .update({
          status: "booked",
          booked_by_name: visitorName,
          booked_by_email: visitorEmail || null,
          booked_by_phone: visitorPhone || null,
          notes: notes || null,
        })
        .eq("id", slotId);

      if (updateErr) {
        return NextResponse.json(
          { error: updateErr.message },
          { status: 500 }
        );
      }

      // Notify the agent
      await createNotification({
        userId: slot.user_id,
        type: "booking",
        title: "New Booking",
        message: `${visitorName} booked a showing on ${slot.slot_date} at ${slot.slot_time}`,
        link: `/dashboard/properties`,
        metadata: {
          slotId,
          propertyId: slot.property_id,
          visitorName,
          visitorEmail,
          visitorPhone,
          slotDate: slot.slot_date,
          slotTime: slot.slot_time,
        },
      });

      // Send email notification via SendGrid (best-effort)
      try {
        if (process.env.SENDGRID_API_KEY) {
          // Get agent email
          const { data: agentData } = await admin
            .from("lens_usage")
            .select("saved_email")
            .eq("user_id", slot.user_id)
            .single();

          // Also get auth email
          const { data: authData } = await admin.auth.admin.getUserById(
            slot.user_id
          );
          const agentEmail =
            agentData?.saved_email || authData?.user?.email;

          if (agentEmail) {
            // Get property address for context
            const { data: propData } = await admin
              .from("agent_properties")
              .select("address")
              .eq("id", slot.property_id)
              .single();

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
                subject: `New Booking: ${propData?.address || "Your Property"} — ${slot.slot_date} at ${slot.slot_time}`,
                content: [
                  {
                    type: "text/html",
                    value: `
                      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #111;">New Showing Booked</h2>
                        <p><strong>Property:</strong> ${propData?.address || "—"}</p>
                        <p><strong>Date:</strong> ${slot.slot_date}</p>
                        <p><strong>Time:</strong> ${slot.slot_time}</p>
                        <p><strong>Name:</strong> ${visitorName}</p>
                        ${visitorEmail ? `<p><strong>Email:</strong> ${visitorEmail}</p>` : ""}
                        ${visitorPhone ? `<p><strong>Phone:</strong> ${visitorPhone}</p>` : ""}
                        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
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
        console.error("Booking email notification failed:", emailErr);
      }

      return NextResponse.json({ success: true, action: "booked" });
    }

    if (action === "cancel") {
      // Agent cancels a booked slot — requires auth
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("PATCH /api/bookings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings — remove a slot entirely (agent auth required)
// Body: { slotId }
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId } = await req.json();
    if (!slotId) {
      return NextResponse.json(
        { error: "slotId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("booking_slots")
      .delete()
      .eq("id", slotId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/bookings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
