"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseDraftOptions {
  getFormData: () => Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  autoSaveInterval?: number;
}

interface DraftState {
  draftId: string | null;
  draftName: string;
  isSaving: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  hasUnsavedChanges: boolean;
}

export function useOrderDraft({ getFormData, setFormData, autoSaveInterval = 30000 }: UseDraftOptions) {
  const [state, setState] = useState<DraftState>({
    draftId: null,
    draftName: "",
    isSaving: false,
    lastSaved: null,
    isLoading: false,
    isLoggedIn: false,
    hasUnsavedChanges: false,
  });

  const supabase = createClient();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef(getFormData);
  formDataRef.current = getFormData;

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setState(prev => ({ ...prev, isLoggedIn: !!user }));
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, isLoggedIn: !!session?.user }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load draft from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const draftIdFromUrl = params.get("draft");
    if (draftIdFromUrl) {
      loadDraft(draftIdFromUrl);
    }
  }, []);

  // Auto-save timer
  useEffect(() => {
    if (!state.isLoggedIn || !state.draftId) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (state.hasUnsavedChanges) {
        saveDraft(false);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [state.isLoggedIn, state.draftId, state.hasUnsavedChanges, autoSaveInterval]);

  const markChanged = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  const saveDraft = useCallback(async (showLoading = true) => {
    if (!state.isLoggedIn) return null;

    if (showLoading) {
      setState(prev => ({ ...prev, isSaving: true }));
    }

    try {
      const currentData = formDataRef.current();
      const draftName = currentData.propertyAddress || "Untitled Draft";

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: state.draftId,
          draftName,
          formData: currentData,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        setState(prev => ({
          ...prev,
          draftId: data.draft.id,
          draftName: data.draft.draft_name,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }));

        if (!state.draftId) {
          const url = new URL(window.location.href);
          url.searchParams.set("draft", data.draft.id);
          window.history.replaceState({}, "", url.toString());
        }

        return data.draft.id;
      }
    } catch (err) {
      console.error("Draft save failed:", err);
    }

    setState(prev => ({ ...prev, isSaving: false }));
    return null;
  }, [state.isLoggedIn, state.draftId]);

  const loadDraft = useCallback(async (draftId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch("/api/drafts");
      const data = await res.json();
      if (data.success && data.drafts) {
        const draft = data.drafts.find((d: any) => d.id === draftId);
        if (draft) {
          setFormData(draft.form_data);
          setState(prev => ({
            ...prev,
            draftId: draft.id,
            draftName: draft.draft_name,
            isLoading: false,
            lastSaved: new Date(draft.updated_at),
            hasUnsavedChanges: false,
          }));
          return;
        }
      }
    } catch (err) {
      console.error("Draft load failed:", err);
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, [setFormData]);

  const deleteDraft = useCallback(async () => {
    if (!state.draftId) return;
    try {
      await fetch(`/api/drafts?id=${state.draftId}`, { method: "DELETE" });
      setState(prev => ({
        ...prev,
        draftId: null,
        draftName: "",
        lastSaved: null,
        hasUnsavedChanges: false,
      }));
      const url = new URL(window.location.href);
      url.searchParams.delete("draft");
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      console.error("Draft delete failed:", err);
    }
  }, [state.draftId]);

  return {
    ...state,
    saveDraft,
    loadDraft,
    deleteDraft,
    markChanged,
  };
}
