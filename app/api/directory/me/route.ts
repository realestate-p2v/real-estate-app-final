import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/directory/me — fetch the logged-in user's listing
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("photographers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, photographer: null });
    }

    return NextResponse.json({ success: true, photographer: data });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/directory/me — update the logged-in user's listing
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, market, website, instagram, linkedin, photo_url, specialties, bio } = body;

    if (!name || !market) {
      return NextResponse.json({ success: false, error: "Name and market are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("photographers")
      .update({
        name: name.trim(),
        market: market.trim(),
        website: website?.trim() || null,
        instagram: instagram?.trim() || null,
        linkedin: linkedin?.trim() || null,
        photo_url: photo_url || null,
        specialties: specialties || [],
        bio: bio?.trim() || null,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, photographer: data });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/directory/me — remove the logged-in user's listing
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("photographers")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
