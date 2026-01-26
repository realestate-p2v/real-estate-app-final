/**
 * MAILERSEND EMAIL LIBRARY
 * 
 * Sends TWO separate emails:
 * 1. Customer Receipt - sent to the customer
 * 2. Admin Full Report - sent to realestatephoto2video@gmail.com
 * 
 * Both emails MUST have explicit subject fields to avoid MS42209 error.
 * MAILERSEND_SENDER_EMAIL must be set to a verified domain email.
 */

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const ADMIN_EMAIL = "realestatephoto2video@gmail.com";
const FROM_EMAIL = process.env.MAILERSEND_SENDER_EMAIL;
const FROM_NAME = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";
const CUSTOMER_TEMPLATE_ID = process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "";
const ADMIN_TEMPLATE_ID = process.env.MAILERSEND_ORDER_TEMPLATE_ID || "";

/**
 * PERSONALIZATION DATA INTERFACE
 * These are the EXACT variable names that MUST be in the personalization block:
 */
export interface PersonalizationData {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price: string;
  music_choice: string;
  video_titles: string;
  special_requests: string;
  image_urls: string;
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
 * Sends to: session.customer_details.email (customer_email)
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

  // SUBJECT LINE (explicit to avoid MS42209)
  const subject = `Order Confirmation - #${data.order_id}`;

  console.log("[MailerSend] Recipient:", data.customer_email);
  console.log("[MailerSend] Subject:", subject);
  console.log("[MailerSend] Personalization:", JSON.stringify(data, null, 2));

  try {
    let requestBody: Record<string, unknown>;

    if (CUSTOMER_TEMPLATE_ID) {
      // Use template with personalization
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: data.customer_email, name: data.customer_name }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: CUSTOMER_TEMPLATE_ID,
        personalization: [
          {
            email: data.customer_email,
            data: {
              order_id: data.order_id,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              price: data.price,
              music_choice: data.music_choice,
              video_titles: data.video_titles,
              special_requests: data.special_requests,
              image_urls: data.image_urls,
            },
          },
        ],
      };
      console.log("[MailerSend] Using template ID:", CUSTOMER_TEMPLATE_ID);
    } else {
      // Fallback HTML email
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d;">Order Confirmation</h1>
          <p>Hi ${data.customer_name},</p>
          <p>Thank you for your order! Your real estate video will be delivered within 3 business days.</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${data.order_id}</p>
            <p><strong>Total:</strong> ${data.price}</p>
            <p><strong>Music Selection:</strong> ${data.music_choice}</p>
          </div>
          <p>If you have any questions, please reply to this email.</p>
          <p>Best regards,<br>Real Estate Photo2Video Team</p>
        </div>
      `;

      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: data.customer_email, name: data.customer_name }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        html: html,
        text: `Hi ${data.customer_name}, Thank you for your order #${data.order_id}! Total: ${data.price}. Your video will be delivered within 3 business days.`,
      };
      console.log("[MailerSend] Using HTML fallback (no template)");
    }

    console.log("[MailerSend] Sending request to MailerSend API...");

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

    console.log("[MailerSend] Customer email sent SUCCESSFULLY");
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * EMAIL 2: ADMIN FULL REPORT
 * 
 * Sends to: realestatephoto2video@gmail.com
 * Subject: "🚨 NEW ORDER: {{customer_name}} - #{{order_id}}"
 */
export async function sendAdminEmail(
  data: PersonalizationData
): Promise<{ success: boolean; error?: string }> {
  console.log("[MailerSend] ========================================");
  console.log("[MailerSend] EMAIL 2: ADMIN FULL REPORT");
  console.log("[MailerSend] ========================================");

  // VALIDATION: Check MAILERSEND_SENDER_EMAIL is set
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error("[MailerSend] Environment validation failed:", validation.errors);
    return { success: false, error: validation.errors.join("; ") };
  }
  console.log("[MailerSend] MAILERSEND_SENDER_EMAIL verified:", FROM_EMAIL);

  // SUBJECT LINE (explicit to avoid MS42209)
  const subject = `🚨 NEW ORDER: ${data.customer_name} - #${data.order_id}`;

  console.log("[MailerSend] Recipient:", ADMIN_EMAIL);
  console.log("[MailerSend] Subject:", subject);
  console.log("[MailerSend] Personalization:", JSON.stringify(data, null, 2));

  try {
    let requestBody: Record<string, unknown>;

    if (ADMIN_TEMPLATE_ID) {
      // Use template with personalization
      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Admin" }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        template_id: ADMIN_TEMPLATE_ID,
        personalization: [
          {
            email: ADMIN_EMAIL,
            data: {
              order_id: data.order_id,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              customer_phone: data.customer_phone,
              price: data.price,
              music_choice: data.music_choice,
              video_titles: data.video_titles,
              special_requests: data.special_requests,
              image_urls: data.image_urls,
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

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; border-bottom: 3px solid #ecc94b; padding-bottom: 15px;">
            🚨 NEW ORDER - #${data.order_id}
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
              <td style="padding: 12px; font-weight: bold;">Price:</td>
              <td style="padding: 12px; font-size: 18px; color: #2f855a; font-weight: bold;">${data.price}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Music Choice:</td>
              <td style="padding: 12px;">${data.music_choice}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Video Titles:</td>
              <td style="padding: 12px;">${data.video_titles}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Special Requests:</td>
              <td style="padding: 12px;">${data.special_requests}</td>
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
              ${imageUrlsHtml || '<tr><td colspan="2" style="padding: 12px; color: #e53e3e;">No images available</td></tr>'}
            </tbody>
          </table>

          <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; color: #744210;">
            ⏰ Video to be delivered within 3 business days.
          </p>
        </div>
      `;

      const text = `
🚨 NEW ORDER - #${data.order_id}
========================================

CUSTOMER INFORMATION
--------------------
Name: ${data.customer_name}
Email: ${data.customer_email}
Phone: ${data.customer_phone}

ORDER DETAILS
-------------
Order ID: ${data.order_id}
Price: ${data.price}
Music Choice: ${data.music_choice}
Video Titles: ${data.video_titles}
Special Requests: ${data.special_requests}

IMAGE URLS (CLOUDINARY)
-----------------------
${data.image_urls}

========================================
Video to be delivered within 3 business days.
      `.trim();

      requestBody = {
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: ADMIN_EMAIL, name: "Admin" }],
        subject: subject, // EXPLICIT SUBJECT - prevents MS42209
        html: html,
        text: text,
      };
      console.log("[MailerSend] Using HTML fallback (no template)");
    }

    console.log("[MailerSend] Sending request to MailerSend API...");

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

    console.log("[MailerSend] Admin email sent SUCCESSFULLY");
    return { success: true };
  } catch (error) {
    console.error("[MailerSend] Exception:", error);
    return { success: false, error: String(error) };
  }
}
