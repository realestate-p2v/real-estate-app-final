import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mergeId } = await req.json();
    if (!mergeId) {
      return NextResponse.json(
        { error: "mergeId required" },
        { status: 400 }
      );
    }

    // Find the merge record
    const { data: mergeRecord, error: findErr } = await supabase
      .from("property_merges")
      .select("*")
      .eq("merged_id", mergeId)
      .eq("user_id", user.id)
      .eq("undone", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findErr || !mergeRecord) {
      return NextResponse.json(
        { error: "Merge record not found" },
        { status: 404 }
      );
    }

    if (new Date(mergeRecord.can_undo_until) < new Date()) {
      return NextResponse.json(
        { error: "Undo window has expired (30 day limit)" },
        { status: 400 }
      );
    }

    const primaryId = mergeRecord.primary_id;

    // Get the merged property to read its merge_history
    const { data: mergedProp } = await supabase
      .from("agent_properties")
      .select("address_normalized, merge_history")
      .eq("id", mergeId)
      .eq("user_id", user.id)
      .single();

    const mergeHistory = mergedProp?.merge_history as any;
    const originalStatus = mergeHistory?.original_status || "active";

    // Reverse asset moves: staging
    await supabase
      .from("lens_staging")
      .update({ property_id: mergeId })
      .eq("property_id", primaryId)
      .eq("user_id", user.id);

    // Reverse: design_exports
    await supabase
      .from("design_exports")
      .update({ property_id: mergeId })
      .eq("property_id", primaryId)
      .eq("user_id", user.id);

    // Reverse: booking_slots
    await supabase
      .from("booking_slots")
      .update({ property_id: mergeId })
      .eq("property_id", primaryId)
      .eq("user_id", user.id);

    // Reverse: showing_requests
    await supabase
      .from("showing_requests")
      .update({ property_id: mergeId })
      .eq("property_id", primaryId)
      .eq("agent_user_id", user.id);

    // Note: lens_sessions address reversal is imprecise — we can't distinguish
    // which sessions were moved vs. which originally belonged to the primary.
    // This is a known limitation. Sessions matched by address will stay on primary.

    // Restore the merged property
    await supabase
      .from("agent_properties")
      .update({
        merged_into_id: null,
        status: originalStatus,
        merge_history: null,
      })
      .eq("id", mergeId)
      .eq("user_id", user.id);

    // Mark merge record as undone
    await supabase
      .from("property_merges")
      .update({ undone: true })
      .eq("id", mergeRecord.id);

    return NextResponse.json({
      success: true,
      restoredId: mergeId,
      restoredStatus: originalStatus,
    });
  } catch (err: any) {
    console.error("Undo merge error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
