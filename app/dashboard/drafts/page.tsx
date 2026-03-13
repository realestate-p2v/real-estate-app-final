"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Trash2, Loader2, ArrowRight, Plus } from "lucide-react";

interface Draft {
  id: string;
  draft_name: string;
  form_data: any;
  created_at: string;
  updated_at: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const res = await fetch("/api/drafts");
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error("Failed to load drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/drafts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDrafts(drafts.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setDeleting(null);
    }
  };

  const getPhotoCount = (draft: Draft) => {
    const photos = draft.form_data?.photos;
    if (Array.isArray(photos)) return photos.length;
    return 0;
  };

  const getOrientation = (draft: Draft) => {
    return draft.form_data?.orientation || "landscape";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Saved Drafts</h1>
            <p className="text-muted-foreground mt-1">Resume your unfinished orders</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/order">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">No saved drafts</h2>
            <p className="text-muted-foreground">
              When you start an order and save your progress, it will appear here.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 mt-4">
              <Link href="/order">Start a New Order</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-card rounded-xl border border-border p-6 flex items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{draft.draft_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span>{getPhotoCount(draft)} photos</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="capitalize">{getOrientation(draft)}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span>Last edited {formatDate(draft.updated_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/order?draft=${draft.id}`}>
                      Resume <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    disabled={deleting === draft.id}
                    className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    {deleting === draft.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
