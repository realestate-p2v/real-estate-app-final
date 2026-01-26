import type { Order } from "@/lib/types/order";

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
// CRITICAL: FROM_EMAIL must be from your verified domain in MailerSend
const FROM_EMAIL = process.env.MAILERSEND_SENDER_EMAIL;
const FROM_NAME = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";
const CUSTOMER_TEMPLATE_ID = process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "";
const ADMIN_TEMPLATE_ID = process.env.MAILERSEND_ORDER_TEMPLATE_ID || "";

// Stripe session data passed from webhook
interface StripeSessionData {
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  amountTotal: number | null;
}

/**
 * VALIDATION: Check that MAILERSEND_SENDER_EMAIL is set before sending
 * This prevents MailerSend error #MS42209 (missing/invalid sender)
 */
function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!MAILERSEND_API_KEY) {
    errors.push("MAILERSEND_API_KEY is not set");
  }

  if (!FROM_EMAIL) {
    errors.push("MAILERSEND_SENDER_EMAIL is not set - must be an email from your verified MailerSend domain");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getBrandingLabel(type: string): string {
  switch (type) {
    case "unbranded":
      return "Unbranded";
    case "basic":
      return "Basic Branding";
    case "custom":
      return "Custom Branding";
    default:
      return type;
  }
}

/**
 * Build the personalization data with EXACT required variable names:
 * customer_name, music_choice, video_titles, special_requests, 
 * image_urls, customer_phone, customer_email, price
 */
function buildPersonalizationData(
  order: Order | null,
  stripeSession: StripeSessionData
): Record<string, string> {
  // customer_name - from Stripe session (primary) or order (fallback)
  const customer_name = stripeSession.customerName || order?.customer?.name || "Customer";

  // customer_email - from Stripe session (primary) or order (fallback)
  const customer_email = stripeSession.customerEmail || order?.customer?.email || "Not provided";

  // customer_phone - from Stripe session (primary) or order (fallback)
  const customer_phone = stripeSession.customerPhone || order?.customer?.phone || "Not provided";

  // price - from Stripe session (primary) or order (fallback)
  const price =
    stripeSession.amountTotal !== null
      ? `$${(stripeSession.amountTotal / 100).toFixed(2)}`
      : order?.totalPrice
        ? formatCurrency(order.totalPrice)
        : "$0.00";

  // music_choice - from order (requires DB)
  const music_choice = order?.musicSelection || "Not available (database connection failed)";

  // video_titles - branding info from order (requires DB)
  let video_titles = "Unbranded";
  if (order?.branding) {
    if (order.branding.type === "unbranded") {
      video_titles = "Unbranded";
    } else {
      const parts: string[] = [];
      if (order.branding.agentName) parts.push(`Agent: ${order.branding.agentName}`);
      if (order.branding.companyName) parts.push(`Company: ${order.branding.companyName}`);
      if (order.branding.phone) parts.push(`Phone: ${order.branding.phone}`);
      if (order.branding.email) parts.push(`Email: ${order.branding.email}`);
      if (order.branding.website) parts.push(`Website: ${order.branding.website}`);
      video_titles = parts.length > 0 ? parts.join(" | ") : getBrandingLabel(order.branding.type);
    }
  } else {
    video_titles = "Not available (database connection failed)";
  }

  // special_requests - from order (requires DB)
  const special_requests = order?.specialInstructions || "None";

  // image_urls - Cloudinary links from order (requires DB)
  let image_urls = "No images available (database connection failed)";
  if (order?.photos && order.photos.length > 0) {
    image_urls = order.photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
  }

  return {
    customer_name,
    customer_email,
    customer_phone,
    price,
    music_choice,
    video_titles,
    special_requests,
    image_urls,
    // Additional fields for templates
    order_id: order?.orderId || "Unknown",
    photo_count: String(order?.photoCount || 0),
    branding_type: order?.branding ? getBrandingLabel(order.branding.type) : "Unknown",
    voiceover: order?.voiceover ? `Yes - Script: ${order.voiceoverScript || "No script"}` : "No",
    include_edited_photos: order?.includeEditedPhotos ? "Yes" : "No",
  };
}

/**
 * REQUEST 1: CUSTOMER RECEIPT EMAIL
 * Sends a receipt to the customer with confirmation details
 * Uses CUSTOMER_RECEIPT_TEMPLATE_ID if set, otherwise falls back to HTML
 */
export async function sendCustomerEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  console.log("[MailerSend] ========================================");
  console.log("[MailerSend] REQUEST 1: Sending CUSTOMER RECEIPT email");
  console.log("[MailerSend] ========================================");

  // VALIDATION: Check environment variables
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error("[MailerSend] Environment validation failed:", validation.errors);
    return { success: false, error: validation.errors.join("; ") };
  }
  console.log("[MailerSend] MAILERSEND_SENDER_EMAIL is set to:", FROM_EMAIL);

  // Get customer email - required for sending
  const customerEmail = stripeSession.customerEmail || order?.customer?.email;
  if (!customerEmail) {
    console.error("[MailerSend] No customer email available - cannot send receipt");
    return { success: false, error: "No customer email available" };
  }

  // Build personalization with EXACT variable names
  const personalization = buildPersonalizationData(order, stripeSession);

  console.log("[MailerSend] Customer email recipient:", customerEmail);
  console.log("[MailerSend] Personalization data:", JSON.stringify(personalization, null, 2));

  // EXPLICIT SUBJECT LINE (required to avoid MS42209)
  const subject = `Order Confirmation - Thank you, ${personalization.customer_name}!`;

  try {
    let requestBody: Record<string, unknown>;

    if (CUSTOMER_TEMPLATE_ID) {
      // Use template with personalization
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: customerEmail, name: personalization.customer_name }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: CUSTOMER_TEMPLATE_ID,
        personalization: [
          {
            email: customerEmail,
            data: personalization,
          },
        ],
      };
      console.log("[MailerSend] Using template ID:", CUSTOMER_TEMPLATE_ID);
    } else {
      // Fallback HTML email
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d;">Order Confirmation</h1>
          <p>Hi ${personalization.customer_name},</p>
          <p>Thank you for your order! Your real estate video will be delivered within 3 business days.</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Total:</strong> ${personalization.price}</p>
            <p><strong>Photos Uploaded:</strong> ${personalization.photo_count}</p>
            <p><strong>Music Selection:</strong> ${personalization.music_choice}</p>
          </div>
          <p>If you have any questions, please reply to this email or contact us.</p>
          <p>Best regards,<br>Real Estate Photo2Video Team</p>
        </div>
      `;

      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: customerEmail, name: personalization.customer_name }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        html: html,
        text: `Hi ${personalization.customer_name}, Thank you for your order! Total: ${personalization.price}. Your video will be delivered within 3 business days.`,
      };
      console.log("[MailerSend] Using HTML fallback (no template ID configured)");
    }

    console.log("[MailerSend] Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[MailerSend] Response status:", response.status);
    console.log("[MailerSend] Response body:", responseText);

    if (!response.ok) {
      console.error("[MailerSend] Customer email FAILED");
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[MailerSend] Customer receipt email sent SUCCESSFULLY");
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception sending customer email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * REQUEST 2: ADMIN FULL REPORT EMAIL
 * Sends ALL order details to realestatephoto2video@gmail.com
 * Includes: customer info, Cloudinary links, music selection, branding, etc.
 * Uses ADMIN_TEMPLATE_ID if set, otherwise falls back to detailed HTML
 */
export async function sendAdminEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  console.log("[MailerSend] ========================================");
  console.log("[MailerSend] REQUEST 2: Sending ADMIN FULL REPORT email");
  console.log("[MailerSend] ========================================");

  // VALIDATION: Check environment variables
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error("[MailerSend] Environment validation failed:", validation.errors);
    return { success: false, error: validation.errors.join("; ") };
  }
  console.log("[MailerSend] MAILERSEND_SENDER_EMAIL is set to:", FROM_EMAIL);

  // Build personalization with EXACT variable names
  const personalization = buildPersonalizationData(order, stripeSession);

  console.log("[MailerSend] Admin email recipient:", ADMIN_EMAIL);
  console.log("[MailerSend] Personalization data:", JSON.stringify(personalization, null, 2));

  // EXPLICIT SUBJECT LINE (required to avoid MS42209)
  const subject = `New Order #${personalization.order_id} - ${personalization.customer_name} - ${personalization.price}`;

  try {
    let requestBody: Record<string, unknown>;

    if (ADMIN_TEMPLATE_ID) {
      // Use template with personalization
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Real Estate Photo2Video Admin" }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: ADMIN_TEMPLATE_ID,
        personalization: [
          {
            email: ADMIN_EMAIL,
            data: personalization,
          },
        ],
      };
      console.log("[MailerSend] Using template ID:", ADMIN_TEMPLATE_ID);
    } else {
      // Detailed HTML email with ALL order information
      const imageUrlsHtml =
        order?.photos && order.photos.length > 0
          ? order.photos
              .map(
                (photo, index) =>
                  `<tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Photo ${index + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                      <a href="${photo.secure_url}" target="_blank" style="color: #3182ce; word-break: break-all;">${photo.secure_url}</a>
                    </td>
                  </tr>`
              )
              .join("")
          : `<tr><td colspan="2" style="padding: 8px; color: #e53e3e;">No images available - Database connection may have failed</td></tr>`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px;">
            New Order Received - #${personalization.order_id}
          </h1>
          
          <h2 style="color: #2d3748; margin-top: 30px;">Customer Information</h2>
          <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 12px;">${personalization.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Email:</td>
              <td style="padding: 12px;"><a href="mailto:${personalization.customer_email}">${personalization.customer_email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Phone:</td>
              <td style="padding: 12px;">${personalization.customer_phone}</td>
            </tr>
          </table>

          <h2 style="color: #2d3748; margin-top: 30px;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; width: 150px;">Price:</td>
              <td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${personalization.price}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Photo Count:</td>
              <td style="padding: 12px;">${personalization.photo_count}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Music Choice:</td>
              <td style="padding: 12px;">${personalization.music_choice}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Branding Type:</td>
              <td style="padding: 12px;">${personalization.branding_type}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Video Titles:</td>
              <td style="padding: 12px;">${personalization.video_titles}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Voiceover:</td>
              <td style="padding: 12px;">${personalization.voiceover}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Edited Photos:</td>
              <td style="padding: 12px;">${personalization.include_edited_photos}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Special Requests:</td>
              <td style="padding: 12px;">${personalization.special_requests}</td>
            </tr>
          </table>

          <h2 style="color: #2d3748; margin-top: 30px;">Image URLs (Cloudinary)</h2>
          <table style="width: 100%; border-collapse: collapse; background: #edf2f7; border-radius: 8px;">
            <thead>
              <tr style="background: #4a5568; color: white;">
                <th style="padding: 12px; text-align: left;">Photo</th>
                <th style="padding: 12px; text-align: left;">URL</th>
              </tr>
            </thead>
            <tbody>
              ${imageUrlsHtml}
            </tbody>
          </table>

          <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #744210;">
            Video to be delivered within 3 business days.
          </p>
        </div>
      `;

      const text = `
NEW ORDER - #${personalization.order_id}
========================================

CUSTOMER INFORMATION
--------------------
Name: ${personalization.customer_name}
Email: ${personalization.customer_email}
Phone: ${personalization.customer_phone}

ORDER DETAILS
-------------
Price: ${personalization.price}
Photo Count: ${personalization.photo_count}
Music Choice: ${personalization.music_choice}
Branding Type: ${personalization.branding_type}
Video Titles: ${personalization.video_titles}
Voiceover: ${personalization.voiceover}
Edited Photos: ${personalization.include_edited_photos}
Special Requests: ${personalization.special_requests}

IMAGE URLS (CLOUDINARY)
-----------------------
${personalization.image_urls}

========================================
Video to be delivered within 3 business days.
      `.trim();

      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Real Estate Photo2Video Admin" }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        html: html,
        text: text,
      };
      console.log("[MailerSend] Using HTML fallback (no template ID configured)");
    }

    console.log("[MailerSend] Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[MailerSend] Response status:", response.status);
    console.log("[MailerSend] Response body:", responseText);

    if (!response.ok) {
      console.error("[MailerSend] Admin email FAILED");
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[MailerSend] Admin full report email sent SUCCESSFULLY");
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception sending admin email:", error);
    return { success: false, error: String(error) };
  }
}

// Legacy exports for backward compatibility
export async function sendCustomerReceiptEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerEmail(order, stripeSession);
}

export async function sendOrderTemplateEmail(order: Order): Promise<{ success: boolean; error?: string }> {
  const stripeSession: StripeSessionData = {
    customerName: order.customer?.name || null,
    customerEmail: order.customer?.email || null,
    customerPhone: order.customer?.phone || null,
    amountTotal: order.totalPrice ? Math.round(order.totalPrice * 100) : null,
  };
  return sendAdminEmail(order, stripeSession);
}

export async function sendOrderConfirmationEmails(
  order: Order
): Promise<{ customer: { success: boolean; error?: string }; business: { success: boolean; error?: string } }> {
  const stripeSession: StripeSessionData = {
    customerName: order.customer?.name || null,
    customerEmail: order.customer?.email || null,
    customerPhone: order.customer?.phone || null,
    amountTotal: order.totalPrice ? Math.round(order.totalPrice * 100) : null,
  };

  const customerResult = await sendCustomerEmail(order, stripeSession);
  const adminResult = await sendAdminEmail(order, stripeSession);

  return {
    customer: customerResult,
    business: adminResult,
  };
}
