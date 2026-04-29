// app/api/lens/remix/drafts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/lens/remix/drafts/[id] ──────────────────────────────────────────
// Returns the FULL draft including its state JSON. Used when loading a draft
// into the editor.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("lens_remix_drafts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      // PGRST116 = no rows returned. Treat as 404 not 500.
      if ((error as any).code === "PGRST116") return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      console.error("[drafts/:id GET] supabase error:", error);
      return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    return NextResponse.json({ draft: data });
  } catch (err: any) {
    console.error("[drafts/:id GET] unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

// ─── DELETE /api/lens/remix/drafts/[id] ───────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS also enforces ownership; the explicit user_id filter is belt-and-suspenders.
    const { error, count } = await supabase
      .from("lens_remix_drafts")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[drafts/:id DELETE] supabase error:", error);
      return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
    }
    if (count === 0) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[drafts/:id DELETE] unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
