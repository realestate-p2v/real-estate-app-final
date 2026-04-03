import { normalizeAddress } from "./address";

export async function ensurePropertyExists(
  supabase: any,
  userId: string,
  address: string,
  extras?: {
    city?: string;
    state?: string;
    bedrooms?: number;
    bathrooms?: number;
  }
): Promise<string> {
  const normalized = normalizeAddress(address);
  if (!normalized) throw new Error("Address is required");

  // Check if property already exists for this user
  const { data: existing } = await supabase
    .from("agent_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("address_normalized", normalized)
    .single();

  if (existing) {
    // Update with any new details if provided
    if (extras && (extras.city || extras.state || extras.bedrooms || extras.bathrooms)) {
      await supabase
        .from("agent_properties")
        .update({
          ...(extras.city && { city: extras.city }),
          ...(extras.state && { state: extras.state }),
          ...(extras.bedrooms && { bedrooms: extras.bedrooms }),
          ...(extras.bathrooms && { bathrooms: extras.bathrooms }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  // Create new property
  const { data: newProp, error } = await supabase
    .from("agent_properties")
    .insert({
      user_id: userId,
      address: address.trim(),
      address_normalized: normalized,
      city: extras?.city || null,
      state: extras?.state || null,
      bedrooms: extras?.bedrooms || null,
      bathrooms: extras?.bathrooms || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return newProp.id;
}
