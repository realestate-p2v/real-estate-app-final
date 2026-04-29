// app/api/lens/remix/drafts/[id]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── POST /api/lens/remix/drafts/[id]/export ──────────────────────────────────
// Marks the draft as exported by setting exported_at = now(). Used by the remix
// editor right after a successful local download. Idempotent — re-exporting the
// same draft just bumps the timestamp.
//
// Why a dedicated endpoint and not just POST /drafts with a flag? Because this
// updates a single field without touching state/name/property_id. Keeps the
// auth + RLS surface small and the call site at the editor explicit.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("lens_remix_drafts")
      .update({ exported_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, exported_at")
      .single();

    if (error) {
      if ((error as any).code === "PGRST116") return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      console.error("[drafts/:id/export POST] supabase error:", error);
      return NextResponse.json({ error: "Failed to mark draft as exported" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    return NextResponse.json({ id: data.id, exported_at: data.exported_at });
  } catch (err: any) {
    console.error("[drafts/:id/export POST] unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
