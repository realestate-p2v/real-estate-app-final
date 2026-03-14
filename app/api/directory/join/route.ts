import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/directory/join — photographer submits application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, market, website, instagram, linkedin, photo_url, specialties, bio } = body;

    if (!name || !email || !market) {
      return NextResponse.json(
        { success: false, error: "Name, email, and market are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("photographers")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email is already registered in our directory" },
        { status: 400 }
      );
    }

    // Insert photographer
    const { data, error } = await supabase
      .from("photographers")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        market: market.trim(),
        website: website?.trim() || null,
        instagram: instagram?.trim() || null,
        linkedin: linkedin?.trim() || null,
        photo_url: photo_url || null,
        specialties: specialties || [],
        bio: bio?.trim() || null,
        status: "pending",
        subscription_status: "free_trial",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Notify Matt via SendGrid
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      const specialtiesList = (specialties || []).join(", ") || "None selected";
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: "matt@realestatephoto2video.com" }] }],
          from: { email: process.env.FROM_EMAIL || "matt@realestatephoto2video.com", name: "P2V Directory" },
          reply_to: { email: email.toLowerCase().trim(), name: name.trim() },
          subject: `New Photographer Application — ${name} (${market})`,
          content: [
            {
              type: "text/html",
              value: `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>New Photographer Directory Application</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Market:</strong> ${market}</p>
  ${website ? `<p><strong>Website:</strong> <a href="${website.startsWith("http") ? website : "https://" + website}">${website}</a></p>` : ""}
  ${instagram ? `<p><strong>Instagram:</strong> <a href="https://instagram.com/${instagram.replace("@", "")}">@${instagram.replace("@", "")}</a></p>` : ""}
  ${linkedin ? `<p><strong>LinkedIn:</strong> ${linkedin}</p>` : ""}
  <p><strong>Specialties:</strong> ${specialtiesList}</p>
  ${bio ? `<p><strong>Bio:</strong> ${bio}</p>` : ""}
  ${photo_url ? `<p><strong>Photo:</strong> <a href="${photo_url}">View</a></p>` : "<p><strong>Photo:</strong> None uploaded</p>"}
  <hr style="margin: 16px 0;">
  <p>To approve, update status to 'approved' in Supabase → photographers table.</p>
  <p>Free trial expires in 30 days.</p>
</div>`,
            },
          ],
        }),
      }).catch((err) => console.error("[Directory] Email notification failed:", err));
    }

    return NextResponse.json({ success: true, photographer: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
