/**
 * MAILERSEND EMAIL SERVICE - Production Grade
 * 
 * Template ID: zr6ke4n6kzelon12
 * BCC: realestatephoto2video@gmail.com (hardcoded)
 * Sender: info@realestatephoto2video.com OR MAILERSEND_SENDER_EMAIL (domain safety)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEMPLATE_ID = "zr6ke4n6kzelon12";

// Hardcoded BCC - MUST be array of objects per MailerSend spec
const BCC_RECIPIENTS = [
  { email: "realestatephoto2video@gmail.com", name: "Admin" }
];

// Preferred sender domain - falls back to env var if not verified
const PREFERRED_SENDER = "info@realestatephoto2video.com";

// ============================================================================
// TYPES
// ============================================================================

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
  image_urls: string; // Newline separated string for display
  image_urls_array?: string[]; // Array of URLs from Supabase photos field
}

interface EmailResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  responseBody?: unknown;
}

// ============================================================================
// GET SENDER EMAIL (Domain Safety)
// ============================================================================

function getSenderEmail(): string {
  // CRITICAL: MailerSend REQUIRES a verified sender domain
  // The MAILERSEND_SENDER_EMAIL must be from a domain verified in MailerSend dashboard
  const envSender = process.env.MAILERSEND_SENDER_EMAIL;
  
  if (envSender) {
    console.log("[MAILERSEND] Using verified sender from env:", envSender);
    return envSender;
  }
  
  // Fallback to preferred sender - this may fail if domain not verified
  console.warn("[MAILERSEND] WARNING: MAILERSEND_SENDER_EMAIL not set, using fallback:", PREFERRED_SENDER);
  console.warn("[MAILERSEND] If emails fail, verify the sender domain in MailerSend dashboard");
  return PREFERRED_SENDER;
}

// ============================================================================
// SEND CUSTOMER EMAIL (Template-based)
// ============================================================================

export async function sendCustomerEmail(data: PersonalizationData): Promise<EmailResult> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = getSenderEmail();
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  // Validate configuration
  if (!apiKey) {
    const error = "MAILERSEND_API_KEY not configured";
    console.error("MAILERSEND_CRITICAL_FAILURE", { reason: error, order_id: data.order_id });
    return { success: false, error };
  }

  if (!data.customer_email) {
    const error = "No customer email provided";
    console.error("MAILERSEND_CRITICAL_FAILURE", { reason: error, order_id: data.order_id });
    return { success: false, error };
  }

  // Ensure image_urls is a string for display
  const imageUrlsString = typeof data.image_urls === "string" 
    ? data.image_urls 
    : String(data.image_urls || "No images");
  
  // Ensure image_urls_array is an array (from Supabase photos field)
  const imageUrlsArray = Array.isArray(data.image_urls_array) 
    ? data.image_urls_array 
    : [];

  console.log("[MAILERSEND] image_urls_array count:", imageUrlsArray.length);
  console.log("[MAILERSEND] image_urls_array sample:", imageUrlsArray.slice(0, 2));

  // Build MailerSend request body
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
    // BCC HARDCODED to realestatephoto2video@gmail.com
    bcc: BCC_RECIPIENTS,
    subject: `Order Confirmation - #${data.order_id}`,
    template_id: TEMPLATE_ID,
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
          // image_urls as string for display
          image_urls: imageUrlsString,
          // image_urls as ARRAY from Supabase photos field (per requirement)
          image_urls_array: imageUrlsArray
        }
      }
    ]
  };

  console.log("[MAILERSEND] === SENDING CUSTOMER EMAIL ===");
  console.log("[MAILERSEND] To:", data.customer_email);
  console.log("[MAILERSEND] Template ID:", TEMPLATE_ID);
  console.log("[MAILERSEND] From:", fromEmail);
  console.log("[MAILERSEND] From Name:", fromName);
  console.log("[MAILERSEND] BCC:", BCC_RECIPIENTS.map(r => r.email).join(", "));
  console.log("[MAILERSEND] API Key present:", !!apiKey);
  console.log("[MAILERSEND] API Key starts with:", apiKey?.substring(0, 10) + "...");

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
      reason: "NETWORK_ERROR",
      error: errorMessage,
      order_id: data.order_id
    });
    return { success: false, error: `Network error: ${errorMessage}` };
  }

  console.log("[MAILERSEND] Response status:", response.status);

  // Handle non-success responses
  if (!response.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = responseText;
    }

    // EMERGENCY LOGGING - exact format requested
    console.error("MAILERSEND_CRITICAL_FAILURE", {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
      order_id: data.order_id,
      customer_email: data.customer_email,
      template_id: TEMPLATE_ID
    });

    return { 
      success: false, 
      error: `MailerSend API error: ${response.status}`,
      statusCode: response.status,
      responseBody: parsedBody
    };
  }

  console.log("[MAILERSEND] Customer email sent successfully");
  console.log("[MAILERSEND] Response:", responseText || "(202 accepted)");

  return { success: true, statusCode: response.status };
}

// ============================================================================
// SEND ADMIN NOTIFICATION EMAIL (HTML-based)
// ============================================================================

export async function sendAdminNotificationEmail(data: PersonalizationData): Promise<EmailResult> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = getSenderEmail();
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  if (!apiKey) {
    console.error("MAILERSEND_CRITICAL_FAILURE", { reason: "No API key for admin email" });
    return { success: false, error: "No API key" };
  }

  const html = buildAdminEmailHtml(data);
  const text = `NEW ORDER #${data.order_id}\n\nCustomer: ${data.customer_name}\nEmail: ${data.customer_email}\nPhone: ${data.customer_phone}\nProduct: ${data.product_name}\nTotal: ${data.total_price}\n\nImages:\n${data.image_urls}`;

  // Send to admin recipients (same as BCC list)
  const requestBody = {
    from: { email: fromEmail, name: fromName },
    to: BCC_RECIPIENTS,
    subject: `NEW ORDER: ${data.customer_name} - #${data.order_id}`,
    html: html,
    text: text
  };

  console.log("[MAILERSEND] Sending admin notification for:", data.order_id);

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
      reason: "NETWORK_ERROR_ADMIN",
      error: errorMessage,
      order_id: data.order_id
    });
    return { success: false, error: `Network error: ${errorMessage}` };
  }

  if (!response.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = responseText;
    }

    console.error("MAILERSEND_CRITICAL_FAILURE", {
      reason: "ADMIN_EMAIL_FAILED",
      status: response.status,
      body: parsedBody,
      order_id: data.order_id
    });

    return { success: false, error: `Admin email failed: ${response.status}`, responseBody: parsedBody };
  }

  console.log("[MAILERSEND] Admin notification sent successfully");
  return { success: true, statusCode: response.status };
}

// ============================================================================
// BUILD ADMIN EMAIL HTML
// ============================================================================

function buildAdminEmailHtml(data: PersonalizationData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px; margin-top: 0;">
      NEW ORDER - #${data.order_id}
    </h1>
    
    <p style="color: #666; font-size: 14px;">Received: ${data.order_date}</p>
    
    <h2 style="color: #2d3748; margin-top: 25px;">Customer Information</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Name:</td><td style="padding: 12px;">${data.customer_name}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Email:</td><td style="padding: 12px;"><a href="mailto:${data.customer_email}">${data.customer_email}</a></td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Phone:</td><td style="padding: 12px;">${data.customer_phone}</td></tr>
    </table>

    <h2 style="color: #2d3748; margin-top: 25px;">Order Details</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Product:</td><td style="padding: 12px;">${data.product_name}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Photos:</td><td style="padding: 12px;">${data.photo_count}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Music:</td><td style="padding: 12px;">${data.music_choice}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Edited Photos:</td><td style="padding: 12px;">${data.include_edited_photos}</td></tr>
    </table>

    <h2 style="color: #2d3748; margin-top: 25px;">Pricing</h2>
    <table style="width: 100%; border-collapse: collapse; background: #f0fff4; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Base Price:</td><td style="padding: 12px;">${data.base_price}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Branding Fee:</td><td style="padding: 12px;">${data.branding_fee}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Voiceover Fee:</td><td style="padding: 12px;">${data.voiceover_fee}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Edited Photos Fee:</td><td style="padding: 12px;">${data.edited_photos_fee}</td></tr>
      <tr style="background: #c6f6d5;"><td style="padding: 12px; font-weight: bold; font-size: 18px;">TOTAL:</td><td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${data.total_price}</td></tr>
    </table>

    ${data.branding_type !== "unbranded" ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Branding</h2>
    <table style="width: 100%; border-collapse: collapse; background: #e6fffa; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Type:</td><td style="padding: 12px;">${data.branding_type}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Agent Name:</td><td style="padding: 12px;">${data.branding_agent_name}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Company:</td><td style="padding: 12px;">${data.branding_company_name}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Phone:</td><td style="padding: 12px;">${data.branding_phone}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Email:</td><td style="padding: 12px;">${data.branding_email}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Website:</td><td style="padding: 12px;">${data.branding_website}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">Logo URL:</td><td style="padding: 12px; word-break: break-all;">${data.branding_logo_url || "None"}</td></tr>
    </table>
    ` : ""}

    ${data.voiceover_enabled === "Yes" ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Voiceover</h2>
    <table style="width: 100%; border-collapse: collapse; background: #faf5ff; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Voice:</td><td style="padding: 12px;">${data.voiceover_voice}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold; vertical-align: top;">Script:</td><td style="padding: 12px; white-space: pre-wrap;">${data.voiceover_script}</td></tr>
    </table>
    ` : ""}

    ${data.custom_audio_filename ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Custom Audio</h2>
    <table style="width: 100%; border-collapse: collapse; background: #fff5f5; border-radius: 8px;">
      <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Filename:</td><td style="padding: 12px;">${data.custom_audio_filename}</td></tr>
      <tr><td style="padding: 12px; font-weight: bold;">URL:</td><td style="padding: 12px; word-break: break-all;"><a href="${data.custom_audio_url}">${data.custom_audio_url}</a></td></tr>
    </table>
    ` : ""}

    ${data.special_requests ? `
    <h2 style="color: #2d3748; margin-top: 25px;">Special Requests</h2>
    <div style="background: #fffaf0; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
${data.special_requests}
    </div>
    ` : ""}

    <h2 style="color: #2d3748; margin-top: 25px;">Image URLs (Cloudinary)</h2>
    <div style="background: #edf2f7; padding: 15px; border-radius: 8px; white-space: pre-wrap; word-break: break-all; font-family: monospace; font-size: 12px; max-height: 400px; overflow-y: auto;">
${data.image_urls}
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center;">
      <p style="margin: 0; color: #744210; font-weight: bold;">Please deliver video within 3 business days</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// LEGACY EXPORTS (backward compatibility)
// ============================================================================

export const sendAdminEmail = sendAdminNotificationEmail;
export const sendCustomerReceiptEmail = sendCustomerEmail;
