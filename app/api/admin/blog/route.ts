import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET — list all posts (admin sees drafts too)
export async function GET() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, posts: data || [] });
  } catch (error) {
    console.error("[Admin Blog] GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST — create new post
export async function POST(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { title, slug, content, excerpt, meta_title, meta_description, featured_image, featured_image_alt, status, tags, read_time_minutes } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: "Title and slug are required" }, { status: 400 });
    }

    const postData: any = {
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
      content: content || "",
      excerpt: excerpt || "",
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || "",
      featured_image: featured_image || "",
      featured_image_alt: featured_image_alt || "",
      status: status || "draft",
      tags: tags || [],
      read_time_minutes: read_time_minutes || Math.max(1, Math.ceil((content || "").split(/\s+/).length / 200)),
    };

    if (status === "published") {
      postData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .insert(postData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "A post with this slug already exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, post: data });
  } catch (error) {
    console.error("[Admin Blog] POST error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE — delete a post
export async function DELETE(request: Request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Blog] DELETE error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
