import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================
// POST /api/website/contact
// Contact form handler for agent websites + portal listings
// Sends email to the agent via SendGrid
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const agentUserId = formData.get("agent_user_id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const message = (formData.get("message") as string) || "";
    const propertyAddress = (formData.get("property_address") as string) || "";
    const propertyInterest = (formData.get("property_interest") as string) || "";

    if (!agentUserId || !name || !email) {
      // Redirect back with error
      const referer = request.headers.get("referer") || "/";
      return NextResponse.redirect(new URL(`${referer}?contact=error`, request.url));
    }

    // Get agent's email
    const supabase = createAdminClient();
    const { data: agent } = await supabase
      .from("lens_usage")
      .select("saved_email, saved_agent_name")
      .eq("user_id", agentUserId)
      .single();

    const agentEmail = agent?.saved_email;
    const agentName = agent?.saved_agent_name || "Agent";

    if (!agentEmail) {
      // Fallback: get from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(agentUserId);
      const fallbackEmail = authUser?.user?.email;

      if (!fallbackEmail) {
        const referer = request.headers.get("referer") || "/";
        return NextResponse.redirect(new URL(`${referer}?contact=error`, request.url));
      }
    }

    const toEmail = agentEmail || "";

    // Send via SendGrid
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      console.error("[Contact] SendGrid API key not configured");
      const referer = request.headers.get("referer") || "/";
      return NextResponse.redirect(new URL(`${referer}?contact=error`, request.url));
    }

    const subject = propertyAddress
      ? `New inquiry about ${propertyAddress}`
      : propertyInterest
      ? `New inquiry about ${propertyInterest}`
      : `New contact from your P2V website`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #06b6d4; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 18px;">New Lead from Your Website</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Name</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                <a href="mailto:${email}" style="color: #06b6d4;">${email}</a>
              </td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                <a href="tel:${phone}" style="color: #06b6d4;">${phone}</a>
              </td>
            </tr>` : ""}
            ${propertyAddress ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Property</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">${propertyAddress}</td>
            </tr>` : ""}
            ${propertyInterest ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Interest</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">${propertyInterest}</td>
            </tr>` : ""}
          </table>
          ${message ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Message:</p>
            <p style="color: #111827; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>` : ""}
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              This lead came from your P2V Homes website. Powered by
              <a href="https://realestatephoto2video.com" style="color: #06b6d4;">Realestatephoto2video.com</a>
            </p>
          </div>
        </div>
      </div>
    `;

    const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail, name: agentName }] }],
        from: {
          email: "notifications@realestatephoto2video.com",
          name: "P2V Homes",
        },
        reply_to: { email, name },
        subject,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });

    if (!sgResponse.ok) {
      const errorText = await sgResponse.text();
      console.error("[Contact] SendGrid error:", errorText);
    }

    // Redirect back with success
    const referer = request.headers.get("referer") || "/";
    return NextResponse.redirect(new URL(`${referer}?contact=success`, request.url));
  } catch (error) {
    console.error("[Contact] Error:", error);
    const referer = request.headers.get("referer") || "/";
    return NextResponse.redirect(new URL(`${referer}?contact=error`, request.url));
  }
}
