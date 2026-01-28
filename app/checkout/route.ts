import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, customerDetails, orderData } = body

    // 1. Initialize Supabase Admin
    const supabase = createAdminClient()

    // 2. SAVE TO SUPABASE FIRST
    // This ensures your dashboard gets the data even if they don't finish paying
    const { error: dbError } = await supabase
      .from("orders")
      .insert([
        {
          order_id: orderData.orderId,
          customer_name: customerDetails.name,
          customer_email: customerDetails.email,
          customer_phone: customerDetails.phone,
          product_name: items[0].name,
          total_price: items[0].amount / 100,
          music_selection: orderData.musicSelection,
          photo_count: orderData.photoCount,
          photos: orderData.photos,
          branding: orderData.branding,
          voiceover: orderData.voiceover,
          voiceover_voice: orderData.voiceoverVoice,
          voiceover_script: orderData.voiceoverScript,
          status: "Pending Payment", // This makes it show up in your dashboard immediately
          payment_status: "unpaid",
          created_at: new Date().toISOString(),
        },
      ])

    if (dbError) {
      console.error("Supabase Database Error:", dbError)
      return NextResponse.json({ error: "Database save failed", details: dbError.message }, { status: 500 })
    }

    // 3. CREATE STRIPE SESSION
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.amount,
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/order`,
      metadata: {
        orderId: orderData.orderId,
      },
      customer_email: customerDetails.email,
    })

    return NextResponse.json({ id: session.id })
  } catch (err: any) {
    console.error("Checkout Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
