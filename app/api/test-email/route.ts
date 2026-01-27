import { NextResponse } from "next/server";
import { sendCustomerReceiptEmail, sendAdminNotificationEmail } from "@/lib/mailersend";

// Test endpoint to debug email sending flow
// DELETE THIS FILE after debugging is complete
export async function POST(request: Request) {
  console.log("[v0] ========================================");
  console.log("[v0] TEST EMAIL ENDPOINT TRIGGERED");
  console.log("[v0] ========================================");

  // Check all required environment variables
  const envCheck = {
    MAILERSEND_API_KEY: !!process.env.MAILERSEND_API_KEY,
    MAILERSEND_API_KEY_LENGTH: process.env.MAILERSEND_API_KEY?.length || 0,
    MAILERSEND_SENDER_EMAIL: process.env.MAILERSEND_SENDER_EMAIL || "NOT SET",
    MAILERSEND_BCC_EMAIL: process.env.MAILERSEND_BCC_EMAIL || "info@realestatephoto2video.com (default)",
    CUSTOMER_RECEIPT_TEMPLATE_ID: process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "NOT SET",
    MAILERSEND_ORDER_TEMPLATE_ID: process.env.MAILERSEND_ORDER_TEMPLATE_ID || "NOT SET",
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  console.log("[v0] Environment Variables Check:");
  console.log(JSON.stringify(envCheck, null, 2));

  // Parse request body for optional custom test data
  let testData;
  try {
    testData = await request.json();
  } catch {
    testData = {};
  }

  // Default test data (can be overridden via POST body)
  const personalizationData = {
    order_id: testData.order_id || "TEST-ORDER-001",
    customer_name: testData.customer_name || "Test Customer",
    customer_email: testData.customer_email || testData.email || "", // REQUIRED - must be provided
    customer_phone: testData.customer_phone || "555-123-4567",
    property_address: testData.property_address || "123 Test Street, Test City, TS 12345",
    package_name: testData.package_name || "Premium Package",
    price: testData.price || "$149.00",
    voiceover_style: testData.voiceover_style || "Professional Male",
    music_style: testData.music_style || "Upbeat Modern",
    branding_option: testData.branding_option || "Custom Logo",
    special_instructions: testData.special_instructions || "Test order - please ignore",
    image_urls: testData.image_urls || "https://via.placeholder.com/400x300?text=Test+Image+1",
    status: testData.status || "pending",
  };

  console.log("[v0] Test personalization data:");
  console.log(JSON.stringify(personalizationData, null, 2));

  // Validation check
  if (!personalizationData.customer_email) {
    console.log("[v0] ERROR: No customer_email provided!");
    return NextResponse.json({
      success: false,
      error: "customer_email is required",
      hint: "POST with JSON body: { \"customer_email\": \"your@email.com\" }",
      envCheck,
    }, { status: 400 });
  }

  if (!process.env.MAILERSEND_API_KEY) {
    console.log("[v0] ERROR: MAILERSEND_API_KEY not set!");
    return NextResponse.json({
      success: false,
      error: "MAILERSEND_API_KEY environment variable is not set",
      envCheck,
    }, { status: 500 });
  }

  if (!process.env.MAILERSEND_SENDER_EMAIL) {
    console.log("[v0] ERROR: MAILERSEND_SENDER_EMAIL not set!");
    return NextResponse.json({
      success: false,
      error: "MAILERSEND_SENDER_EMAIL environment variable is not set",
      envCheck,
    }, { status: 500 });
  }

  const results = {
    envCheck,
    customerEmail: { attempted: false, success: false, error: null as string | null },
    adminEmail: { attempted: false, success: false, error: null as string | null },
  };

  // Test 1: Send customer receipt email
  console.log("[v0] ----------------------------------------");
  console.log("[v0] TEST 1: Sending CUSTOMER receipt email...");
  console.log("[v0] ----------------------------------------");
  
  try {
    results.customerEmail.attempted = true;
    const customerResult = await sendCustomerReceiptEmail(personalizationData);
    results.customerEmail.success = customerResult.success;
    if (!customerResult.success) {
      results.customerEmail.error = customerResult.error || "Unknown error";
    }
    console.log("[v0] Customer email result:", JSON.stringify(customerResult, null, 2));
  } catch (error) {
    results.customerEmail.error = error instanceof Error ? error.message : String(error);
    console.log("[v0] Customer email EXCEPTION:", results.customerEmail.error);
  }

  // Test 2: Send admin notification email
  console.log("[v0] ----------------------------------------");
  console.log("[v0] TEST 2: Sending ADMIN notification email...");
  console.log("[v0] ----------------------------------------");
  
  try {
    results.adminEmail.attempted = true;
    const adminResult = await sendAdminNotificationEmail(personalizationData);
    results.adminEmail.success = adminResult.success;
    if (!adminResult.success) {
      results.adminEmail.error = adminResult.error || "Unknown error";
    }
    console.log("[v0] Admin email result:", JSON.stringify(adminResult, null, 2));
  } catch (error) {
    results.adminEmail.error = error instanceof Error ? error.message : String(error);
    console.log("[v0] Admin email EXCEPTION:", results.adminEmail.error);
  }

  console.log("[v0] ========================================");
  console.log("[v0] TEST EMAIL COMPLETE");
  console.log("[v0] Customer email success:", results.customerEmail.success);
  console.log("[v0] Admin email success:", results.adminEmail.success);
  console.log("[v0] ========================================");

  const overallSuccess = results.customerEmail.success && results.adminEmail.success;

  return NextResponse.json({
    success: overallSuccess,
    message: overallSuccess 
      ? "Both emails sent successfully! Check your inbox." 
      : "One or more emails failed. See details below.",
    results,
    testDataUsed: personalizationData,
  }, { status: overallSuccess ? 200 : 500 });
}

// GET endpoint for quick status check
export async function GET() {
  const envCheck = {
    MAILERSEND_API_KEY: !!process.env.MAILERSEND_API_KEY ? "SET" : "MISSING",
    MAILERSEND_SENDER_EMAIL: process.env.MAILERSEND_SENDER_EMAIL || "MISSING",
    MAILERSEND_BCC_EMAIL: process.env.MAILERSEND_BCC_EMAIL || "info@realestatephoto2video.com (default)",
    CUSTOMER_RECEIPT_TEMPLATE_ID: process.env.CUSTOMER_RECEIPT_TEMPLATE_ID || "NOT SET (will use HTML fallback)",
    MAILERSEND_ORDER_TEMPLATE_ID: process.env.MAILERSEND_ORDER_TEMPLATE_ID || "NOT SET (will use HTML fallback)",
  };

  return NextResponse.json({
    status: "Test endpoint ready",
    usage: {
      method: "POST",
      url: "/api/test-email",
      body: {
        customer_email: "your@email.com (REQUIRED)",
        customer_name: "optional",
        order_id: "optional",
        property_address: "optional",
      },
    },
    envCheck,
  });
}
