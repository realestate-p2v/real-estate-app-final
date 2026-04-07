import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PropertyWebsiteClient from "./client";

export default async function PropertyWebsitePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("agent_properties")
    .select("*")
    .eq("website_slug", slug)
    .eq("website_published", true)
    .is("merged_into_id", null)
    .single();

  if (!property) notFound();

  const { data: agent } = await supabase
    .from("lens_usage")
    .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_logo_url, saved_headshot_url")
    .eq("user_id", property.user_id)
    .single();

  const modules = (property.website_modules || {}) as Record<string, boolean>;
  const curated = (property.website_curated || {}) as Record<string, string[]>;

  let descriptions: any[] = [];
  if (modules.description && curated.descriptions?.length) {
    const { data } = await supabase
      .from("lens_descriptions")
      .select("id, description, style")
      .in("id", curated.descriptions);
    descriptions = data || [];
  }

  let stagings: any[] = [];
  if (modules.staging && curated.staging?.length) {
    const { data } = await supabase
      .from("lens_staging")
      .select("id, original_url, staged_url, room_type, style")
      .in("id", curated.staging);
    stagings = data || [];
  }

  let designExports: any[] = [];
  if (modules.exports && curated.exports?.length) {
    const { data } = await supabase
      .from("design_exports")
      .select("id, export_url, overlay_video_url, template_type, export_format")
      .in("id", curated.exports);
    designExports = data || [];
  }

  return (
    <PropertyWebsiteClient
      property={property}
      agent={agent}
      modules={modules}
      curated={curated}
      descriptions={descriptions}
      stagings={stagings}
      exports={designExports}
      template={property.website_template || "modern_clean"}
    />
  );
}
