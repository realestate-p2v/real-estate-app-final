import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");

  // Try to get user from Supabase auth
  const { createClient: createBrowserClient } = await import("@/lib/supabase/server");
  const sbServer = await createBrowserClient();
  const { data: { user } } = await sbServer.auth.getUser();
  return user;
}

/* ─── GET: List user's websites ─── */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── POST: Create a new website ─── */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      site_type,
      status = "draft",
      slug,
      template = "modern_clean",
      modules = {},
      property_id = null,
      hero_headline = null,
      hero_subheadline = null,
      about_content = null,
      agent_bio = null,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!["property", "agent"].includes(site_type)) {
      return NextResponse.json({ error: "Invalid site type" }, { status: 400 });
    }
    if (!slug?.trim() || slug.trim().length < 3) {
      return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 });
    }

    // Validate slug format
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanSlug !== slug.trim()) {
      return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
    }

    // Check slug availability
    const { data: existingSlug } = await supabase
      .from("site_slugs")
      .select("slug")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json({ error: "This subdomain is already taken" }, { status: 409 });
    }

    // Check subscription tier
    const isAdmin = ADMIN_EMAILS.includes(user.email || "");
    let billingType = "included";

    if (!isAdmin) {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("subscription_tier, included_website_used")
        .eq("user_id", user.id)
        .single();

      if (usage?.subscription_tier !== "pro") {
        // Check if they have a buy-outright purchase pending
        // For now, only Pro subscribers can create via wizard
        // Buy-outright flow goes through /api/websites/billing/purchase
        return NextResponse.json(
          { error: "Lens Pro subscription required to create a website" },
          { status: 403 }
        );
      }

      if (usage?.included_website_used) {
        // They need to pay for an additional site
        // This should have been handled by the upgrade modal before reaching here
        return NextResponse.json(
          { error: "You've used your included website. Purchase an add-on or buy outright." },
          { status: 403 }
        );
      }

      billingType = "included";
    }

    // Validate property exists and belongs to user (for property sites)
    if (site_type === "property" && property_id) {
      const { data: prop } = await supabase
        .from("agent_properties")
        .select("id")
        .eq("id", property_id)
        .eq("user_id", user.id)
        .single();

      if (!prop) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
    }

    // Create the website
    const { data: website, error: createError } = await supabase
      .from("websites")
      .insert({
        user_id: user.id,
        name: name.trim(),
        site_type,
        status,
        slug: cleanSlug,
        template,
        modules,
        property_id: site_type === "property" ? property_id : null,
        hero_headline,
        hero_subheadline,
        about_content,
        agent_bio,
        billing_type: billingType,
        meta_title: name.trim(),
        meta_description: site_type === "property"
          ? `View ${name.trim()} — photos, videos, and details`
          : `${name.trim()} — Real Estate Agent`,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Register the slug
    await supabase.from("site_slugs").insert({
      slug: cleanSlug,
      site_type,
      website_id: website.id,
      property_id: site_type === "property" ? property_id : null,
    });

    // Mark included website as used
    if (billingType === "included" && !isAdmin) {
      await supabase
        .from("lens_usage")
        .update({ included_website_used: true })
        .eq("user_id", user.id);
    }

    // If property site, update agent_properties to link
    if (site_type === "property" && property_id) {
      await supabase
        .from("agent_properties")
        .update({
          website_published: status === "published",
          website_slug: cleanSlug,
          website_template: template,
          website_modules: modules,
        })
        .eq("id", property_id);
    }

    return NextResponse.json(website, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── PATCH: Update a website ─── */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Website ID is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("websites")
      .select("id, user_id, slug")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // If slug is changing, check availability
    if (updates.slug && updates.slug !== existing.slug) {
      const cleanSlug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      const { data: takenSlug } = await supabase
        .from("site_slugs")
        .select("slug")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (takenSlug) {
        return NextResponse.json({ error: "This subdomain is already taken" }, { status: 409 });
      }

      // Update slug registry
      await supabase.from("site_slugs").delete().eq("website_id", id);
      await supabase.from("site_slugs").insert({
        slug: cleanSlug,
        site_type: updates.site_type || "property",
        website_id: id,
      });

      updates.slug = cleanSlug;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("websites")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─── DELETE: Delete a website ─── */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Website ID is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("websites")
      .select("id, user_id, slug, property_id, billing_type")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Remove slug registration
    if (existing.slug) {
      await supabase.from("site_slugs").delete().eq("website_id", id);
    }

    // If property site, unlink from agent_properties
    if (existing.property_id) {
      await supabase
        .from("agent_properties")
        .update({
          website_published: false,
          website_slug: null,
        })
        .eq("id", existing.property_id);
    }

    // If this was the included site, free up the slot
    if (existing.billing_type === "included") {
      await supabase
        .from("lens_usage")
        .update({ included_website_used: false })
        .eq("user_id", user.id);
    }

    // Delete the website
    const { error } = await supabase.from("websites").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
