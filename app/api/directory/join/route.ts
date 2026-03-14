import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "You must be logged in" }, { status: 401 });

    const body = await request.json();
    const { name, market, portfolio, website, instagram, linkedin, photo_url, specialties, bio } = body;
    if (!name || !market) return NextResponse.json({ success: false, error: "Name and market are required" }, { status: 400 });

    const { data: existing } = await supabase.from("photographers").select("id").eq("user_id", user.id).single();
    if (existing) return NextResponse.json({ success: false, error: "You already have a directory listing. Visit /directory/edit to update it." }, { status: 400 });

    const { data, error } = await supabase.from("photographers").insert({
      user_id: user.id, name: name.trim(), email: user.email, market: market.trim(),
      portfolio: portfolio?.trim() || null, website: website?.trim() || null,
      instagram: instagram?.trim() || null, linkedin: linkedin?.trim() || null,
      photo_url: photo_url || null, specialties: specialties || [],
      bio: bio?.trim() || null, status: "approved", subscription_status: "free",
    }).select().single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: "matt@realestatephoto2video.com" }] }],
          from: { email: process.env.FROM_EMAIL || "matt@realestatephoto2video.com", name: "P2V Directory" },
          subject: `New Photographer Listing — ${name} (${market})`,
          content: [{ type: "text/html", value: `<div style="font-family:Arial,sans-serif;max-width:600px;"><h2>New Directory Listing (Auto-Approved)</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${user.email}</p><p><b>Market:</b> ${market}</p>${portfolio ? `<p><b>Portfolio:</b> <a href="${portfolio}">${portfolio}</a></p>` : ""}${website ? `<p><b>Website:</b> ${website}</p>` : ""}${instagram ? `<p><b>Instagram:</b> @${instagram.replace("@", "")}</p>` : ""}<p><b>Specialties:</b> ${(specialties || []).join(", ") || "None"}</p><hr><p>Live at realestatephoto2video.com/directory</p></div>` }],
        }),
      }).catch(err => console.error("[Directory] Email failed:", err));
    }

    return NextResponse.json({ success: true, photographer: data });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
