import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: notifications, error } = await adminSupabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const unreadCount = (notifications || []).filter((n: any) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const adminSupabase = createAdminClient();

    // Mark single notification as read
    if (body.action === "mark_read") {
      const { error } = await adminSupabase
        .from("notifications")
        .update({ read: true })
        .eq("id", body.notification_id)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Mark all as read
    if (body.action === "mark_all_read") {
      const { error } = await adminSupabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
