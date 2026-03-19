import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, interest, company } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("lens_waitlist")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      // Don't reveal the duplicate — just return success
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("lens_waitlist").insert({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      interest: interest === "brokerage" ? "brokerage" : "individual",
      company: company?.trim() || null,
    });

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to join waitlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
