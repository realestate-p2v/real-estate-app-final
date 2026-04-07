import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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

  return <div>Property found: {property.address}</div>;
}
