// lib/hooks/use-order-form-autosave.ts
// Phase 1A Section 9 — autosave hook.
//
// Behavior:
// - On first address entry: create agent_properties row (status='draft')
//   and orders row (is_draft=true) linked to it.
// - Every ~3 seconds on change: debounced update to both rows.
// - On submit: parent promotes draft (flips is_draft=false, status='active').
// - On mount: if ?draft=<id> present OR most recent draft exists, rehydrate.
// - localStorage cache as secondary safety net (survives tab close before
//   first Supabase save completes).
//
// This hook does NOT manage the Cloudinary upload lifecycle — the photo
// uploader continues to own that. We only persist already-uploaded photo
// metadata (secure_url, description, etc.).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEBOUNCE_MS = 3000;
const LOCAL_CACHE_KEY = "p2v_order_draft_v1";

export interface OrderDraftPayload {
  // Property
  propertyAddress: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyBedrooms?: string | number;
  propertyBathrooms?: string | number;
  propertySqft?: string | number;
  propertyPrice?: string | number;
  listingStatus?: string;

  // Order-scoped data (JSONB / primitives only — no File objects)
  photos: Array<Record<string, unknown>>;
  roomTags: Array<{ photo_index: number; room: string; label: string }>;
  musicSelection: string;
  resolution: string;
  orientation: string;
  brandingSelection: string;
  brandingData: Record<string, unknown>;
  includeEditedPhotos: boolean;
  photoEditing: boolean;
  specialFeatures: Record<string, string>;
  includeAddressOnCard: boolean;
  includeUnbranded: boolean;
  customIntroCardUrl?: string | null;
  customOutroCardUrl?: string | null;

  // Contact
  formData: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };

  // UI-only (not persisted to Supabase but cached in localStorage)
  photoInputMode?: string;
  listingUrl?: string;
  listingPackage?: Record<string, unknown> | null;
  listingPermission?: boolean;
  listingInstructions?: string;
}

export interface UseOrderFormAutosaveOptions {
  /** Returns the current draft state snapshot for saving. */
  getPayload: () => OrderDraftPayload;
  /** Called when a draft is rehydrated on mount. */
  onRehydrate: (payload: OrderDraftPayload, ids: { agentPropertyId: string; orderId: string }) => void;
}

export interface OrderFormAutosaveState {
  agentPropertyId: string | null;
  orderId: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  isLoggedIn: boolean;
  /** Manually request a save (parent can call on blur of important fields). */
  saveNow: () => Promise<void>;
  /** Mark that something changed — triggers debounced save. */
  markChanged: () => void;
  /** Called by the parent right before submit to flip draft → active. */
  promoteDraft: () => Promise<{ orderId: string | null; agentPropertyId: string | null }>;
}

/**
 * Small helper to generate a short unique order_id (text column on orders).
 * Matches the shape the existing webhook / API expects.
 */
function generateOrderIdString(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `ord_${ts}_${rand}`;
}

/** Normalize an address for the address_normalized column. */
function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}

export function useOrderFormAutosave({
  getPayload,
  onRehydrate,
}: UseOrderFormAutosaveOptions): OrderFormAutosaveState {
  const [agentPropertyId, setAgentPropertyId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rehydratedRef = useRef(false);
  const supabase = useRef(createClient()).current;

  // ───────────────────────────────────────────────────────────────────────
  // Rehydrate on mount
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (rehydratedRef.current) return;
    rehydratedRef.current = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoggedIn(false);
          // Try localStorage-only rehydrate for guest drafts
          try {
            const cached = localStorage.getItem(LOCAL_CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.payload) onRehydrate(parsed.payload, { agentPropertyId: "", orderId: "" });
            }
          } catch {
            /* ignore */
          }
          return;
        }
        setIsLoggedIn(true);
        userIdRef.current = user.id;

        // Priority 1: draft id in URL (magic-link return)
        const params = new URLSearchParams(window.location.search);
        const draftParam = params.get("draft");

        let targetOrder: any = null;

        if (draftParam) {
          const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("order_id", draftParam)
            .eq("user_id", user.id)
            .eq("is_draft", true)
            .maybeSingle();
          if (data) targetOrder = data;
        }

        // Priority 2: most recent in-progress draft for this user
        if (!targetOrder) {
          const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_draft", true)
            .order("draft_last_saved_at", { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();
          if (data) targetOrder = data;
        }

        if (!targetOrder) {
          // No server draft — try localStorage as final fallback
          try {
            const cached = localStorage.getItem(LOCAL_CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.payload) onRehydrate(parsed.payload, { agentPropertyId: "", orderId: "" });
            }
          } catch {
            /* ignore */
          }
          return;
        }

        // Pull the linked agent_property
        let propertyRow: any = null;
        if (targetOrder.agent_property_id) {
          const { data } = await supabase
            .from("agent_properties")
            .select("*")
            .eq("id", targetOrder.agent_property_id)
            .maybeSingle();
          propertyRow = data;
        }

        const payload: OrderDraftPayload = {
          propertyAddress: propertyRow?.address || targetOrder.property_address || "",
          propertyCity: propertyRow?.city || targetOrder.property_city || "",
          propertyState: propertyRow?.state || targetOrder.property_state || "",
          propertyZip: propertyRow?.zip || "",
          propertyBedrooms: propertyRow?.bedrooms ?? targetOrder.property_bedrooms ?? "",
          propertyBathrooms: propertyRow?.bathrooms ?? targetOrder.property_bathrooms ?? "",
          propertySqft: propertyRow?.sqft ?? "",
          propertyPrice: propertyRow?.price ?? "",
          listingStatus: propertyRow?.listing_status || "",
          photos: targetOrder.photos || [],
          roomTags: targetOrder.room_tags || [],
          musicSelection: targetOrder.music_selection || "",
          resolution: targetOrder.resolution || "768P",
          orientation: targetOrder.orientation || "landscape",
          brandingSelection: targetOrder.branding?.type || "unbranded",
          brandingData: targetOrder.branding || { type: "unbranded" },
          includeEditedPhotos: !!targetOrder.include_edited_photos,
          photoEditing: !!targetOrder.photo_editing,
          specialFeatures: targetOrder.special_features || propertyRow?.special_features_v2 || {},
          includeAddressOnCard: targetOrder.include_address_on_card !== false,
          includeUnbranded: !!targetOrder.include_unbranded,
          customIntroCardUrl: targetOrder.custom_intro_card_url || null,
          customOutroCardUrl: targetOrder.custom_outro_card_url || null,
          formData: {
            name: targetOrder.customer_name || "",
            email: targetOrder.customer_email || "",
            phone: targetOrder.customer_phone || "",
            notes: targetOrder.special_instructions || "",
          },
        };

        setAgentPropertyId(targetOrder.agent_property_id);
        setOrderId(targetOrder.order_id);
        setLastSavedAt(
          targetOrder.draft_last_saved_at ? new Date(targetOrder.draft_last_saved_at) : null
        );

        onRehydrate(payload, {
          agentPropertyId: targetOrder.agent_property_id || "",
          orderId: targetOrder.order_id || "",
        });
      } catch (err) {
        console.error("[autosave] rehydrate error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // Save logic
  // ───────────────────────────────────────────────────────────────────────

  const persist = useCallback(async () => {
    // Always write localStorage first (survives closure)
    try {
      const payload = getPayload();
      localStorage.setItem(
        LOCAL_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), payload })
      );
    } catch {
      /* ignore storage errors (quota, private mode) */
    }

    const userId = userIdRef.current;
    if (!userId) {
      // Not logged in — localStorage only
      setHasUnsavedChanges(false);
      return;
    }

    const payload = getPayload();
    const address = payload.propertyAddress?.trim();

    // Cannot create the draft row without an address. Wait for the user
    // to enter one — until then, everything lives in localStorage.
    if (!address) {
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    try {
      let propertyId = agentPropertyId;
      let orderIdStr = orderId;

      // Create agent_properties row on first save
      if (!propertyId) {
        const { data, error } = await supabase
          .from("agent_properties")
          .insert({
            user_id: userId,
            address,
            address_normalized: normalizeAddress(address),
            city: payload.propertyCity || null,
            state: payload.propertyState || null,
            zip: payload.propertyZip || null,
            bedrooms: payload.propertyBedrooms
              ? parseInt(String(payload.propertyBedrooms)) || null
              : null,
            bathrooms: payload.propertyBathrooms
              ? parseFloat(String(payload.propertyBathrooms)) || null
              : null,
            sqft: payload.propertySqft
              ? parseInt(String(payload.propertySqft)) || null
              : null,
            price: payload.propertyPrice
              ? parseInt(String(payload.propertyPrice)) || null
              : null,
            listing_status: payload.listingStatus || null,
            special_features_v2: payload.specialFeatures || {},
            status: "draft",
            draft_created_at: new Date().toISOString(),
            draft_last_saved_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) throw error;
        propertyId = data.id;
        setAgentPropertyId(propertyId);
      } else {
        // Update existing property row
        await supabase
          .from("agent_properties")
          .update({
            address,
            address_normalized: normalizeAddress(address),
            city: payload.propertyCity || null,
            state: payload.propertyState || null,
            zip: payload.propertyZip || null,
            bedrooms: payload.propertyBedrooms
              ? parseInt(String(payload.propertyBedrooms)) || null
              : null,
            bathrooms: payload.propertyBathrooms
              ? parseFloat(String(payload.propertyBathrooms)) || null
              : null,
            sqft: payload.propertySqft
              ? parseInt(String(payload.propertySqft)) || null
              : null,
            price: payload.propertyPrice
              ? parseInt(String(payload.propertyPrice)) || null
              : null,
            listing_status: payload.listingStatus || null,
            special_features_v2: payload.specialFeatures || {},
            draft_last_saved_at: new Date().toISOString(),
          })
          .eq("id", propertyId);
      }

      // Create orders row on first save
      if (!orderIdStr) {
        const newOrderIdStr = generateOrderIdString();
        const { data, error } = await supabase
          .from("orders")
          .insert({
            order_id: newOrderIdStr,
            user_id: userId,
            agent_property_id: propertyId,
            is_draft: true,
            status: "draft",
            payment_status: "pending",
            property_address: address,
            property_city: payload.propertyCity || null,
            property_state: payload.propertyState || null,
            property_bedrooms: payload.propertyBedrooms
              ? parseInt(String(payload.propertyBedrooms)) || null
              : null,
            property_bathrooms: payload.propertyBathrooms
              ? parseInt(String(payload.propertyBathrooms)) || null
              : null,
            photos: payload.photos || [],
            photo_count: (payload.photos || []).length,
            room_tags: payload.roomTags || [],
            music_selection: payload.musicSelection || null,
            resolution: payload.resolution || "768P",
            orientation: payload.orientation || "landscape",
            branding: payload.brandingData || { type: payload.brandingSelection || "unbranded" },
            include_edited_photos: !!payload.includeEditedPhotos,
            photo_editing: !!payload.photoEditing,
            special_features: payload.specialFeatures || {},
            special_instructions: payload.formData?.notes || null,
            customer_name: payload.formData?.name || null,
            customer_email: payload.formData?.email || null,
            customer_phone: payload.formData?.phone || null,
            include_address_on_card: payload.includeAddressOnCard !== false,
            include_unbranded: !!payload.includeUnbranded,
            custom_intro_card_url: payload.customIntroCardUrl || null,
            custom_outro_card_url: payload.customOutroCardUrl || null,
            draft_last_saved_at: new Date().toISOString(),
          })
          .select("order_id")
          .single();
        if (error) throw error;
        orderIdStr = data.order_id;
        setOrderId(orderIdStr);
      } else {
        await supabase
          .from("orders")
          .update({
            agent_property_id: propertyId,
            property_address: address,
            property_city: payload.propertyCity || null,
            property_state: payload.propertyState || null,
            property_bedrooms: payload.propertyBedrooms
              ? parseInt(String(payload.propertyBedrooms)) || null
              : null,
            property_bathrooms: payload.propertyBathrooms
              ? parseInt(String(payload.propertyBathrooms)) || null
              : null,
            photos: payload.photos || [],
            photo_count: (payload.photos || []).length,
            room_tags: payload.roomTags || [],
            music_selection: payload.musicSelection || null,
            resolution: payload.resolution || "768P",
            orientation: payload.orientation || "landscape",
            branding: payload.brandingData || { type: payload.brandingSelection || "unbranded" },
            include_edited_photos: !!payload.includeEditedPhotos,
            photo_editing: !!payload.photoEditing,
            special_features: payload.specialFeatures || {},
            special_instructions: payload.formData?.notes || null,
            customer_name: payload.formData?.name || null,
            customer_email: payload.formData?.email || null,
            customer_phone: payload.formData?.phone || null,
            include_address_on_card: payload.includeAddressOnCard !== false,
            include_unbranded: !!payload.includeUnbranded,
            custom_intro_card_url: payload.customIntroCardUrl || null,
            custom_outro_card_url: payload.customOutroCardUrl || null,
            draft_last_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderIdStr);
      }

      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("[autosave] persist error:", err);
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentPropertyId, orderId, getPayload, supabase]);

  // ───────────────────────────────────────────────────────────────────────
  // Debounced trigger
  // ───────────────────────────────────────────────────────────────────────

  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void persist();
    }, DEBOUNCE_MS);
  }, [persist]);

  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    await persist();
  }, [persist]);

  // ───────────────────────────────────────────────────────────────────────
  // Promote draft on submit
  // ───────────────────────────────────────────────────────────────────────

  const promoteDraft = useCallback(async () => {
    // Flush any pending save first
    await saveNow();

    if (agentPropertyId) {
      try {
        await supabase
          .from("agent_properties")
          .update({
            status: "active",
            draft_last_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", agentPropertyId);
      } catch (err) {
        console.error("[autosave] promote property error:", err);
      }
    }

    if (orderId) {
      try {
        await supabase
          .from("orders")
          .update({
            is_draft: false,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);
      } catch (err) {
        console.error("[autosave] promote order error:", err);
      }
    }

    // Clear localStorage on successful promotion
    try {
      localStorage.removeItem(LOCAL_CACHE_KEY);
    } catch {
      /* ignore */
    }

    return { orderId, agentPropertyId };
  }, [agentPropertyId, orderId, saveNow, supabase]);

  // Flush on unmount so nothing is lost when the user navigates away
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    agentPropertyId,
    orderId,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    isLoggedIn,
    saveNow,
    markChanged,
    promoteDraft,
  };
}
