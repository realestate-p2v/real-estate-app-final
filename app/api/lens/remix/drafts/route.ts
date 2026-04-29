// app/api/lens/remix/drafts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/lens/remix/drafts?propertyId=xxx ────────────────────────────────
// Returns lightweight metadata for a user's drafts. Optional propertyId filter.
// Full state is NOT returned here — fetch it via GET /api/lens/remix/drafts/[id].
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = req.nextUrl.searchParams.get("propertyId");

    let query = supabase
      .from("lens_remix_drafts")
      .select("id, name, property_id, created_at, updated_at, state")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (propertyId) query = query.eq("property_id", propertyId);

    const { data, error } = await query;
    if (error) {
      console.error("[drafts GET] supabase error:", error);
      return NextResponse.json({ error: "Failed to load drafts" }, { status: 500 });
    }

    // Strip state down to summary fields for the list view to keep payloads small.
    const summaries = (data || []).map((d: any) => {
      const clips = Array.isArray(d.state?.clips) ? d.state.clips : [];
      const totalDuration = clips.reduce((sum: number, c: any) => {
        const eff = ((c.trimEnd ?? 0) - (c.trimStart ?? 0)) / (c.speed || 1);
        return sum + (isFinite(eff) && eff > 0 ? eff : 0);
      }, 0);
      return {
        id: d.id,
        name: d.name,
        property_id: d.property_id,
        created_at: d.created_at,
        updated_at: d.updated_at,
        clip_count: clips.length,
        total_duration: Math.round(totalDuration * 10) / 10,
        size: d.state?.size || "landscape",
      };
    });

    return NextResponse.json({ drafts: summaries });
  } catch (err: any) {
    console.error("[drafts GET] unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

// ─── POST /api/lens/remix/drafts ──────────────────────────────────────────────
// Body: { id?: string, name: string, property_id?: string|null, state: object }
// If `id` is provided, updates that draft (after verifying ownership).
// If not, creates a new draft.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { id, name, property_id, state } = body as {
      id?: string;
      name?: string;
      property_id?: string | null;
      state?: any;
    };

    // Validate name
    const trimmedName = (name || "").trim();
    if (!trimmedName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (trimmedName.length > 120) return NextResponse.json({ error: "Name is too long (max 120 chars)" }, { status: 400 });

    // Validate state
    if (!state || typeof state !== "object") return NextResponse.json({ error: "State is required" }, { status: 400 });
    if (!Array.isArray(state.clips)) return NextResponse.json({ error: "State.clips must be an array" }, { status: 400 });
    // Cap clip count defensively
    if (state.clips.length > 50) return NextResponse.json({ error: "Too many clips (max 50)" }, { status: 400 });

    if (id) {
      // UPDATE existing — verify ownership via WHERE clause; RLS also enforces this.
      const { data, error } = await supabase
        .from("lens_remix_drafts")
        .update({ name: trimmedName, property_id: property_id ?? null, state })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("[drafts POST update] supabase error:", error);
        return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
      }
      if (!data) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      return NextResponse.json({ draft: data });
    }

    // CREATE new
    const { data, error } = await supabase
      .from("lens_remix_drafts")
      .insert({
        user_id: user.id,
        property_id: property_id ?? null,
        name: trimmedName,
        state,
      })
      .select()
      .single();

    if (error) {
      console.error("[drafts POST insert] supabase error:", error);
      return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
    }
    return NextResponse.json({ draft: data });
  } catch (err: any) {
    console.error("[drafts POST] unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
