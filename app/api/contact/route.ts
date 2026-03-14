import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, orderNumber, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Name, email, and message are required" }, { status: 400 });
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 });
    }

    const orderLine = orderNumber ? `\nOrder Number: ${orderNumber}` : "";

    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: "matt@realestatephoto2video.com" }] }],
        from: { email: process.env.FROM_EMAIL || "matt@realestatephoto2video.com", name: "P2V Support Form" },
        reply_to: { email, name },
        subject: `Support Request from ${name}${orderNumber ? ` (Order: ${orderNumber})` : ""}`,
        content: [
          {
            type: "text/html",
            value: `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>New Support Request</h2>
  <p><strong>From:</strong> ${name} (${email})</p>${orderNumber ? `<p><strong>Order:</strong> ${orderNumber}</p>` : ""}
  <hr style="margin: 16px 0; border: none; border-top: 1px solid #E5E7EB;">
  <p style="white-space: pre-wrap;">${message}</p>
  <hr style="margin: 16px 0; border: none; border-top: 1px solid #E5E7EB;">
  <p style="color: #666; font-size: 13px;">Reply directly to this email to respond to ${name}.</p>
</div>`,
          },
        ],
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
