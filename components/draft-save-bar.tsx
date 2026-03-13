"use client";

import { Save, Loader2, CheckCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DraftSaveBarProps {
  isLoggedIn: boolean;
  draftId: string | null;
  draftName: string;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  onSave: () => void;
}

export function DraftSaveBar({
  isLoggedIn,
  draftId,
  draftName,
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  onSave,
}: DraftSaveBarProps) {
  if (!isLoggedIn) {
    return (
      <div className="bg-muted/50 rounded-xl border border-border p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Save className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Sign in to save your progress.</span>{" "}
            Come back anytime and pick up where you left off.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="flex-shrink-0">
          <Link href="/login?redirect=/order">
            <LogIn className="mr-2 h-3.5 w-3.5" />
            Sign In
          </Link>
        </Button>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="bg-muted/50 rounded-xl border border-border p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {isSaving ? (
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : lastSaved ? (
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
        ) : (
          <Save className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
        <div className="min-w-0">
          {draftId ? (
            <p className="text-sm text-foreground truncate">
              <span className="font-medium">{draftName || "Draft"}</span>
              {lastSaved && (
                <span className="text-muted-foreground"> — saved at {formatTime(lastSaved)}</span>
              )}
              {hasUnsavedChanges && !isSaving && (
                <span className="text-amber-600"> — unsaved changes</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Save your progress to continue later
            </p>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={isSaving || (!hasUnsavedChanges && !!draftId)}
        className="flex-shrink-0"
      >
        {isSaving ? (
          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</>
        ) : (
          <><Save className="mr-2 h-3.5 w-3.5" /> {draftId ? "Save" : "Save Draft"}</>
        )}
      </Button>
    </div>
  );
}
