// app/api/planner/action/route.ts
// Records marketing actions (social shares, caption copies, downloads, etc.)
// Fixed: uses server Supabase client

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { actionType, propertyId, platform, contentType, metadata } = body;

    if (!actionType) {
      return NextResponse.json({ error: "Missing actionType" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("marketing_actions")
      .insert({
        user_id: session.user.id,
        property_id: propertyId || null,
        action_type: actionType,
        platform: platform || null,
        content_type: contentType || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ action: data });
  } catch (error) {
    console.error("Action route error:", error);
    return NextResponse.json({ error: "Failed to record action" }, { status: 500 });
  }
}
