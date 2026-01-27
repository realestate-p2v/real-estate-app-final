/**
 * MAILERSEND EMAIL LIBRARY
 * 
 * Sends TWO separate emails:
 * 1. Customer Receipt - sent to the customer email
 * 2. Admin Notification - sent to realestatephoto2video@gmail.com with ALL order data
 * 
 * Both emails MUST have explicit subject fields to avoid MS42209 error.
 * MAILERSEND_SENDER_EMAIL must be set to a verified domain email.
 */

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
const BCC_EMAIL = process.env.MAILERSEND_BCC_EMAIL || "info@realestatephoto2video.com"; // BCC on customer receipts
const FROM_EMAIL = process.env.MAILERSEND_SENDER_EMAIL;
const FROM_NAME = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";
const CUSTOMER_TEMPLATE_ID = process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "";
const ADMIN_TEMPLATE_ID = process.env.MAILERSEND_ORDER_TEMPLATE_ID || "";

/**
 * PERSONALIZATION DATA INTERFACE
 * These are the EXACT variable names that MUST be in the personalization block:
 */
export interface PersonalizationData {
  // ORDER ID: Must be passed to template (not blank)
  order_id: string;
  
  // Product name
  product_name: string;
  
  // Core customer info
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Pricing
  price: string;
  base_price: string;
  branding_fee: string;
  voiceover_fee: string;
  edited_photos_fee: string;
  
  // Photos/Images - mapped from order.photos
  photo_count: string;
  image_urls: string;
  
  // Music - mapped from order.musicSelection
  music_choice: string;
  custom_audio_filename: string;
  custom_audio_url: string;
  
  // Branding - mapped from order.branding
  branding_type: string;
  branding_logo_url: string;
  agent_name: string;
  company_name: string;
  agent_phone: string;
  agent_email: string;
  agent_website: string;
  branding_info: string;
  
  // Voiceover
  voiceover_included: string;
  voiceover_script: string;
  
  // Extras
  include_edited_photos: string;
  special_requests: string;
  
  // Legacy field (for backward compatibility with templates)
  video_titles: string;
  
  // Database status (for debugging)
  db_status: string;
}

/**
 * VALIDATION: Check that MAILERSEND_SENDER_EMAIL is set
 * This prevents MailerSend error #MS42209
 */
function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!MAILERSEND_API_KEY) {
    errors.push("MAILERSEND_API_KEY is not set");
  }

  if (!FROM_EMAIL) {
    errors.push("MAILERSEND_SENDER_EMAIL is not set - MUST be an email from your verified MailerSend domain");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * EMAIL 1: CUSTOMER RECEIPT
 * 
 * Sends to: customer_email from personalization data
 * Subject: "Order Confirmation - #{{order_id}}"
 */
export async function sendCustomerEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string }> {
  console.log("[MailerSend] ========================================");
  console.log("[MailerSend] EMAIL 1: CUSTOMER RECEIPT");
  console.log("[MailerSend] ========================================");

  // VALIDATION: Check MAILERSEND_SENDER_EMAIL is set
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error("[MailerSend] Environment validation failed:", validation.errors);
    return { success: false, error: validation.errors.join("; ") };
  }
  console.log("[MailerSend] MAILERSEND_SENDER_EMAIL verified:", FROM_EMAIL);

  // Check customer email exists
  if (!data.customer_email) {
    console.error("[MailerSend] No customer email provided");
    return { success: false, error: "No customer email provided" };
  }

  // SUBJECT LINE with ORDER_ID (explicit to avoid MS42209)
  const subject = `Order Confirmation - #${data.order_id}`;

  console.log("[MailerSend] Recipient:", data.customer_email);
  console.log("[MailerSend] Subject:", subject);
  console.log("[MailerSend] Order ID:", data.order_id);

  try {
    let requestBody: Record<string, unknown>;

    // Build comprehensive HTML email with ALL order information
    // Parse image URLs for display
    const imageUrlsHtml = data.image_urls
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const match = line.match(/Photo (\d+): (.+)/);
        if (match) {
          return `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Photo ${match[1]}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
              <a href="${match[2]}" target="_blank" style="color: #3182ce; word-break: break-all;">${match[2]}</a>
            </td>
          </tr>`;
        }
        return `<tr><td colspan="2" style="padding: 8px;">${line}</td></tr>`;
      })
      .join("");

    // Build branding info section
    const brandingHtml = data.branding_type !== "unbranded" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Branding Information</h2>
      <table style="width: 100%; border-collapse: collapse; background: #e6fffa; border-radius: 8px;">
        <tr>
          <td style="padding: 12px; font-weight: bold; width: 150px;">Branding Type:</td>
          <td style="padding: 12px;">${data.branding_type}</td>
        </tr>
        ${data.branding_logo_url && data.branding_logo_url !== "None" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Logo URL:</td>
          <td style="padding: 12px;"><a href="${data.branding_logo_url}" target="_blank" style="color: #3182ce;">${data.branding_logo_url}</a></td>
        </tr>` : ""}
        ${data.agent_name && data.agent_name !== "N/A" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Agent Name:</td>
          <td style="padding: 12px;">${data.agent_name}</td>
        </tr>` : ""}
        ${data.company_name && data.company_name !== "N/A" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Company Name:</td>
          <td style="padding: 12px;">${data.company_name}</td>
        </tr>` : ""}
        ${data.agent_phone && data.agent_phone !== "N/A" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Agent Phone:</td>
          <td style="padding: 12px;">${data.agent_phone}</td>
        </tr>` : ""}
        ${data.agent_email && data.agent_email !== "N/A" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Agent Email:</td>
          <td style="padding: 12px;"><a href="mailto:${data.agent_email}">${data.agent_email}</a></td>
        </tr>` : ""}
        ${data.agent_website && data.agent_website !== "N/A" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Agent Website:</td>
          <td style="padding: 12px;"><a href="${data.agent_website}" target="_blank">${data.agent_website}</a></td>
        </tr>` : ""}
      </table>
    ` : "";

    // Build voiceover section
    const voiceoverHtml = data.voiceover_included === "Yes" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Voiceover</h2>
      <table style="width: 100%; border-collapse: collapse; background: #faf5ff; border-radius: 8px;">
        <tr>
          <td style="padding: 12px; font-weight: bold; width: 150px;">Voiceover:</td>
          <td style="padding: 12px; color: #2f855a; font-weight: bold;">Included</td>
        </tr>
        ${data.voiceover_script && data.voiceover_script !== "None" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold; vertical-align: top;">Script:</td>
          <td style="padding: 12px; white-space: pre-wrap;">${data.voiceover_script}</td>
        </tr>` : ""}
      </table>
    ` : "";

    // Build custom audio section
    const customAudioHtml = data.custom_audio_filename && data.custom_audio_filename !== "None" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Custom Audio</h2>
      <table style="width: 100%; border-collapse: collapse; background: #fff5f5; border-radius: 8px;">
        <tr>
          <td style="padding: 12px; font-weight: bold; width: 150px;">Filename:</td>
          <td style="padding: 12px;">${data.custom_audio_filename}</td>
        </tr>
        ${data.custom_audio_url && data.custom_audio_url !== "None" ? `
        <tr>
          <td style="padding: 12px; font-weight: bold;">Audio URL:</td>
          <td style="padding: 12px;"><a href="${data.custom_audio_url}" target="_blank" style="color: #3182ce;">${data.custom_audio_url}</a></td>
        </tr>` : ""}
      </table>
    ` : "";

    // Comprehensive HTML email with ALL order information
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px;">
          Order Confirmation - #${data.order_id}
        </h1>
        
        <p style="font-size: 16px; color: #4a5568;">Hi ${data.customer_name},</p>
        <p style="font-size: 16px; color: #4a5568;">Thank you for your order! Your real estate video will be delivered within <strong>3 business days</strong>.</p>
        
        <h2 style="color: #2d3748; margin-top: 30px;">Your Information</h2>
        <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Name:</td>
            <td style="padding: 12px;">${data.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Email:</td>
            <td style="padding: 12px;"><a href="mailto:${data.customer_email}">${data.customer_email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Phone:</td>
            <td style="padding: 12px;">${data.customer_phone}</td>
          </tr>
        </table>

        <h2 style="color: #2d3748; margin-top: 30px;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Order ID:</td>
            <td style="padding: 12px;">${data.order_id}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Product:</td>
            <td style="padding: 12px;">${data.product_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Photo Count:</td>
            <td style="padding: 12px;">${data.photo_count} photos</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Music Selection:</td>
            <td style="padding: 12px;">${data.music_choice}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Include Edited Photos:</td>
            <td style="padding: 12px;">${data.include_edited_photos}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Special Requests:</td>
            <td style="padding: 12px;">${data.special_requests || "None"}</td>
          </tr>
        </table>

        <h2 style="color: #2d3748; margin-top: 30px;">Pricing Breakdown</h2>
        <table style="width: 100%; border-collapse: collapse; background: #f0fff4; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Base Price:</td>
            <td style="padding: 12px;">${data.base_price}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Branding Fee:</td>
            <td style="padding: 12px;">${data.branding_fee}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Voiceover Fee:</td>
            <td style="padding: 12px;">${data.voiceover_fee}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold;">Edited Photos Fee:</td>
            <td style="padding: 12px;">${data.edited_photos_fee}</td>
          </tr>
          <tr style="background: #c6f6d5;">
            <td style="padding: 12px; font-weight: bold; font-size: 18px;">TOTAL:</td>
            <td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${data.price}</td>
          </tr>
        </table>

        ${brandingHtml}
        ${voiceoverHtml}
        ${customAudioHtml}

        <h2 style="color: #2d3748; margin-top: 30px;">Uploaded Photos</h2>
        <table style="width: 100%; border-collapse: collapse; background: #edf2f7; border-radius: 8px;">
          <thead>
            <tr style="background: #4a5568; color: white;">
              <th style="padding: 12px; text-align: left;">Photo</th>
              <th style="padding: 12px; text-align: left;">URL</th>
            </tr>
          </thead>
          <tbody>
            ${imageUrlsHtml || '<tr><td colspan="2" style="padding: 12px; color: #718096;">No images available</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; color: #744210;">
          <p style="margin: 0;"><strong>What happens next?</strong></p>
          <p style="margin: 10px 0 0 0;">Our team will begin working on your video right away. You will receive your completed video within 3 business days at this email address.</p>
        </div>

        <p style="margin-top: 30px; color: #718096;">If you have any questions, please reply to this email or contact us at <a href="mailto:realestatephoto2video@gmail.com">realestatephoto2video@gmail.com</a>.</p>
        
        <p style="margin-top: 20px; color: #4a5568;">Best regards,<br><strong>Real Estate Photo2Video Team</strong></p>
      </div>
    `;

    // Comprehensive plain text version
    const text = `
ORDER CONFIRMATION - #${data.order_id}
========================================

Hi ${data.customer_name},

Thank you for your order! Your real estate video will be delivered within 3 business days.

YOUR INFORMATION
----------------
Name: ${data.customer_name}
Email: ${data.customer_email}
Phone: ${data.customer_phone}

ORDER DETAILS
-------------
Order ID: ${data.order_id}
Product: ${data.product_name}
Photo Count: ${data.photo_count}
Music Selection: ${data.music_choice}
Include Edited Photos: ${data.include_edited_photos}
Special Requests: ${data.special_requests || "None"}

PRICING BREAKDOWN
-----------------
Base Price: ${data.base_price}
Branding Fee: ${data.branding_fee}
Voiceover Fee: ${data.voiceover_fee}
Edited Photos Fee: ${data.edited_photos_fee}
TOTAL: ${data.price}

${data.branding_type !== "unbranded" ? `BRANDING
--------
Type: ${data.branding_type}
Agent Name: ${data.agent_name}
Company Name: ${data.company_name}
Agent Phone: ${data.agent_phone}
Agent Email: ${data.agent_email}
Agent Website: ${data.agent_website}
Logo URL: ${data.branding_logo_url}
` : ""}
${data.voiceover_included === "Yes" ? `VOICEOVER
---------
Included: Yes
Script: ${data.voiceover_script}
` : ""}
${data.custom_audio_filename && data.custom_audio_filename !== "None" ? `CUSTOM AUDIO
------------
Filename: ${data.custom_audio_filename}
URL: ${data.custom_audio_url}
` : ""}
UPLOADED PHOTOS
---------------
${data.image_urls}

========================================
What happens next?
Our team will begin working on your video right away. You will receive your completed video within 3 business days at this email address.

If you have any questions, please reply to this email.

Best regards,
Real Estate Photo2Video Team
    `.trim();

    if (CUSTOMER_TEMPLATE_ID) {
      // Use template with personalization - pass ALL fields for template flexibility
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: data.customer_email, name: data.customer_name }],
        bcc: [{ email: BCC_EMAIL, name: "Admin BCC" }], // BCC admin on all customer receipts (customer won't see)
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: CUSTOMER_TEMPLATE_ID,
        personalization: [
          {
            email: data.customer_email,
            data: {
              // ORDER ID: Ensure this is not blank
              order_id: data.order_id,
              // Product name
              product_name: data.product_name,
              // Customer info
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              // Pricing
              price: data.price,
              base_price: data.base_price,
              branding_fee: data.branding_fee,
              voiceover_fee: data.voiceover_fee,
              edited_photos_fee: data.edited_photos_fee,
              // Photos - mapped from order.photos
              photo_count: data.photo_count,
              image_urls: data.image_urls,
              // Music - mapped from order.musicSelection
              music_choice: data.music_choice,
              custom_audio_filename: data.custom_audio_filename,
              custom_audio_url: data.custom_audio_url,
              // Branding - mapped from order.branding
              branding_type: data.branding_type,
              branding_logo_url: data.branding_logo_url,
              branding_info: data.branding_info,
              agent_name: data.agent_name,
              company_name: data.company_name,
              agent_phone: data.agent_phone,
              agent_email: data.agent_email,
              agent_website: data.agent_website,
              // Voiceover
              voiceover_included: data.voiceover_included,
              voiceover_script: data.voiceover_script,
              // Extras
              include_edited_photos: data.include_edited_photos,
              special_requests: data.special_requests,
              // Legacy
              video_titles: data.video_titles,
            },
          },
        ],
      };
      console.log("[MailerSend] Using template ID:", CUSTOMER_TEMPLATE_ID);
    } else {
      // Use comprehensive HTML email with ALL order information
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: data.customer_email, name: data.customer_name }],
        bcc: [{ email: BCC_EMAIL, name: "Admin BCC" }], // BCC admin on all customer receipts (customer won't see)
        subject: subject, // EXPLICIT SUBJECT with ORDER_ID
        html: html,
        text: text,
      };
      console.log("[MailerSend] Using comprehensive HTML email (no template)");
    }

    console.log("[v0] ========================================");
    console.log("[v0] MAILERSEND CUSTOMER EMAIL REQUEST");
    console.log("[v0] ========================================");
    console.log("[v0] FROM_EMAIL:", FROM_EMAIL);
    console.log("[v0] TO:", data.customer_email);
    console.log("[v0] BCC:", BCC_EMAIL);
    console.log("[v0] TEMPLATE_ID:", CUSTOMER_TEMPLATE_ID || "NONE - using HTML fallback");
    console.log("[v0] Full request body:", JSON.stringify(requestBody, null, 2));
    console.log("[v0] ========================================");

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[v0] MailerSend API Response status:", response.status);
    console.log("[v0] MailerSend API Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log("[v0] MailerSend API Response body:", responseText);

    if (!response.ok) {
      console.error("[v0] Customer email FAILED - Status:", response.status);
      console.error("[v0] Error details:", responseText);
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[v0] Customer email sent SUCCESSFULLY to:", data.customer_email);
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * EMAIL 2: ADMIN NOTIFICATION (REQUIRED SEPARATE CALL)
 * 
 * Sends to: realestatephoto2video@gmail.com
 * Subject: "NEW ORDER: {{customer_name}} - #{{order_id}}"
 * 
 * This function sends ALL order data including:
 * - order.photos (images) with URLs
 * - order.musicSelection
 * - order.branding with all fields
 * - All pricing breakdown
 * - Database connection status
 */
export async function sendAdminNotificationEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string }> {
  console.log("[MailerSend] ========================================");
  console.log("[MailerSend] EMAIL 2: ADMIN NOTIFICATION");
  console.log("[MailerSend] Recipient: realestatephoto2video@gmail.com");
  console.log("[MailerSend] ========================================");

  // VALIDATION: Check MAILERSEND_SENDER_EMAIL is set
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error("[MailerSend] Environment validation failed:", validation.errors);
    return { success: false, error: validation.errors.join("; ") };
  }
  console.log("[MailerSend] MAILERSEND_SENDER_EMAIL verified:", FROM_EMAIL);

  // SUBJECT LINE with ORDER_ID (explicit to avoid MS42209)
  const subject = `NEW ORDER: ${data.customer_name} - #${data.order_id}`;

  console.log("[MailerSend] Subject:", subject);
  console.log("[MailerSend] Order ID:", data.order_id);
  console.log("[MailerSend] Database Status:", data.db_status);

  try {
    let requestBody: Record<string, unknown>;

    if (ADMIN_TEMPLATE_ID) {
      // Use template with personalization - pass ALL fields
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Admin" }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: ADMIN_TEMPLATE_ID,
        personalization: [
          {
            email: ADMIN_EMAIL,
            data: {
              // ORDER ID: Must not be blank
              order_id: data.order_id,
              // Product name
              product_name: data.product_name,
              // Customer info
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              // Pricing
              price: data.price,
              base_price: data.base_price,
              branding_fee: data.branding_fee,
              voiceover_fee: data.voiceover_fee,
              edited_photos_fee: data.edited_photos_fee,
              // Photos - mapped from order.photos
              photo_count: data.photo_count,
              image_urls: data.image_urls,
              // Music - mapped from order.musicSelection
              music_choice: data.music_choice,
              custom_audio_filename: data.custom_audio_filename,
              custom_audio_url: data.custom_audio_url,
              // Branding - mapped from order.branding
              branding_type: data.branding_type,
              branding_logo_url: data.branding_logo_url,
              branding_info: data.branding_info,
              agent_name: data.agent_name,
              company_name: data.company_name,
              agent_phone: data.agent_phone,
              agent_email: data.agent_email,
              agent_website: data.agent_website,
              // Voiceover
              voiceover_included: data.voiceover_included,
              voiceover_script: data.voiceover_script,
              // Extras
              include_edited_photos: data.include_edited_photos,
              special_requests: data.special_requests,
              // Legacy
              video_titles: data.video_titles,
              // Database status
              db_status: data.db_status,
            },
          },
        ],
      };
      console.log("[MailerSend] Using template ID:", ADMIN_TEMPLATE_ID);
    } else {
      // Detailed HTML email with ALL order information
      const imageUrlsHtml = data.image_urls
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const match = line.match(/Photo (\d+): (.+)/);
          if (match) {
            return `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Photo ${match[1]}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                <a href="${match[2]}" target="_blank" style="color: #3182ce; word-break: break-all;">${match[2]}</a>
              </td>
            </tr>`;
          }
          return `<tr><td colspan="2" style="padding: 8px;">${line}</td></tr>`;
        })
        .join("");

      // Build branding info section
      const brandingHtml = data.branding_type !== "unbranded" ? `
        <h2 style="color: #2d3748; margin-top: 30px;">Branding Information</h2>
        <table style="width: 100%; border-collapse: collapse; background: #e6fffa; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Branding Type:</td>
            <td style="padding: 12px;">${data.branding_type}</td>
          </tr>
          ${data.branding_logo_url && data.branding_logo_url !== "None" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Logo URL:</td>
            <td style="padding: 12px;"><a href="${data.branding_logo_url}" target="_blank" style="color: #3182ce;">${data.branding_logo_url}</a></td>
          </tr>` : ""}
          ${data.agent_name && data.agent_name !== "N/A" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Agent Name:</td>
            <td style="padding: 12px;">${data.agent_name}</td>
          </tr>` : ""}
          ${data.company_name && data.company_name !== "N/A" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Company Name:</td>
            <td style="padding: 12px;">${data.company_name}</td>
          </tr>` : ""}
          ${data.agent_phone && data.agent_phone !== "N/A" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Agent Phone:</td>
            <td style="padding: 12px;">${data.agent_phone}</td>
          </tr>` : ""}
          ${data.agent_email && data.agent_email !== "N/A" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Agent Email:</td>
            <td style="padding: 12px;"><a href="mailto:${data.agent_email}">${data.agent_email}</a></td>
          </tr>` : ""}
          ${data.agent_website && data.agent_website !== "N/A" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Agent Website:</td>
            <td style="padding: 12px;"><a href="${data.agent_website}" target="_blank">${data.agent_website}</a></td>
          </tr>` : ""}
        </table>
      ` : "";

      // Build voiceover section
      const voiceoverHtml = data.voiceover_included === "Yes" ? `
        <h2 style="color: #2d3748; margin-top: 30px;">Voiceover</h2>
        <table style="width: 100%; border-collapse: collapse; background: #faf5ff; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Voiceover:</td>
            <td style="padding: 12px; color: #2f855a; font-weight: bold;">Included</td>
          </tr>
          ${data.voiceover_script && data.voiceover_script !== "None" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold; vertical-align: top;">Script:</td>
            <td style="padding: 12px; white-space: pre-wrap;">${data.voiceover_script}</td>
          </tr>` : ""}
        </table>
      ` : "";

      // Build custom audio section
      const customAudioHtml = data.custom_audio_filename && data.custom_audio_filename !== "None" ? `
        <h2 style="color: #2d3748; margin-top: 30px;">Custom Audio</h2>
        <table style="width: 100%; border-collapse: collapse; background: #fff5f5; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Filename:</td>
            <td style="padding: 12px;">${data.custom_audio_filename}</td>
          </tr>
          ${data.custom_audio_url && data.custom_audio_url !== "None" ? `
          <tr>
            <td style="padding: 12px; font-weight: bold;">Audio URL:</td>
            <td style="padding: 12px;"><a href="${data.custom_audio_url}" target="_blank" style="color: #3182ce;">${data.custom_audio_url}</a></td>
          </tr>` : ""}
        </table>
      ` : "";

      // Database status section (for debugging)
      const dbStatusHtml = `
        <h2 style="color: #2d3748; margin-top: 30px;">Database Status</h2>
        <table style="width: 100%; border-collapse: collapse; background: ${data.db_status.includes("Error") ? "#fed7d7" : "#c6f6d5"}; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-weight: bold; width: 150px;">Status:</td>
            <td style="padding: 12px; color: ${data.db_status.includes("Error") ? "#c53030" : "#2f855a"};">${data.db_status}</td>
          </tr>
        </table>
      `;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px;">
            NEW ORDER - #${data.order_id}
          </h1>
          
          <h2 style="color: #2d3748; margin-top: 30px;">Customer Information</h2>
          <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 12px;">${data.customer_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Email:</td>
              <td style="padding: 12px;"><a href="mailto:${data.customer_email}">${data.customer_email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Phone:</td>
              <td style="padding: 12px;">${data.customer_phone}</td>
            </tr>
          </table>

          <h2 style="color: #2d3748; margin-top: 30px;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; width: 150px;">Order ID:</td>
              <td style="padding: 12px;">${data.order_id}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Product:</td>
              <td style="padding: 12px;">${data.product_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Photo Count:</td>
              <td style="padding: 12px;">${data.photo_count} photos</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Music Choice:</td>
              <td style="padding: 12px;">${data.music_choice}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Include Edited Photos:</td>
              <td style="padding: 12px;">${data.include_edited_photos}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Special Requests:</td>
              <td style="padding: 12px;">${data.special_requests || "None"}</td>
            </tr>
          </table>

          <h2 style="color: #2d3748; margin-top: 30px;">Pricing Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; background: #f0fff4; border-radius: 8px;">
            <tr>
              <td style="padding: 12px; font-weight: bold; width: 150px;">Base Price:</td>
              <td style="padding: 12px;">${data.base_price}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Branding Fee:</td>
              <td style="padding: 12px;">${data.branding_fee}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Voiceover Fee:</td>
              <td style="padding: 12px;">${data.voiceover_fee}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Edited Photos Fee:</td>
              <td style="padding: 12px;">${data.edited_photos_fee}</td>
            </tr>
            <tr style="background: #c6f6d5;">
              <td style="padding: 12px; font-weight: bold; font-size: 18px;">TOTAL:</td>
              <td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${data.price}</td>
            </tr>
          </table>

          ${brandingHtml}
          ${voiceoverHtml}
          ${customAudioHtml}

          <h2 style="color: #2d3748; margin-top: 30px;">Image URLs (Cloudinary)</h2>
          <table style="width: 100%; border-collapse: collapse; background: #edf2f7; border-radius: 8px;">
            <thead>
              <tr style="background: #4a5568; color: white;">
                <th style="padding: 12px; text-align: left;">Photo</th>
                <th style="padding: 12px; text-align: left;">URL</th>
              </tr>
            </thead>
            <tbody>
              ${imageUrlsHtml || '<tr><td colspan="2" style="padding: 12px; color: #e53e3e;">No images available</td></tr>'}
            </tbody>
          </table>

          ${dbStatusHtml}

          <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #744210;">
            Video to be delivered within 3 business days.
          </p>
        </div>
      `;

      const text = `
NEW ORDER - #${data.order_id}
========================================

CUSTOMER INFORMATION
--------------------
Name: ${data.customer_name}
Email: ${data.customer_email}
Phone: ${data.customer_phone}

ORDER DETAILS
-------------
Order ID: ${data.order_id}
Product: ${data.product_name}
Photo Count: ${data.photo_count}
Music Choice: ${data.music_choice}
Include Edited Photos: ${data.include_edited_photos}
Special Requests: ${data.special_requests}

PRICING BREAKDOWN
-----------------
Base Price: ${data.base_price}
Branding Fee: ${data.branding_fee}
Voiceover Fee: ${data.voiceover_fee}
Edited Photos Fee: ${data.edited_photos_fee}
TOTAL: ${data.price}

BRANDING
--------
Type: ${data.branding_type}
Logo URL: ${data.branding_logo_url}
Agent Name: ${data.agent_name}
Company Name: ${data.company_name}
Agent Phone: ${data.agent_phone}
Agent Email: ${data.agent_email}
Agent Website: ${data.agent_website}

VOICEOVER
---------
Included: ${data.voiceover_included}
Script: ${data.voiceover_script}

CUSTOM AUDIO
------------
Filename: ${data.custom_audio_filename}
URL: ${data.custom_audio_url}

IMAGE URLS (CLOUDINARY)
-----------------------
${data.image_urls}

DATABASE STATUS
---------------
${data.db_status}

========================================
Video to be delivered within 3 business days.
      `.trim();

      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Admin" }],
        subject: subject, // EXPLICIT SUBJECT with ORDER_ID
        html: html,
        text: text,
      };
      console.log("[MailerSend] Using HTML fallback (no template)");
    }

    console.log("[v0] ========================================");
    console.log("[v0] MAILERSEND ADMIN EMAIL REQUEST");
    console.log("[v0] ========================================");
    console.log("[v0] FROM_EMAIL:", FROM_EMAIL);
    console.log("[v0] TO:", ADMIN_EMAIL);
    console.log("[v0] TEMPLATE_ID:", ADMIN_TEMPLATE_ID || "NONE - using HTML fallback");
    console.log("[v0] Full request body:", JSON.stringify(requestBody, null, 2));
    console.log("[v0] ========================================");

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[v0] MailerSend Admin API Response status:", response.status);
    console.log("[v0] MailerSend Admin API Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log("[v0] MailerSend Admin API Response body:", responseText);

    if (!response.ok) {
      console.error("[v0] Admin email FAILED - Status:", response.status);
      console.error("[v0] Error details:", responseText);
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[v0] Admin email sent SUCCESSFULLY to:", ADMIN_EMAIL);
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception:", error);
    return { success: false, error: String(error) };
  }
}

// Legacy export for backward compatibility
export const sendAdminEmail = sendAdminNotificationEmail;
