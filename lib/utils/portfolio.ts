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

  console.log("[Portfolio] ensurePropertyExists called:", { userId: userId?.slice(0, 8), address, normalized });

  // Check if property already exists for this user
  // Use .maybeSingle() instead of .single() — .single() throws an error when 0 rows found
  const { data: existing, error: lookupError } = await supabase
    .from("agent_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("address_normalized", normalized)
    .maybeSingle();

  if (lookupError) {
    console.error("[Portfolio] Lookup error:", lookupError);
  }

  if (existing) {
    console.log("[Portfolio] Found existing property:", existing.id);
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
  console.log("[Portfolio] Creating new property for:", normalized);
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

  if (error) {
    console.error("[Portfolio] Insert error:", error);
    throw error;
  }

  console.log("[Portfolio] Created property:", newProp.id);
  return newProp.id;
}
