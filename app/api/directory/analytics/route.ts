import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get photographer listing for this user
    const { data: photographer } = await adminSupabase
      .from("photographers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!photographer) {
      return NextResponse.json({ success: false, error: "No listing found" }, { status: 404 });
    }

    // Get all inquiries for this photographer
    const { data: inquiries, error } = await adminSupabase
      .from("directory_inquiries")
      .select("id, from_name, from_email, message, created_at")
      .eq("photographer_id", photographer.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, inquiries: inquiries || [] });
  } catch (error) {
    console.error("Directory analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
