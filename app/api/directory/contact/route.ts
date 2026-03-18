import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/create-notification";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { photographerId, name, email, message } = body;

    if (!photographerId || !name || !email || !message) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Require authentication to prevent spam
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "You must be logged in to contact a photographer" }, { status: 401 });
    }

    // Get photographer details
    const { data: photographer, error: fetchErr } = await supabase
      .from("photographers")
      .select("id, name, email, market, user_id")
      .eq("id", photographerId)
      .eq("status", "approved")
      .single();

    if (fetchErr || !photographer) {
      return NextResponse.json({ success: false, error: "Photographer not found" }, { status: 404 });
    }

    // Log the inquiry
    await supabase.from("directory_inquiries").insert({
      photographer_id: photographerId,
      from_name: name.trim(),
      from_email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    // Notify the photographer in-app
    if (photographer.user_id) {
      await createNotification({
        userId: photographer.user_id,
        type: "directory_inquiry",
        title: "Someone contacted you about photography",
        message: `${name.trim()} sent you a message through the P2V directory.`,
        link: "/directory/edit",
      });
    }

    // Send email to photographer
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: photographer.email }] }],
          from: {
            email: process.env.FROM_EMAIL || "matt@realestatephoto2video.com",
            name: "P2V Photographer Directory",
          },
          reply_to: { email: email.trim().toLowerCase(), name: name.trim() },
          subject: `New inquiry from ${name} — P2V Directory`,
          content: [
            {
              type: "text/html",
              value: `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #0F1D3A;">New Inquiry from the P2V Directory</h2>
  
  <p>Hi ${photographer.name},</p>
  
  <p>You have a new message from a realtor who found you on the Real Estate Photo 2 Video photographer directory:</p>
  
  <div style="background: #f3f4f6; border-left: 4px solid #2563EB; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${name} (${email})</p>
    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
  </div>
  
  <p><strong>Reply directly to this email</strong> to respond to ${name}.</p>
  
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;">
  
  <p style="color: #666; font-size: 13px;">
    This message was sent through the <a href="https://realestatephoto2video.com/directory" style="color: #2563EB;">P2V Photographer Directory</a>. 
    You can manage your listing at <a href="https://realestatephoto2video.com/directory/edit" style="color: #2563EB;">realestatephoto2video.com/directory/edit</a>.
  </p>
</div>`,
            },
          ],
        }),
      });
    }

    // Also notify Matt
    if (SENDGRID_API_KEY) {
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: "matt@realestatephoto2video.com" }] }],
          from: { email: process.env.FROM_EMAIL || "matt@realestatephoto2video.com", name: "P2V Directory" },
          subject: `Directory Inquiry: ${name} → ${photographer.name} (${photographer.market})`,
          content: [{ type: "text/html", value: `<div style="font-family:Arial;max-width:600px;"><h3>Directory Contact</h3><p><b>From:</b> ${name} (${email})</p><p><b>To:</b> ${photographer.name} (${photographer.email})</p><p><b>Message:</b> ${message}</p></div>` }],
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Directory Contact] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
