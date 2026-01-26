import type { Order } from "@/lib/types/order";

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
// IMPORTANT: FROM_EMAIL must be from your verified domain in MailerSend
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

function validateFromEmail(): { valid: boolean; error?: string } {
  if (!FROM_EMAIL) {
    return {
      valid: false,
      error: "MAILERSEND_SENDER_EMAIL is not configured. This must be set to an email from your verified domain.",
    };
  }
  return { valid: true };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
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
 * CUSTOMER EMAIL
 * Sends a simple receipt to the customer with:
 * - customer_name, product_name, price, delivery_message
 */
export async function sendCustomerEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] sendCustomerEmail called");

  if (!MAILERSEND_API_KEY) {
    console.error("[v0] MAILERSEND_API_KEY is not configured");
    return { success: false, error: "API key not configured" };
  }

  const fromValidation = validateFromEmail();
  if (!fromValidation.valid) {
    console.error("[v0] FROM_EMAIL validation failed:", fromValidation.error);
    return { success: false, error: fromValidation.error };
  }

  // Get customer email from Stripe session (primary) or order (fallback)
  const customerEmail = stripeSession.customerEmail || order?.customer?.email;
  if (!customerEmail) {
    console.error("[v0] No customer email available");
    return { success: false, error: "No customer email available" };
  }

  // Extract data - Stripe session is primary source, order is fallback
  const customerName = stripeSession.customerName || order?.customer?.name || "Customer";
  const price = stripeSession.amountTotal !== null
    ? `$${(stripeSession.amountTotal / 100).toFixed(2)}`
    : order?.totalPrice
      ? formatCurrency(order.totalPrice)
      : "$0.00";

  const deliveryMessage = "Thank you for your purchase! Your video will be ready within 3 business days.";

  console.log("[v0] Sending customer email to:", customerEmail);
  console.log("[v0] Customer name:", customerName);
  console.log("[v0] Price:", price);

  // Build personalization with EXACT required keys
  const personalization = {
    customer_name: customerName,
    product_name: "Real Estate Video Package",
    price: price,
    delivery_message: deliveryMessage,
  };

  try {
    // If template ID is configured, use template; otherwise use simple HTML
    if (CUSTOMER_TEMPLATE_ID) {
      const requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: customerEmail, name: customerName }],
        subject: `Order Confirmation - Thank you for your purchase!`,
        template_id: CUSTOMER_TEMPLATE_ID,
        personalization: [{ email: customerEmail, data: personalization }],
      };

      console.log("[v0] Customer email request (template):", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[v0] MailerSend customer email status:", response.status);
      console.log("[v0] MailerSend customer email response:", responseText);

      if (!response.ok) {
        return { success: false, error: responseText };
      }
    } else {
      // Fallback: send simple HTML email without template
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Order Confirmation</h1>
          <p>Hi ${customerName},</p>
          <p>${deliveryMessage}</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Product:</strong> Real Estate Video Package</p>
            <p><strong>Total:</strong> ${price}</p>
          </div>
          <p>If you have any questions, please reply to this email.</p>
          <p>Best regards,<br>Real Estate Photo2Video Team</p>
        </div>
      `;

      const requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: customerEmail, name: customerName }],
        subject: `Order Confirmation - Thank you for your purchase!`,
        html: html,
        text: `Hi ${customerName}, ${deliveryMessage} Product: Real Estate Video Package. Total: ${price}`,
      };

      console.log("[v0] Customer email request (HTML):", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[v0] MailerSend customer email status:", response.status);
      console.log("[v0] MailerSend customer email response:", responseText);

      if (!response.ok) {
        return { success: false, error: responseText };
      }
    }

    console.log("[v0] Customer email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to send customer email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * ADMIN EMAIL
 * Sends all internal details to realestatephoto2video@gmail.com with:
 * - customer_name, customer_email, customer_phone
 * - product_name, price
 * - image_urls (formatted as string)
 * - music_choice, video_titles, special_requests
 * - delivery_message
 */
export async function sendAdminEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] sendAdminEmail called");

  if (!MAILERSEND_API_KEY) {
    console.error("[v0] MAILERSEND_API_KEY is not configured");
    return { success: false, error: "API key not configured" };
  }

  const fromValidation = validateFromEmail();
  if (!fromValidation.valid) {
    console.error("[v0] FROM_EMAIL validation failed:", fromValidation.error);
    return { success: false, error: fromValidation.error };
  }

  // Extract all data with fallbacks
  const customerName = stripeSession.customerName || order?.customer?.name || "Unknown";
  const customerEmail = stripeSession.customerEmail || order?.customer?.email || "Unknown";
  const customerPhone = stripeSession.customerPhone || order?.customer?.phone || "Not provided";
  const price = stripeSession.amountTotal !== null
    ? `$${(stripeSession.amountTotal / 100).toFixed(2)}`
    : order?.totalPrice
      ? formatCurrency(order.totalPrice)
      : "$0.00";

  // Image URLs - formatted as string (one per line)
  const imageUrls = order?.photos && order.photos.length > 0
    ? order.photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n")
    : "No images available - DB connection may have failed";

  // Music choice
  const musicChoice = order?.musicSelection || "Not specified (DB unavailable)";

  // Video titles (branding info)
  let videoTitles = "Unbranded";
  if (order?.branding) {
    if (order.branding.type === "unbranded") {
      videoTitles = "Unbranded";
    } else {
      const parts = [];
      if (order.branding.agentName) parts.push(`Agent: ${order.branding.agentName}`);
      if (order.branding.companyName) parts.push(`Company: ${order.branding.companyName}`);
      if (order.branding.phone) parts.push(`Phone: ${order.branding.phone}`);
      if (order.branding.email) parts.push(`Email: ${order.branding.email}`);
      if (order.branding.website) parts.push(`Website: ${order.branding.website}`);
      videoTitles = parts.length > 0 ? parts.join(", ") : getBrandingLabel(order.branding.type);
    }
  }

  // Special requests
  const specialRequests = order?.specialInstructions || "None";

  // Voiceover info
  const voiceoverInfo = order?.voiceover
    ? `Yes - Script: ${order.voiceoverScript || "No script provided"}`
    : "No";

  const deliveryMessage = "Video to be delivered within 3 business days.";

  console.log("[v0] Sending admin email to:", ADMIN_EMAIL);
  console.log("[v0] Order ID:", order?.orderId || "Unknown");
  console.log("[v0] Image URLs count:", order?.photos?.length || 0);

  // Build personalization with ALL required keys
  const personalization = {
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    product_name: "Real Estate Video Package",
    price: price,
    image_urls: imageUrls,
    music_choice: musicChoice,
    video_titles: videoTitles,
    special_requests: specialRequests,
    delivery_message: deliveryMessage,
    // Additional useful fields
    order_id: order?.orderId || "Unknown",
    order_date: order?.createdAt ? formatDate(order.createdAt) : formatDate(new Date()),
    photo_count: String(order?.photoCount || 0),
    voiceover: voiceoverInfo,
    branding_type: order?.branding ? getBrandingLabel(order.branding.type) : "Unknown",
    include_edited_photos: order?.includeEditedPhotos ? "Yes" : "No",
  };

  try {
    // If template ID is configured, use template; otherwise use detailed HTML
    if (ADMIN_TEMPLATE_ID) {
      const requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Real Estate Photo2Video" }],
        subject: `New Order Received - #${order?.orderId || "Unknown"} - ${customerName}`,
        template_id: ADMIN_TEMPLATE_ID,
        personalization: [{ email: ADMIN_EMAIL, data: personalization }],
      };

      console.log("[v0] Admin email request (template):", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[v0] MailerSend admin email status:", response.status);
      console.log("[v0] MailerSend admin email response:", responseText);

      if (!response.ok) {
        return { success: false, error: responseText };
      }
    } else {
      // Fallback: send detailed HTML email without template
      const imageUrlsHtml = order?.photos && order.photos.length > 0
        ? order.photos.map((photo, index) =>
            `<p><a href="${photo.secure_url}" target="_blank">Photo ${index + 1}</a></p>`
          ).join("")
        : "<p>No images available - DB connection may have failed</p>";

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #1a365d; border-bottom: 2px solid #ecc94b; padding-bottom: 10px;">
            New Order Received - #${order?.orderId || "Unknown"}
          </h1>
          
          <h2 style="color: #2d3748;">Customer Information</h2>
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
          </div>

          <h2 style="color: #2d3748;">Order Details</h2>
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Product:</strong> Real Estate Video Package</p>
            <p><strong>Price:</strong> ${price}</p>
            <p><strong>Photo Count:</strong> ${order?.photoCount || "Unknown"}</p>
            <p><strong>Music Choice:</strong> ${musicChoice}</p>
            <p><strong>Branding Type:</strong> ${order?.branding ? getBrandingLabel(order.branding.type) : "Unknown"}</p>
            <p><strong>Video Titles/Branding:</strong> ${videoTitles}</p>
            <p><strong>Voiceover:</strong> ${voiceoverInfo}</p>
            <p><strong>Include Edited Photos:</strong> ${order?.includeEditedPhotos ? "Yes" : "No"}</p>
            <p><strong>Special Requests:</strong> ${specialRequests}</p>
          </div>

          <h2 style="color: #2d3748;">Image URLs (Cloudinary)</h2>
          <div style="background: #edf2f7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            ${imageUrlsHtml}
          </div>

          <p style="color: #718096; font-size: 14px;">${deliveryMessage}</p>
        </div>
      `;

      const text = `
New Order - #${order?.orderId || "Unknown"}

CUSTOMER:
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

ORDER DETAILS:
Product: Real Estate Video Package
Price: ${price}
Photo Count: ${order?.photoCount || "Unknown"}
Music Choice: ${musicChoice}
Branding: ${order?.branding ? getBrandingLabel(order.branding.type) : "Unknown"}
Video Titles: ${videoTitles}
Voiceover: ${voiceoverInfo}
Include Edited Photos: ${order?.includeEditedPhotos ? "Yes" : "No"}
Special Requests: ${specialRequests}

IMAGE URLS:
${imageUrls}

${deliveryMessage}
      `.trim();

      const requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Real Estate Photo2Video" }],
        subject: `New Order Received - #${order?.orderId || "Unknown"} - ${customerName}`,
        html: html,
        text: text,
      };

      console.log("[v0] Admin email request (HTML):", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[v0] MailerSend admin email status:", response.status);
      console.log("[v0] MailerSend admin email response:", responseText);

      if (!response.ok) {
        return { success: false, error: responseText };
      }
    }

    console.log("[v0] Admin email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to send admin email:", error);
    return { success: false, error: String(error) };
  }
}

// Legacy exports for backward compatibility (these now call the new functions)
export async function sendCustomerReceiptEmail(
  order: Order | null,
  stripeSession: StripeSessionData
): Promise<{ success: boolean; error?: string }> {
  return sendCustomerEmail(order, stripeSession);
}

export async function sendOrderTemplateEmail(order: Order): Promise<{ success: boolean; error?: string }> {
  // Convert order to StripeSessionData format for the new function
  const stripeSession: StripeSessionData = {
    customerName: order.customer?.name || null,
    customerEmail: order.customer?.email || null,
    customerPhone: order.customer?.phone || null,
    amountTotal: order.totalPrice ? Math.round(order.totalPrice * 100) : null,
  };
  return sendAdminEmail(order, stripeSession);
}

export async function sendOrderConfirmationEmails(order: Order): Promise<{ customer: { success: boolean; error?: string }; business: { success: boolean; error?: string } }> {
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
