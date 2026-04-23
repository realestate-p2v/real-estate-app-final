// lib/hooks/use-order-form-autosave.ts
// Phase 1A Section 9 — manual-save draft hook (v2).
//
// Change from v1:
//   - Removed debounced auto-save. Drafts are now ONLY persisted when
//     the parent calls saveNow() (wired to the Save button in
//     DraftSaveBar).
//   - Removed localStorage caching. Every save goes to Supabase only.
//   - Removed auto-rehydrate on mount. Old drafts do NOT reappear when
//     the user opens the order form — they start with an empty state.
//     A separate "Resume draft" UI (future) will handle explicit
//     rehydration via ?draft=<id>.
//   - markChanged() still flips hasUnsavedChanges so the Save bar can
//     indicate pending state, but it no longer triggers any write.
//
// Behavior preserved:
//   - On explicit saveNow(): create or update linked agent_properties
//     + orders rows (is_draft=true, status='draft').
//   - On submit (promoteDraft): flip is_draft=false, status='active'.
//   - If the user isn't logged in, saveNow() is a no-op (nothing to
//     persist remotely, and we no longer cache locally).
//   - Interface and return shape identical to v1 — no caller changes
//     needed.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // UI-only (kept in the interface so callers can pass it through; not
  // persisted to Supabase columns)
  photoInputMode?: string;
  listingUrl?: string;
  listingPackage?: Record<string, unknown> | null;
  listingPermission?: boolean;
  listingInstructions?: string;
}

export interface UseOrderFormAutosaveOptions {
  /** Returns the current draft state snapshot for saving. */
  getPayload: () => OrderDraftPayload;
  /**
   * Called when a draft is rehydrated on mount. Retained for interface
   * compatibility; v2 of this hook never calls it automatically. A
   * future "Resume draft" flow can re-enable rehydration by reading
   * ?draft=<id> and calling onRehydrate explicitly.
   */
  onRehydrate: (
    payload: OrderDraftPayload,
    ids: { agentPropertyId: string; orderId: string }
  ) => void;
}

export interface OrderFormAutosaveState {
  agentPropertyId: string | null;
  orderId: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  isLoggedIn: boolean;
  /** Persist the current draft to Supabase. Called on Save button click. */
  saveNow: () => Promise<void>;
  /**
   * Mark state as dirty so the Save bar can show "Unsaved changes".
   * Does NOT trigger any write in v2 — saving is strictly manual.
   */
  markChanged: () => void;
  /** Called by the parent right before submit to flip draft → active. */
  promoteDraft: () => Promise<{
    orderId: string | null;
    agentPropertyId: string | null;
  }>;
}

function generateOrderIdString(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `ord_${ts}_${rand}`;
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}

export function useOrderFormAutosave({
  getPayload,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRehydrate,
}: UseOrderFormAutosaveOptions): OrderFormAutosaveState {
  const [agentPropertyId, setAgentPropertyId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const supabase = useRef(createClient()).current;

  // ───────────────────────────────────────────────────────────────────────
  // Mount: figure out auth state only. No rehydrate, no cache read.
  // ───────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          userIdRef.current = user.id;
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("[autosave] auth check error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────────────────────────────────
  // Persist (explicit only — called by saveNow or promoteDraft)
  // ───────────────────────────────────────────────────────────────────────
  const persist = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) {
      // Not logged in — nothing to write and no local cache in v2.
      setHasUnsavedChanges(false);
      return;
    }

    const payload = getPayload();
    const address = payload.propertyAddress?.trim();
    if (!address) {
      // Can't create a draft without an address. Silently no-op — the
      // Save button can still be pressed but no row is created until
      // the user enters an address.
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    try {
      let propertyId = agentPropertyId;
      let orderIdStr = orderId;

      // Create or update agent_properties row
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

      // Create or update orders row
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
            branding: payload.brandingData || {
              type: payload.brandingSelection || "unbranded",
            },
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
            branding: payload.brandingData || {
              type: payload.brandingSelection || "unbranded",
            },
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
  // Public API
  // ───────────────────────────────────────────────────────────────────────

  // markChanged: flag only, no write.
  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const saveNow = useCallback(async () => {
    await persist();
  }, [persist]);

  const promoteDraft = useCallback(async () => {
    // Flush anything the user typed since their last Save click.
    await persist();

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

    return { orderId, agentPropertyId };
  }, [agentPropertyId, orderId, persist, supabase]);

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
