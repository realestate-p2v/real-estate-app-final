/**
 * MAILERSEND EMAIL LIBRARY - SIMPLIFIED
 * 
 * Sends order receipt email via MailerSend template.
 * Template ID: zr6ke4n6kzelon12
 */

// Template ID hardcoded per requirements
const CUSTOMER_TEMPLATE_ID = "zr6ke4n6kzelon12";

// Admin recipients
const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
const ADMIN_EMAIL_2 = "info@realestatephoto2video.com";

/**
 * PERSONALIZATION DATA INTERFACE
 */
export interface PersonalizationData {
  order_id: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price: string;
  base_price: string;
  branding_fee: string;
  voiceover_fee: string;
  edited_photos_fee: string;
  photo_count: string;
  image_urls: string;
  music_choice: string;
  custom_audio_filename: string;
  custom_audio_url: string;
  branding_type: string;
  branding_logo_url: string;
  agent_name: string;
  company_name: string;
  agent_phone: string;
  agent_email: string;
  agent_website: string;
  branding_info: string;
  voiceover_included: string;
  voiceover_script: string;
  include_edited_photos: string;
  special_requests: string;
  video_titles: string;
  db_status: string;
}

/**
 * CUSTOMER EMAIL - Using MailerSend Template
 */
export async function sendCustomerEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] ========================================");
  console.log("[v0] MAILERSEND: Sending Customer Email");
  console.log("[v0] ========================================");

  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_SENDER_EMAIL;
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  // Validate environment
  if (!apiKey) {
    console.error("[v0] MAILERSEND_API_KEY is not set");
    return { success: false, error: "MAILERSEND_API_KEY is not set" };
  }
  
  if (!fromEmail) {
    console.error("[v0] MAILERSEND_SENDER_EMAIL is not set");
    return { success: false, error: "MAILERSEND_SENDER_EMAIL is not set" };
  }

  if (!data.customer_email) {
    console.error("[v0] No customer email provided");
    return { success: false, error: "No customer email provided" };
  }

  console.log("[v0] API Key present: YES (length:", apiKey.length, ")");
  console.log("[v0] From Email:", fromEmail);
  console.log("[v0] To Email:", data.customer_email);
  console.log("[v0] Template ID:", CUSTOMER_TEMPLATE_ID);

  try {
    const requestBody = {
      from: { 
        email: fromEmail, 
        name: fromName 
      },
      to: [{ 
        email: data.customer_email, 
        name: data.customer_name 
      }],
      bcc: [
        { email: ADMIN_EMAIL, name: "Admin" },
        { email: ADMIN_EMAIL_2, name: "Admin 2" }
      ],
      subject: `Order Confirmation - #${data.order_id}`,
      template_id: CUSTOMER_TEMPLATE_ID,
      personalization: [
        {
          email: data.customer_email,
          data: {
            order_id: data.order_id,
            product_name: data.product_name,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            price: data.price,
            base_price: data.base_price,
            branding_fee: data.branding_fee,
            voiceover_fee: data.voiceover_fee,
            edited_photos_fee: data.edited_photos_fee,
            photo_count: data.photo_count,
            image_urls: data.image_urls,
            music_choice: data.music_choice,
            custom_audio_filename: data.custom_audio_filename,
            custom_audio_url: data.custom_audio_url,
            branding_type: data.branding_type,
            branding_logo_url: data.branding_logo_url,
            branding_info: data.branding_info,
            agent_name: data.agent_name,
            company_name: data.company_name,
            agent_phone: data.agent_phone,
            agent_email: data.agent_email,
            agent_website: data.agent_website,
            voiceover_included: data.voiceover_included,
            voiceover_script: data.voiceover_script,
            include_edited_photos: data.include_edited_photos,
            special_requests: data.special_requests,
            video_titles: data.video_titles,
          },
        },
      ],
    };

    console.log("[v0] Sending request to MailerSend API...");
    console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[v0] MailerSend Response Status:", response.status);
    console.log("[v0] MailerSend Response Body:", responseText);

    if (!response.ok) {
      console.error("[v0] MailerSend FAILED - Status:", response.status);
      try {
        const errorBody = JSON.parse(responseText);
        console.error("[v0] Error details:", JSON.stringify(errorBody, null, 2));
      } catch {
        console.error("[v0] Raw error:", responseText);
      }
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[v0] MailerSend SUCCESS - Email accepted for delivery");
    return { success: true };
  } catch (error) {
    console.error("[v0] MailerSend Exception:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * ADMIN NOTIFICATION EMAIL - HTML fallback (no template needed)
 */
export async function sendAdminNotificationEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] ========================================");
  console.log("[v0] MAILERSEND: Sending Admin Notification");
  console.log("[v0] ========================================");

  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_SENDER_EMAIL;
  const fromName = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";

  if (!apiKey || !fromEmail) {
    const error = !apiKey ? "MAILERSEND_API_KEY not set" : "MAILERSEND_SENDER_EMAIL not set";
    console.error("[v0]", error);
    return { success: false, error };
  }

  console.log("[v0] Admin recipients:", ADMIN_EMAIL, ADMIN_EMAIL_2);

  // Build HTML email with all order data
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px;">
        NEW ORDER - #${data.order_id}
      </h1>
      
      <h2 style="color: #2d3748; margin-top: 30px;">Customer Information</h2>
      <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Name:</td><td style="padding: 12px;">${data.customer_name}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Email:</td><td style="padding: 12px;"><a href="mailto:${data.customer_email}">${data.customer_email}</a></td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Phone:</td><td style="padding: 12px;">${data.customer_phone}</td></tr>
      </table>

      <h2 style="color: #2d3748; margin-top: 30px;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Order ID:</td><td style="padding: 12px;">${data.order_id}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Product:</td><td style="padding: 12px;">${data.product_name}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Photo Count:</td><td style="padding: 12px;">${data.photo_count} photos</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Music Choice:</td><td style="padding: 12px;">${data.music_choice}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Include Edited Photos:</td><td style="padding: 12px;">${data.include_edited_photos}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Special Requests:</td><td style="padding: 12px;">${data.special_requests || "None"}</td></tr>
      </table>

      <h2 style="color: #2d3748; margin-top: 30px;">Pricing</h2>
      <table style="width: 100%; border-collapse: collapse; background: #f0fff4; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Base Price:</td><td style="padding: 12px;">${data.base_price}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Branding Fee:</td><td style="padding: 12px;">${data.branding_fee}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Voiceover Fee:</td><td style="padding: 12px;">${data.voiceover_fee}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Edited Photos Fee:</td><td style="padding: 12px;">${data.edited_photos_fee}</td></tr>
        <tr style="background: #c6f6d5;"><td style="padding: 12px; font-weight: bold; font-size: 18px;">TOTAL:</td><td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${data.price}</td></tr>
      </table>

      ${data.branding_type !== "unbranded" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Branding</h2>
      <table style="width: 100%; border-collapse: collapse; background: #e6fffa; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Type:</td><td style="padding: 12px;">${data.branding_type}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Agent Name:</td><td style="padding: 12px;">${data.agent_name}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Company:</td><td style="padding: 12px;">${data.company_name}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Phone:</td><td style="padding: 12px;">${data.agent_phone}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Email:</td><td style="padding: 12px;">${data.agent_email}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Website:</td><td style="padding: 12px;">${data.agent_website}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">Logo URL:</td><td style="padding: 12px; word-break: break-all;">${data.branding_logo_url}</td></tr>
      </table>
      ` : ""}

      ${data.voiceover_included === "Yes" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Voiceover</h2>
      <table style="width: 100%; border-collapse: collapse; background: #faf5ff; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Included:</td><td style="padding: 12px;">Yes</td></tr>
        <tr><td style="padding: 12px; font-weight: bold; vertical-align: top;">Script:</td><td style="padding: 12px; white-space: pre-wrap;">${data.voiceover_script}</td></tr>
      </table>
      ` : ""}

      ${data.custom_audio_filename && data.custom_audio_filename !== "None" ? `
      <h2 style="color: #2d3748; margin-top: 30px;">Custom Audio</h2>
      <table style="width: 100%; border-collapse: collapse; background: #fff5f5; border-radius: 8px;">
        <tr><td style="padding: 12px; font-weight: bold; width: 150px;">Filename:</td><td style="padding: 12px;">${data.custom_audio_filename}</td></tr>
        <tr><td style="padding: 12px; font-weight: bold;">URL:</td><td style="padding: 12px; word-break: break-all;"><a href="${data.custom_audio_url}">${data.custom_audio_url}</a></td></tr>
      </table>
      ` : ""}

      <h2 style="color: #2d3748; margin-top: 30px;">Cloudinary Image URLs</h2>
      <div style="background: #edf2f7; padding: 15px; border-radius: 8px; white-space: pre-wrap; word-break: break-all; font-family: monospace; font-size: 12px;">
${data.image_urls}
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #744210;">
        Video to be delivered within 3 business days.
      </p>
    </div>
  `;

  try {
    const requestBody = {
      from: { email: fromEmail, name: fromName },
      to: [
        { email: ADMIN_EMAIL, name: "Admin" },
        { email: ADMIN_EMAIL_2, name: "Admin 2" }
      ],
      subject: `NEW ORDER: ${data.customer_name} - #${data.order_id}`,
      html: html,
      text: `NEW ORDER - #${data.order_id}\n\nCustomer: ${data.customer_name}\nEmail: ${data.customer_email}\nPhone: ${data.customer_phone}\nProduct: ${data.product_name}\nTotal: ${data.price}\n\nImage URLs:\n${data.image_urls}`,
    };

    console.log("[v0] Sending admin email to MailerSend...");

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[v0] Admin Email Response Status:", response.status);
    console.log("[v0] Admin Email Response Body:", responseText);

    if (!response.ok) {
      console.error("[v0] Admin email FAILED - Status:", response.status);
      return { success: false, error: `Status ${response.status}: ${responseText}` };
    }

    console.log("[v0] Admin email SUCCESS");
    return { success: true };
  } catch (error) {
    console.error("[v0] Admin email Exception:", error);
    return { success: false, error: String(error) };
  }
}

// Legacy exports
export const sendAdminEmail = sendAdminNotificationEmail;
export const sendCustomerReceiptEmail = sendCustomerEmail;
