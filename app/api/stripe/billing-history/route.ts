import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ charges: [] });
    }

    const customerId = customers.data[0].id;

    // Get starting_after cursor for pagination
    const { searchParams } = new URL(request.url);
    const startingAfter = searchParams.get("starting_after");

    const params: any = {
      customer: customerId,
      limit: 20,
    };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const charges = await stripe.charges.list(params);

    return NextResponse.json({
      charges: charges.data.map((charge) => ({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency,
        description: charge.description || "Payment",
        status: charge.status,
        created: charge.created,
        receipt_url: charge.receipt_url,
      })),
      has_more: charges.has_more,
    });
  } catch (error: any) {
    console.error("Billing history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}
