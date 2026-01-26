import type { Order } from "@/lib/types/order";

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const BUSINESS_EMAIL = process.env.MAILERSEND_BUSINESS_EMAIL || "realestatephoto2video@gmail.com";
// IMPORTANT: FROM_EMAIL must be from your verified domain in MailerSend
// Set MAILERSEND_SENDER_EMAIL in your environment variables to your verified sender email
const FROM_EMAIL = process.env.MAILERSEND_SENDER_EMAIL;
const FROM_NAME = process.env.MAILERSEND_SENDER_NAME || "Real Estate Photo2Video";
const ORDER_TEMPLATE_ID = process.env.MAILERSEND_ORDER_TEMPLATE_ID || "zr6ke4n6kzelon12";
const CUSTOMER_RECEIPT_TEMPLATE_ID = process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "";

// Validation function to ensure FROM_EMAIL is configured
function validateFromEmail(): { valid: boolean; error?: string } {
  if (!FROM_EMAIL) {
    return { 
      valid: false, 
      error: "MAILERSEND_SENDER_EMAIL is not configured. This must be set to an email from your verified domain." 
    };
  }
  return { valid: true };
}

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
}

interface OrderArrayItem {
  name: string;
  value: string;
}

async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  console.log("[v0] sendEmail called - checking API key...");
  console.log("[v0] MAILERSEND_API_KEY exists:", !!MAILERSEND_API_KEY);
  console.log("[v0] MAILERSEND_API_KEY length:", MAILERSEND_API_KEY?.length || 0);
  
  if (!MAILERSEND_API_KEY) {
    console.error("[v0] MAILERSEND_API_KEY is not configured");
    return { success: false, error: "API key not configured" };
  }

  // Validate FROM_EMAIL is set (must be from verified domain)
  const fromValidation = validateFromEmail();
  if (!fromValidation.valid) {
    console.error("[v0] FROM_EMAIL validation failed:", fromValidation.error);
    return { success: false, error: fromValidation.error };
  }

  console.log("[v0] Sending email to:", to.map(r => r.email).join(", "));
  console.log("[v0] Subject:", subject);
  console.log("[v0] Sending email now...");

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        to,
        subject,
        html,
        text,
      }),
    });

    console.log("[v0] MailerSend response status:", response.status);
    const responseText = await response.text();
    console.log("[v0] MailerSend response body:", responseText);

    if (!response.ok) {
      console.error("[v0] MailerSend error:", responseText);
      return { success: false, error: responseText };
    }

    console.log("[v0] Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to send email:", error);
    return { success: false, error: String(error) };
  }
}

function buildOrderArray(order: Order): OrderArrayItem[] {
  const orderArray: OrderArrayItem[] = [
    { name: "Order ID", value: order.orderId },
    { name: "Customer Name", value: order.customer.name },
    { name: "Customer Email", value: order.customer.email },
    { name: "Customer Phone", value: order.customer.phone || "N/A" },
    { name: "Order Date", value: formatDate(order.createdAt) },
    { name: "Status", value: order.status },
    { name: "Photo Count", value: String(order.photoCount) },
    { name: "Music Selection", value: order.musicSelection },
    { name: "Branding Type", value: getBrandingLabel(order.branding.type) },
    { name: "Voiceover", value: order.voiceover ? "Yes" : "No" },
    { name: "Include Edited Photos", value: order.includeEditedPhotos ? "Yes" : "No" },
    { name: "Base Price", value: formatCurrency(order.basePrice) },
    { name: "Branding Fee", value: formatCurrency(order.brandingFee) },
    { name: "Voiceover Fee", value: formatCurrency(order.voiceoverFee) },
    { name: "Edited Photos Fee", value: formatCurrency(order.editedPhotosFee || 0) },
    { name: "Total Price", value: formatCurrency(order.totalPrice) },
    { name: "Payment Status", value: order.paymentStatus },
  ];

  // Add branding details if applicable
  if (order.branding.type !== "unbranded") {
    if (order.branding.agentName) {
      orderArray.push({ name: "Agent Name", value: order.branding.agentName });
    }
    if (order.branding.companyName) {
      orderArray.push({ name: "Company Name", value: order.branding.companyName });
    }
    if (order.branding.phone) {
      orderArray.push({ name: "Branding Phone", value: order.branding.phone });
    }
    if (order.branding.email) {
      orderArray.push({ name: "Branding Email", value: order.branding.email });
    }
    if (order.branding.website) {
      orderArray.push({ name: "Branding Website", value: order.branding.website });
    }
    if (order.branding.logoUrl) {
      orderArray.push({ name: "Logo URL", value: order.branding.logoUrl });
    }
  }

  // Add voiceover script if applicable
  if (order.voiceover && order.voiceoverScript) {
    orderArray.push({ name: "Voiceover Script", value: order.voiceoverScript });
  }

  // Add special instructions if provided
  if (order.specialInstructions) {
    orderArray.push({ name: "Special Instructions", value: order.specialInstructions });
  }

  // Add custom audio if provided
  if (order.customAudio) {
    orderArray.push({ name: "Custom Audio Filename", value: order.customAudio.filename });
    orderArray.push({ name: "Custom Audio URL", value: order.customAudio.secure_url });
  }

  // Add all photo URLs
  order.photos.forEach((photo, index) => {
    orderArray.push({ name: `Photo ${index + 1} URL`, value: photo.secure_url });
    orderArray.push({ name: `Photo ${index + 1} ID`, value: photo.public_id });
  });

  return orderArray;
}

/**
 * Send a receipt email to the customer using a MailerSend template.
 * This is separate from the HTML confirmation email and provides a clean, branded receipt.
 */
export async function sendCustomerReceiptEmail(order: Order) {
  console.log("[v0] sendCustomerReceiptEmail called");
  console.log("[v0] MAILERSEND_API_KEY exists:", !!MAILERSEND_API_KEY);
  console.log("[v0] MAILERSEND_API_KEY length:", MAILERSEND_API_KEY?.length || 0);
  
  if (!MAILERSEND_API_KEY) {
    console.error("[v0] MAILERSEND_API_KEY is not configured");
    return { success: false, error: "API key not configured" };
  }

  // Validate FROM_EMAIL is set (must be from verified domain)
  const fromValidation = validateFromEmail();
  if (!fromValidation.valid) {
    console.error("[v0] FROM_EMAIL validation failed:", fromValidation.error);
    return { success: false, error: fromValidation.error };
  }

  // If no template ID is configured, fall back to the HTML email
  if (!CUSTOMER_RECEIPT_TEMPLATE_ID) {
    console.log("[v0] CUSTOMER_RECEIPT_TEMPLATE_ID not configured, skipping template receipt email");
    return { success: false, error: "Customer receipt template ID not configured" };
  }

  console.log("[v0] Sending customer receipt email for order:", order.orderId);
  console.log("[v0] Using template ID:", CUSTOMER_RECEIPT_TEMPLATE_ID);
  console.log("[v0] Sending to:", order.customer.email);

  // Build line items for the receipt
  const lineItems = [
    {
      description: `Video Creation (${order.photoCount} photos)`,
      amount: formatCurrency(order.basePrice),
    },
  ];

  if (order.brandingFee > 0) {
    lineItems.push({
      description: getBrandingLabel(order.branding.type),
      amount: formatCurrency(order.brandingFee),
    });
  }

  if (order.voiceoverFee > 0) {
    lineItems.push({
      description: "Professional Voiceover",
      amount: formatCurrency(order.voiceoverFee),
    });
  }

  // Add edited photos fee if applicable
  const editedPhotosFee = order.editedPhotosFee || 0;
  if (editedPhotosFee > 0) {
    lineItems.push({
      description: "Edited Photos Package",
      amount: formatCurrency(editedPhotosFee),
    });
  }

  // Build image URLs list from Cloudinary photos
  const imageUrls = order.photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
  const imageUrlsHtml = order.photos.map((photo, index) => 
    `<a href="${photo.secure_url}" target="_blank">Photo ${index + 1}</a>`
  ).join(" | ");

  // Delivery message (3 business days notice)
  const deliveryMessage = "Your video will be delivered within 3 business days. You will receive an email with the download link once your video is ready.";

  try {
    const requestBody = {
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email: order.customer.email,
          name: order.customer.name,
        },
      ],
      subject: `Order Confirmation - #${order.orderId}`,
      template_id: CUSTOMER_RECEIPT_TEMPLATE_ID,
      personalization: [
        {
          email: order.customer.email,
          data: {
            // Customer info
            customer_name: order.customer.name,
            customer_email: order.customer.email,
            customer_phone: order.customer.phone || "N/A",

            // Order info
            order_id: order.orderId,
            order_date: formatDate(order.createdAt),
            photo_count: String(order.photoCount),

            // Selections
            music_selection: order.musicSelection,
            branding_type: getBrandingLabel(order.branding.type),
            has_voiceover: order.voiceover ? "Yes" : "No",
            voiceover_script: order.voiceoverScript || "None",
            include_edited_photos: order.includeEditedPhotos ? "Yes" : "No",

            // Pricing
            base_price: formatCurrency(order.basePrice),
            branding_fee: formatCurrency(order.brandingFee),
            voiceover_fee: formatCurrency(order.voiceoverFee),
            edited_photos_fee: formatCurrency(editedPhotosFee),
            total_price: formatCurrency(order.totalPrice),

            // For template iteration
            line_items: lineItems,

            // Status
            payment_status: "Paid",
            order_status: "Processing",

            // Branding details (if applicable)
            has_branding: order.branding.type !== "unbranded",
            agent_name: order.branding.agentName || "None",
            company_name: order.branding.companyName || "None",
            branding_phone: order.branding.phone || "None",
            branding_email: order.branding.email || "None",
            branding_website: order.branding.website || "None",

            // Special instructions (use "None" if empty for MailerSend)
            has_special_instructions: !!order.specialInstructions,
            special_instructions: order.specialInstructions || "None",

            // Cloudinary Image URLs (important for order reference)
            image_urls: imageUrls,
            image_urls_html: imageUrlsHtml,
            photo_urls: order.photos.map(p => ({ url: p.secure_url, id: p.public_id })),

            // Delivery message
            delivery_message: deliveryMessage,

            // Support info
            support_email: BUSINESS_EMAIL,
            
            // Ensure personalization is never empty - MailerSend requires at least one variable
            _timestamp: new Date().toISOString(),
          },
        },
      ],
    };

    // Validate personalization data is not empty
    const personalizationData = requestBody.personalization[0]?.data;
    if (!personalizationData || Object.keys(personalizationData).length === 0) {
      console.error("[v0] Personalization data is empty - MailerSend templates require variables");
      return { success: false, error: "Personalization data cannot be empty" };
    }

    console.log("[v0] Customer receipt email request body:", JSON.stringify(requestBody, null, 2));
    console.log("[v0] Sending email now... (customer receipt via template)");

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseStatus = response.status;
    const responseText = await response.text();
    console.log("[v0] MailerSend customer receipt response status:", responseStatus);
    console.log("[v0] MailerSend customer receipt response body:", responseText);

    if (!response.ok) {
      console.error("[v0] MailerSend customer receipt error:", responseText);
      return { success: false, error: responseText, status: responseStatus };
    }

    console.log("[v0] Email sent successfully (customer receipt template)");
    console.log("[v0] Customer receipt email sent successfully for order", order.orderId);
    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to send customer receipt email:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendOrderTemplateEmail(order: Order) {
  console.log("[v0] sendOrderTemplateEmail called");
  console.log("[v0] MAILERSEND_API_KEY exists:", !!MAILERSEND_API_KEY);
  console.log("[v0] MAILERSEND_API_KEY length:", MAILERSEND_API_KEY?.length || 0);
  
  if (!MAILERSEND_API_KEY) {
    console.error("[v0] MAILERSEND_API_KEY is not configured");
    return { success: false, error: "API key not configured" };
  }

  // Validate FROM_EMAIL is set (must be from verified domain)
  const fromValidation = validateFromEmail();
  if (!fromValidation.valid) {
    console.error("[v0] FROM_EMAIL validation failed:", fromValidation.error);
    return { success: false, error: fromValidation.error };
  }

  console.log("[v0] Sending template email for order:", order.orderId);
  console.log("[v0] Using template ID:", ORDER_TEMPLATE_ID);
  console.log("[v0] Sending to:", BUSINESS_EMAIL);

  const orderArray = buildOrderArray(order);

  // Build image URLs list from Cloudinary photos
  const imageUrls = order.photos.map((photo, index) => `Photo ${index + 1}: ${photo.secure_url}`).join("\n");
  const imageUrlsHtml = order.photos.map((photo, index) => 
    `<a href="${photo.secure_url}" target="_blank">Photo ${index + 1}</a>`
  ).join(" | ");

  // Delivery message
  const deliveryMessage = "Video to be delivered within 3 business days.";

  // Edited photos fee
  const editedPhotosFee = order.editedPhotosFee || 0;

  try {
    const requestBody = {
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      to: [
        {
          email: BUSINESS_EMAIL,
          name: "Real Estate Photo2Video",
        },
      ],
      subject: `New Order Received - #${order.orderId}`,
      template_id: ORDER_TEMPLATE_ID,
      personalization: [
        {
          email: BUSINESS_EMAIL,
          data: {
            order: {
              array: orderArray,
            },
            order_id: order.orderId,
            customer_name: order.customer.name,
            customer_email: order.customer.email,
            customer_phone: order.customer.phone || "N/A",
            photo_count: String(order.photoCount),
            total_price: formatCurrency(order.totalPrice),
            music_selection: order.musicSelection,
            branding_type: getBrandingLabel(order.branding.type),
            voiceover: order.voiceover ? "Yes" : "No",
            voiceover_script: order.voiceoverScript || "None",
            include_edited_photos: order.includeEditedPhotos ? "Yes" : "No",
            special_instructions: order.specialInstructions || "None",
            payment_status: order.paymentStatus,
            order_date: formatDate(order.createdAt),
            base_price: formatCurrency(order.basePrice),
            branding_fee: formatCurrency(order.brandingFee),
            voiceover_fee: formatCurrency(order.voiceoverFee),
            edited_photos_fee: formatCurrency(editedPhotosFee),
            
            // Cloudinary Image URLs (important for order processing)
            image_urls: imageUrls,
            image_urls_html: imageUrlsHtml,
            photo_urls: order.photos.map(p => ({ url: p.secure_url, id: p.public_id })),
            
            // Branding details
            agent_name: order.branding.agentName || "None",
            company_name: order.branding.companyName || "None",
            branding_phone: order.branding.phone || "None",
            branding_email: order.branding.email || "None",
            branding_website: order.branding.website || "None",
            logo_url: order.branding.logoUrl || "None",

            // Delivery message
            delivery_message: deliveryMessage,
            
            // Ensure personalization is never empty - MailerSend requires at least one variable
            _timestamp: new Date().toISOString(),
          },
        },
      ],
    };

    // Validate personalization data is not empty
    const personalizationData = requestBody.personalization[0]?.data;
    if (!personalizationData || Object.keys(personalizationData).length === 0) {
      console.error("[v0] Personalization data is empty - MailerSend templates require variables");
      return { success: false, error: "Personalization data cannot be empty" };
    }

    console.log("[v0] Template email request body:", JSON.stringify(requestBody, null, 2));
    console.log("[v0] Sending email now... (business template)");

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseStatus = response.status;
    const responseText = await response.text();
    console.log("[v0] MailerSend template email response status:", responseStatus);
    console.log("[v0] MailerSend template email response body:", responseText);

    if (!response.ok) {
      console.error("[v0] MailerSend template email error:", responseText);
      return { success: false, error: responseText };
    }

    console.log("[v0] Email sent successfully (business template)");
    console.log(`[v0] Order template email sent successfully for order ${order.orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to send order template email:", error);
    return { success: false, error: String(error) };
  }
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

function generateOrderEmailHtml(order: Order, isCustomer: boolean): string {
  const brandingDetails =
    order.branding.type !== "unbranded"
      ? `
        <div style="margin-top: 10px; padding: 10px; background: #f9fafb; border-radius: 6px;">
          <p style="margin: 0 0 5px 0;"><strong>Branding Details:</strong></p>
          ${order.branding.agentName ? `<p style="margin: 2px 0;">Agent: ${order.branding.agentName}</p>` : ""}
          ${order.branding.companyName ? `<p style="margin: 2px 0;">Company: ${order.branding.companyName}</p>` : ""}
          ${order.branding.phone ? `<p style="margin: 2px 0;">Phone: ${order.branding.phone}</p>` : ""}
          ${order.branding.email ? `<p style="margin: 2px 0;">Email: ${order.branding.email}</p>` : ""}
          ${order.branding.website ? `<p style="margin: 2px 0;">Website: ${order.branding.website}</p>` : ""}
        </div>
      `
      : "";

  const voiceoverDetails = order.voiceover
    ? `
        <div style="margin-top: 10px; padding: 10px; background: #f9fafb; border-radius: 6px;">
          <p style="margin: 0 0 5px 0;"><strong>Voiceover Script:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${order.voiceoverScript || "No script provided"}</p>
        </div>
      `
    : "";

  const specialInstructions = order.specialInstructions
    ? `
        <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px;">
          <p style="margin: 0 0 5px 0;"><strong>Special Instructions:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${order.specialInstructions}</p>
        </div>
      `
    : "";

  const photosList = order.photos
    .map(
      (photo, index) =>
        `<li style="margin: 5px 0;">Photo ${index + 1}: <a href="${photo.secure_url}" style="color: #10b981;">View Image</a></li>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isCustomer ? "Thank You For Your Order!" : "New Order Received"}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
            Order #${order.orderId}
          </p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${
            isCustomer
              ? `
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hi ${order.customer.name},<br><br>
              Your payment has been received and your order is now being processed. We'll have your stunning property video ready soon!
            </p>
          `
              : `
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              A new order has been placed and payment received. See details below.
            </p>
          `
          }
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <!-- Customer Information -->
          <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Customer Information</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customer.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer.email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.customer.phone}</p>
          </div>
          
          <!-- Order Details -->
          <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Order Details</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
            <p style="margin: 5px 0;"><strong>Number of Photos:</strong> ${order.photoCount}</p>
            <p style="margin: 5px 0;"><strong>Music Selection:</strong> ${order.musicSelection}</p>
            <p style="margin: 5px 0;"><strong>Branding:</strong> ${getBrandingLabel(order.branding.type)}</p>
            <p style="margin: 5px 0;"><strong>Voiceover:</strong> ${order.voiceover ? "Yes" : "No"}</p>
            <p style="margin: 5px 0;"><strong>Include Edited Photos:</strong> ${order.includeEditedPhotos ? "Yes" : "No"}</p>
            ${order.customAudio ? `<p style="margin: 5px 0;"><strong>Custom Audio:</strong> ${order.customAudio.filename}</p>` : ""}
          </div>
          
          ${brandingDetails}
          ${voiceoverDetails}
          ${specialInstructions}
          
          <!-- Photos -->
          <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0;">Uploaded Photos</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <ul style="margin: 0; padding-left: 20px;">
              ${photosList}
            </ul>
          </div>
          
          <!-- Receipt -->
          <h2 style="color: #111827; font-size: 18px; margin: 25px 0 15px 0;">Receipt</h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span>Base Price (${order.photoCount} photos):</span>
              <span>${formatCurrency(order.basePrice)}</span>
            </div>
            ${
              order.brandingFee > 0
                ? `
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>${getBrandingLabel(order.branding.type)}:</span>
                <span>${formatCurrency(order.brandingFee)}</span>
              </div>
            `
                : ""
            }
            ${
              order.voiceoverFee > 0
                ? `
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>Voiceover:</span>
                <span>${formatCurrency(order.voiceoverFee)}</span>
              </div>
            `
                : ""
            }
            ${
              (order.editedPhotosFee || 0) > 0
                ? `
              <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                <span>Edited Photos:</span>
                <span>${formatCurrency(order.editedPhotosFee || 0)}</span>
              </div>
            `
                : ""
            }
            <hr style="border: none; border-top: 1px solid #d1d5db; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #10b981;">
              <span>Total Paid:</span>
              <span>${formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
          
          ${
            isCustomer
              ? `
            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center; border: 1px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Delivery Notice</strong><br>
                Your video will be delivered within 3 business days. You will receive an email with the download link once your video is ready.
              </p>
            </div>
            <div style="margin-top: 15px; padding: 20px; background: #ecfdf5; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                <strong>What's Next?</strong><br>
                Our team will begin working on your video right away.
              </p>
            </div>
          `
              : ""
          }
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;">
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
            Real Estate Photo2Video<br>
            Questions? Reply to this email or contact us at ${BUSINESS_EMAIL}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderEmailText(order: Order, isCustomer: boolean): string {
  const lines = [
    isCustomer ? "Thank You For Your Order!" : "New Order Received",
    `Order #${order.orderId}`,
    "",
    isCustomer
      ? `Hi ${order.customer.name},\n\nYour payment has been received and your order is now being processed.`
      : "A new order has been placed and payment received.",
    "",
    "--- CUSTOMER INFORMATION ---",
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phone}`,
    "",
    "--- ORDER DETAILS ---",
    `Order Date: ${formatDate(order.createdAt)}`,
    `Number of Photos: ${order.photoCount}`,
    `Music Selection: ${order.musicSelection}`,
    `Branding: ${getBrandingLabel(order.branding.type)}`,
    `Voiceover: ${order.voiceover ? "Yes" : "No"}`,
    `Include Edited Photos: ${order.includeEditedPhotos ? "Yes" : "No"}`,
  ];

  if (order.branding.type !== "unbranded") {
    lines.push("", "--- BRANDING DETAILS ---");
    if (order.branding.agentName) lines.push(`Agent: ${order.branding.agentName}`);
    if (order.branding.companyName) lines.push(`Company: ${order.branding.companyName}`);
    if (order.branding.phone) lines.push(`Phone: ${order.branding.phone}`);
    if (order.branding.email) lines.push(`Email: ${order.branding.email}`);
    if (order.branding.website) lines.push(`Website: ${order.branding.website}`);
  }

  if (order.voiceover && order.voiceoverScript) {
    lines.push("", "--- VOICEOVER SCRIPT ---", order.voiceoverScript);
  }

  if (order.specialInstructions) {
    lines.push("", "--- SPECIAL INSTRUCTIONS ---", order.specialInstructions);
  }

  lines.push(
    "",
    "--- UPLOADED PHOTOS ---",
    ...order.photos.map((photo, i) => `Photo ${i + 1}: ${photo.secure_url}`)
  );

  lines.push(
    "",
    "--- RECEIPT ---",
    `Base Price (${order.photoCount} photos): ${formatCurrency(order.basePrice)}`
  );

  if (order.brandingFee > 0) {
    lines.push(`${getBrandingLabel(order.branding.type)}: ${formatCurrency(order.brandingFee)}`);
  }
  if (order.voiceoverFee > 0) {
    lines.push(`Voiceover: ${formatCurrency(order.voiceoverFee)}`);
  }
  if ((order.editedPhotosFee || 0) > 0) {
    lines.push(`Edited Photos: ${formatCurrency(order.editedPhotosFee || 0)}`);
  }
  lines.push(`TOTAL PAID: ${formatCurrency(order.totalPrice)}`);

  if (isCustomer) {
    lines.push(
      "",
      "DELIVERY NOTICE:",
      "Your video will be delivered within 3 business days. You will receive an email with the download link once your video is ready.",
      "",
      "What's Next?",
      "Our team will begin working on your video right away."
    );
  }

  lines.push("", "---", "Real Estate Photo2Video", `Questions? Contact us at ${BUSINESS_EMAIL}`);

  return lines.join("\n");
}

export async function sendOrderConfirmationEmails(order: Order) {
  const results = {
    customer: { success: false, error: null as string | null },
    business: { success: false, error: null as string | null },
  };

  // Send email to customer
  const customerResult = await sendEmail({
    to: [{ email: order.customer.email, name: order.customer.name }],
    subject: `Order Confirmation - #${order.orderId}`,
    html: generateOrderEmailHtml(order, true),
    text: generateOrderEmailText(order, true),
  });
  results.customer = {
    success: customerResult.success,
    error: customerResult.error || null,
  };

  // Send email to business
  const businessResult = await sendEmail({
    to: [{ email: BUSINESS_EMAIL, name: "Real Estate Photo2Video" }],
    subject: `New Order Received - #${order.orderId} - ${order.customer.name}`,
    html: generateOrderEmailHtml(order, false),
    text: generateOrderEmailText(order, false),
  });
  results.business = {
    success: businessResult.success,
    error: businessResult.error || null,
  };

  console.log("Email results:", results);
  return results;
}
