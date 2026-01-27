/**
 * MAILERSEND EMAIL SERVICE
 * 
 * Production-grade implementation with:
 * - Strict error handling
 * - Detailed logging for debugging
 * - Template ID: zr6ke4n6kzelon12
 */

// Hardcoded template ID per requirements
const CUSTOMER_TEMPLATE_ID = "zr6ke4n6kzelon12";

// Admin recipients for BCC
const ADMIN_EMAILS = [
  { email: "realestatephoto2video@gmail.com", name: "Admin" },
  { email: "info@realestatephoto2video.com", name: "Admin 2" }
];

/**
 * Personalization data interface - all fields passed to template
 */
export interface PersonalizationData {
  order_id: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name: string;
  photo_count: string;
  base_price: string;
  branding_fee: string;
  voiceover_fee: string;
  edited_photos_fee: string;
  total_price: string;
  music_choice: string;
  custom_audio_url: string;
  custom_audio_filename: string;
  branding_type: string;
  branding_logo_url: string;
  branding_agent_name: string;
  branding_company_name: string;
  branding_phone: string;
  branding_email: string;
  branding_website: string;
  voiceover_enabled: string;
  voiceover_voice: string;
  voiceover_script: string;
  include_edited_photos: string;
  special_requests: string;
  image_urls: string; // MUST be a string, newline separated
}

/**
 * Send customer email using MailerSend template
 * Returns a promise that resolves only after the API call completes
 */
export async function sendCustomerEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_SENDER_EMAIL;
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  // Validate required environment variables
  if (!apiKey) {
    console.error("MAILERSEND_CRITICAL_FAILURE", "MAILERSEND_API_KEY is not configured");
    return { success: false, error: "MAILERSEND_API_KEY is not configured" };
  }

  if (!fromEmail) {
    console.error("MAILERSEND_CRITICAL_FAILURE", "MAILERSEND_SENDER_EMAIL is not configured");
    return { success: false, error: "MAILERSEND_SENDER_EMAIL is not configured" };
  }

  if (!data.customer_email) {
    console.error("MAILERSEND_CRITICAL_FAILURE", "No customer email provided in data");
    return { success: false, error: "No customer email provided" };
  }

  // Ensure image_urls is a string (critical for template)
  const imageUrlsString = typeof data.image_urls === "string" 
    ? data.image_urls 
    : String(data.image_urls || "No images");

  // Build request body with EXACT format MailerSend expects
  const requestBody = {
    from: {
      email: fromEmail,
      name: fromName
    },
    to: [
      {
        email: data.customer_email,
        name: data.customer_name || "Customer"
      }
    ],
    // BCC MUST be array of objects with email and name
    bcc: ADMIN_EMAILS,
    subject: `Order Confirmation - #${data.order_id}`,
    template_id: CUSTOMER_TEMPLATE_ID,
    personalization: [
      {
        email: data.customer_email,
        data: {
          order_id: data.order_id || "",
          order_date: data.order_date || "",
          customer_name: data.customer_name || "",
          customer_email: data.customer_email || "",
          customer_phone: data.customer_phone || "",
          product_name: data.product_name || "",
          photo_count: data.photo_count || "0",
          base_price: data.base_price || "$0.00",
          branding_fee: data.branding_fee || "$0.00",
          voiceover_fee: data.voiceover_fee || "$0.00",
          edited_photos_fee: data.edited_photos_fee || "$0.00",
          total_price: data.total_price || "$0.00",
          music_choice: data.music_choice || "Not specified",
          custom_audio_url: data.custom_audio_url || "",
          custom_audio_filename: data.custom_audio_filename || "",
          branding_type: data.branding_type || "unbranded",
          branding_logo_url: data.branding_logo_url || "",
          branding_agent_name: data.branding_agent_name || "",
          branding_company_name: data.branding_company_name || "",
          branding_phone: data.branding_phone || "",
          branding_email: data.branding_email || "",
          branding_website: data.branding_website || "",
          voiceover_enabled: data.voiceover_enabled || "No",
          voiceover_voice: data.voiceover_voice || "",
          voiceover_script: data.voiceover_script || "",
          include_edited_photos: data.include_edited_photos || "No",
          special_requests: data.special_requests || "",
          image_urls: imageUrlsString
        }
      }
    ]
  };

  console.log("[MAILERSEND] Sending customer email to:", data.customer_email);
  console.log("[MAILERSEND] Template ID:", CUSTOMER_TEMPLATE_ID);
  console.log("[MAILERSEND] BCC recipients:", ADMIN_EMAILS.map(e => e.email).join(", "));

  let response: Response;
  let responseText: string;

  try {
    response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(requestBody)
    });

    responseText = await response.text();
  } catch (networkError) {
    const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
    console.error("MAILERSEND_CRITICAL_FAILURE", {
      type: "NETWORK_ERROR",
      message: errorMessage,
      order_id: data.order_id
    });
    return { success: false, error: `Network error: ${errorMessage}` };
  }

  // Log response details
  console.log("[MAILERSEND] Response status:", response.status);

  if (!response.ok) {
    // Parse error body for detailed logging
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(responseText);
    } catch {
      errorBody = responseText;
    }

    console.error("MAILERSEND_CRITICAL_FAILURE", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
      order_id: data.order_id,
      customer_email: data.customer_email
    });

    return { 
      success: false, 
      error: `MailerSend API error: ${response.status} - ${JSON.stringify(errorBody)}`,
      statusCode: response.status
    };
  }

  console.log("[MAILERSEND] Customer email sent successfully");
  console.log("[MAILERSEND] Response:", responseText || "(empty - 202 accepted)");

  return { success: true, statusCode: response.status };
}

/**
 * Send admin notification email with full order details (HTML)
 */
export async function sendAdminNotificationEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_SENDER_EMAIL;
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  if (!apiKey || !fromEmail) {
    console.error("MAILERSEND_CRITICAL_FAILURE", "Missing API key or sender email for admin notification");
    return { success: false, error: "Missing MailerSend configuration" };
  }

  const html = buildAdminEmailHtml(data);

  const requestBody = {
    from: { email: fromEmail, name: fromName },
    to: ADMIN_EMAILS,
    subject: `NEW ORDER: ${data.customer_name} - #${data.order_id}`,
    html: html,
    text: `NEW ORDER #${data.order_id}\n\nCustomer: ${data.customer_name}\nEmail: ${data.customer_email}\nPhone: ${data.customer_phone}\nProduct: ${data.product_name}\nTotal: ${data.total_price}\n\nImages:\n${data.image_urls}`
  };

  console.log("[MAILERSEND] Sending admin notification for order:", data.order_id);

  let response: Response;
  let responseText: string;

  try {
    response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    responseText = await response.text();
  } catch (networkError) {
    const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
    console.error("MAILERSEND_CRITICAL_FAILURE", {
      type: "NETWORK_ERROR_ADMIN",
      message: errorMessage,
      order_id: data.order_id
    });
    return { success: false, error: `Network error: ${errorMessage}` };
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(responseText);
    } catch {
      errorBody = responseText;
    }

    console.error("MAILERSEND_CRITICAL_FAILURE", {
      type: "ADMIN_EMAIL_FAILED",
      status: response.status,
      body: errorBody,
      order_id: data.order_id
    });

    return { 
      success: false, 
      error: `Admin email failed: ${response.status}`,
      statusCode: response.status
    };
  }

  console.log("[MAILERSEND] Admin notification sent successfully");
  return { success: true, statusCode: response.status };
}

/**
 * Build HTML for admin email
 */
function buildAdminEmailHtml(data: PersonalizationData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px; margin-top: 0;">
      NEW ORDER - #${data.order_id}
    </h1>
    
    <h2 style="color: #2d3748; margin-top: 25px;">Customer</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Name:</td><td style="padding: 10px;">${data.customer_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;"><a href="mailto:${data.customer_email}">${data.customer_email}</a></td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Phone:</td><td style="padding: 10px;">${data.customer_phone}</td></tr>
    </table>

    <h2 style="color: #2d3748; margin-top: 25px;">Order Details</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Product:</td><td style="padding: 10px;">${data.product_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Photos:</td><td style="padding: 10px;">${data.photo_count}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Music:</td><td style="padding: 10px;">${data.music_choice}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Edited Photos:</td><td style="padding: 10px;">${data.include_edited_photos}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Special Requests:</td><td style="padding: 10px;">${data.special_requests || "None"}</td></tr>
    </table>

    <h2 style="color: #2d3748; margin-top: 25px;">Pricing</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f0fff4; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Base:</td><td style="padding: 10px;">${data.base_price}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Branding:</td><td style="padding: 10px;">${data.branding_fee}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Voiceover:</td><td style="padding: 10px;">${data.voiceover_fee}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Edited Photos:</td><td style="padding: 10px;">${data.edited_photos_fee}</td></tr>
      <tr style="background: #c6f6d5;"><td style="padding: 10px; font-weight: bold; font-size: 16px;">TOTAL:</td><td style="padding: 10px; font-size: 16px; color: #2f855a; font-weight: bold;">${data.total_price}</td></tr>
    </table>

    ${data.branding_type !== "unbranded" ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Branding</h2>
    <table style="width: 100%; border-collapse: collapse; background: #e6fffa; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Type:</td><td style="padding: 10px;">${data.branding_type}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Agent:</td><td style="padding: 10px;">${data.branding_agent_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Company:</td><td style="padding: 10px;">${data.branding_company_name}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Phone:</td><td style="padding: 10px;">${data.branding_phone}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;">${data.branding_email}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Website:</td><td style="padding: 10px;">${data.branding_website}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Logo:</td><td style="padding: 10px; word-break: break-all;">${data.branding_logo_url || "None"}</td></tr>
    </table>
    ` : ""}

    ${data.voiceover_enabled === "Yes" ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Voiceover</h2>
    <table style="width: 100%; border-collapse: collapse; background: #faf5ff; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">Voice:</td><td style="padding: 10px;">${data.voiceover_voice}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold; vertical-align: top;">Script:</td><td style="padding: 10px; white-space: pre-wrap;">${data.voiceover_script}</td></tr>
    </table>
    ` : ""}

    ${data.custom_audio_filename ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Custom Audio</h2>
    <table style="width: 100%; border-collapse: collapse; background: #fff5f5; border-radius: 8px;">
      <tr><td style="padding: 10px; font-weight: bold; width: 140px;">File:</td><td style="padding: 10px;">${data.custom_audio_filename}</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">URL:</td><td style="padding: 10px; word-break: break-all;"><a href="${data.custom_audio_url}">${data.custom_audio_url}</a></td></tr>
    </table>
    ` : ""}

    <h2 style="color: #2d3748; margin-top: 25px;">Image URLs</h2>
    <div style="background: #edf2f7; padding: 15px; border-radius: 8px; white-space: pre-wrap; word-break: break-all; font-family: monospace; font-size: 11px;">
${data.image_urls}
    </div>

    <p style="margin-top: 25px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #744210; text-align: center;">
      Deliver video within 3 business days
    </p>
  </div>
</body>
</html>`;
}

// Legacy exports for backward compatibility
export const sendAdminEmail = sendAdminNotificationEmail;
export const sendCustomerReceiptEmail = sendCustomerEmail;
