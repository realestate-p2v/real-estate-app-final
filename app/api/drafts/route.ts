import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/drafts — get all drafts for the logged-in user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data: drafts, error } = await supabase
      .from("order_drafts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/drafts — create or update a draft
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, draftName, formData } = body;

    if (!formData) {
      return NextResponse.json({ success: false, error: "formData is required" }, { status: 400 });
    }

    const name = draftName || formData.propertyAddress || "Untitled Draft";

    if (draftId) {
      // Update existing draft
      const { data, error } = await supabase
        .from("order_drafts")
        .update({
          draft_name: name,
          form_data: formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, draft: data });
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from("order_drafts")
        .insert({
          user_id: user.id,
          draft_name: name,
          form_data: formData,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, draft: data });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/drafts — delete a draft
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get("id");

    if (!draftId) {
      return NextResponse.json({ success: false, error: "Draft ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("order_drafts")
      .delete()
      .eq("id", draftId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
