import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];
const LENS_COUPON_ID = process.env.STRIPE_LENS_COUPON_ID || "P6k7SJ7z";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body.orderData?.orderId ?? body.orderId;
    const amountCents = body.items?.[0]?.amount ?? (body.amount != null ? Math.round(Number(body.amount) * 100) : null);
    const customerName = body.customerDetails?.name ?? body.customerName;
    const customerEmail = body.customerDetails?.email ?? body.customerEmail;
    const photoCount = body.orderData?.photoCount ?? body.photoCount ?? 0;

    if (!amountCents || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Amount and email are required" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "https://realestatephoto2video.com";

    // ═══ ADMIN BYPASS — authenticated session only (never form email) ═══
    let isAdmin = false;
    let isLensSubscriber = false;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        isAdmin = true;
      }

      // ═══ CHECK LENS SUBSCRIBER STATUS FOR 10% DISCOUNT ═══
      if (user && !isAdmin) {
        const adminDb = createAdminClient();
        const { data: usage } = await adminDb
          .from("lens_usage")
          .select("is_subscriber")
          .eq("user_id", user.id)
          .single();

        if (usage?.is_subscriber) {
          isLensSubscriber = true;
        }
      }
    } catch (e) {
      // Auth check failed — not admin, no subscriber discount
    }

    if (isAdmin) {
      if (orderId && orderId !== "direct") {
        try {
          const adminDb = createAdminClient();
          await adminDb
            .from("orders")
            .update({
              status: "new",
              payment_status: "admin_bypass",
              stripe_session_id: "admin_bypass_" + Date.now(),
            })
            .eq("order_id", orderId);
          console.log("[Checkout] Admin bypass — order set to new:", orderId);
        } catch (e) {
          console.error("[Checkout] Admin bypass DB error:", e);
        }
      }

      return NextResponse.json({
        success: true,
        id: "admin_bypass",
        sessionId: "admin_bypass",
        url: `${origin}/order/success?orderId=${orderId || "direct"}&session_id=admin_bypass`,
      });
    }

    // ═══ NORMAL STRIPE CHECKOUT ═══
    let photoUrls = "";
    let musicSelection = "Not specified";
    let specialInstructions = "None";
    let customerPhone = "Not provided";
    let brandingType = "unbranded";
    let voiceoverIncluded = "No";
    let includeEditedPhotos = "No";

    if (orderId && orderId !== "direct") {
      try {
        const supabase = createAdminClient();
        const { data: orderData, error } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single();

        if (!error && orderData) {
          console.log("[Checkout] Found order in Supabase:", orderId);
          musicSelection = orderData.music_selection || "Not specified";
          specialInstructions = orderData.special_instructions || "None";
          customerPhone = orderData.customer_phone || "Not provided";
          brandingType = orderData.branding?.type || "unbranded";
          voiceoverIncluded = orderData.voiceover ? "Yes" : "No";
          includeEditedPhotos = orderData.include_edited_photos ? "Yes" : "No";

          if (orderData.photos && orderData.photos.length > 0) {
            photoUrls = orderData.photos
              .map((p: { secure_url: string }, i: number) => `${i + 1}:${p.secure_url}`)
              .join("|");
          }
        }
      } catch (dbError) {
        console.error("[Checkout] Failed to fetch order from Supabase:", dbError);
      }
    }

    const photoUrlChunks: Record<string, string> = {};
    if (photoUrls.length > 0) {
      const chunkSize = 490;
      let chunkIndex = 0;
      for (let i = 0; i < photoUrls.length; i += chunkSize) {
        photoUrlChunks[`photoUrls_${chunkIndex}`] = photoUrls.slice(i, i + chunkSize);
        chunkIndex++;
        if (chunkIndex >= 10) break;
      }
    }

    // ═══ BUILD SESSION PARAMS ═══
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Real Estate Walkthrough Video`,
              description: `Professional HD walkthrough video with ${photoCount} photos`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/order/success?orderId=${orderId || "direct"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order?cancelled=true`,
      customer_email: customerEmail,
      phone_number_collection: { enabled: true },
      metadata: {
        orderId: orderId || "direct",
        customerName,
        customerPhone,
        photoCount: String(photoCount),
        musicSelection,
        specialInstructions: specialInstructions.slice(0, 490),
        brandingType,
        voiceoverIncluded,
        includeEditedPhotos,
        lensSubscriberDiscount: isLensSubscriber ? "yes" : "no",
        ...photoUrlChunks,
      },
    };

    // Apply 10% Lens subscriber discount OR allow manual promo codes — Stripe can't do both
    if (isLensSubscriber) {
      sessionParams.discounts = [{ coupon: LENS_COUPON_ID }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (isLensSubscriber) {
      console.log(`[Checkout] 🏷️ Applied Lens subscriber 10% discount for order ${orderId}`);
    }

    return NextResponse.json({
      success: true,
      id: session.id,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
