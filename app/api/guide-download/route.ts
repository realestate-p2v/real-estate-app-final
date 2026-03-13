import { NextResponse } from "next/server";

// POST /api/guide-download
// Captures email to SendGrid contact list "Photography Guide Downloads"
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (!SENDGRID_API_KEY) {
      console.error("[Guide Download] SENDGRID_API_KEY not configured");
      // Still allow download even if SendGrid fails — don't block the user
      return NextResponse.json({ success: true });
    }

    // Step 1: Add contact to SendGrid with custom field
    // Uses the Marketing Contacts API — adds to "All Contacts" automatically
    const addContactResponse = await fetch(
      "https://api.sendgrid.com/v3/marketing/contacts",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: [
            {
              email: email.toLowerCase().trim(),
              custom_fields: {},
            },
          ],
        }),
      }
    );

    if (!addContactResponse.ok) {
      const errorData = await addContactResponse.json().catch(() => ({}));
      console.error("[Guide Download] SendGrid add contact failed:", errorData);
      // Don't block the download — log and continue
    } else {
      console.log(`[Guide Download] Email captured: ${email}`);
    }

    // Step 2: Try to add to a specific list if GUIDE_LIST_ID is set
    const GUIDE_LIST_ID = process.env.SENDGRID_GUIDE_LIST_ID;
    if (GUIDE_LIST_ID) {
      await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_ids: [GUIDE_LIST_ID],
          contacts: [
            {
              email: email.toLowerCase().trim(),
            },
          ],
        }),
      }).catch((err) =>
        console.error("[Guide Download] List add failed:", err)
      );
    }

    // Step 3: Send immediate confirmation email with download link
    const FROM_EMAIL = process.env.FROM_EMAIL || "matt@realestatephoto2video.com";
    
    const sendEmailResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: email.toLowerCase().trim() }] }],
          from: { email: FROM_EMAIL, name: "Real Estate Photo 2 Video" },
          subject:
            "Your Photography Guide is Ready — Download Inside",
          content: [
            {
              type: "text/html",
              value: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #0F1D3A;">📸 Your Photography Guide is Ready!</h2>
  
  <p>Hi there,</p>
  
  <p>Thanks for downloading <strong>The Realtor's Guide to Real Estate Photography — Second Edition</strong>. 
  Here's your copy:</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://realestatephoto2video.com/Realtors_Guide_to_Real_Estate_Photography.pdf" 
       style="background: #2563EB; color: white; padding: 14px 28px; border-radius: 6px; 
              text-decoration: none; font-size: 16px; font-weight: bold;">
      📥 Download Your Free Guide
    </a>
  </p>

  <p><strong>What's inside:</strong></p>
  <ul>
    <li>Camera settings for phones and DSLRs</li>
    <li>Room-by-room lighting guide</li>
    <li>Staging quick wins (15-minute fixes)</li>
    <li>The complete shot list every listing needs</li>
    <li>Common mistakes that kill your listing</li>
    <li>DIY drone photography with 2026 FCC ban guide</li>
    <li>Printable quick reference checklists</li>
  </ul>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;">

  <p><strong>Ready to turn your photos into a professional video?</strong></p>
  <p>At Real Estate Photo 2 Video, we transform your listing photos into cinematic 
  walkthrough videos — delivered in 24 hours, starting at $79.</p>

  <p style="text-align: center; margin: 24px 0;">
    <a href="https://realestatephoto2video.com/order" 
       style="background: #DC2626; color: white; padding: 12px 24px; border-radius: 6px; 
              text-decoration: none; font-size: 15px; font-weight: bold;">
      Create My Listing Video →
    </a>
  </p>
  
  <p style="text-align: center; font-size: 14px;">
    <strong>Use code PHOTO15 for 15% off your first order.</strong>
  </p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #E5E7EB;">
  
  <p style="color: #666; font-size: 13px;">
    You're receiving this because you downloaded our Photography Guide at 
    realestatephoto2video.com. We'll send you a few helpful emails over the 
    next week, then only occasional tips. Unsubscribe anytime.
  </p>
</div>`,
            },
          ],
        }),
      }
    );

    if (!sendEmailResponse.ok) {
      console.error(
        "[Guide Download] Confirmation email failed:",
        sendEmailResponse.status
      );
    } else {
      console.log(`[Guide Download] Confirmation email sent to ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Guide Download] Server error:", error);
    // Still return success — don't block the download for a server error
    return NextResponse.json({ success: true });
  }
}
