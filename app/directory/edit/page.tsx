"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Camera,
  CheckCircle,
  Loader2,
  Upload,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";

const SPECIALTIES = [
  "Residential Real Estate",
  "Commercial Real Estate",
  "Luxury Properties",
  "Architectural Photography",
  "Drone / Aerial",
  "Virtual Tours / 360°",
  "Twilight / Golden Hour",
  "Interior Design",
  "New Construction",
  "Vacation Rentals",
];

export default function EditDirectoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    market: "",
    website: "",
    instagram: "",
    linkedin: "",
    bio: "",
    specialties: [] as string[],
    photo_url: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListing();
  }, []);

  const loadListing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) {
      router.push("/login?redirect=/directory/edit");
      return;
    }

    const res = await fetch("/api/directory/me");
    const data = await res.json();
    if (data.success && data.photographer) {
      const p = data.photographer;
      setForm({
        name: p.name || "",
        email: p.email || "",
        market: p.market || "",
        website: p.website || "",
        instagram: p.instagram || "",
        linkedin: p.linkedin || "",
        bio: p.bio || "",
        specialties: p.specialties || [],
        photo_url: p.photo_url || "",
      });
      if (p.photo_url) setPhotoPreview(p.photo_url);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!form.name || !form.market) {
      setError("Name and market are required.");
      return;
    }

    setIsSaving(true);
    try {
      let photoUrl = form.photo_url;
      if (photoFile) {
        const sigRes = await fetch("/api/cloudinary-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "photo2video/directory" }),
        });
        const sigData = await sigRes.json();
        if (sigData.success) {
          const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
          const uploadData = new FormData();
          uploadData.append("file", photoFile);
          uploadData.append("api_key", apiKey);
          uploadData.append("timestamp", timestamp.toString());
          uploadData.append("signature", signature);
          uploadData.append("folder", folder);
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: "POST",
            body: uploadData,
          });
          const result = await uploadRes.json();
          photoUrl = result.secure_url || photoUrl;
        }
      }

      const res = await fetch("/api/directory/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photo_url: photoUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove your listing from the directory? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/directory/me", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/directory");
      }
    } catch (err) {
      setError("Failed to delete listing");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No Listing Found</h1>
          <p className="text-muted-foreground">You don't have a directory listing yet.</p>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link href="/directory/join">Create Your Free Listing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit My Listing</h1>
            <p className="text-muted-foreground mt-1">Update your photographer directory profile</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/directory">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View Directory
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name / Business Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Market / City *</Label>
            <Input value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} required />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Logo or Headshot</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="text-sm font-semibold text-primary hover:underline">
                  {photoPreview ? "Change photo" : "Upload photo"}
                </span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Specialties</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map((s) => (
                <label key={s} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.specialties.includes(s) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}>
                  <Checkbox checked={form.specialties.includes(s)} onCheckedChange={() => toggleSpecialty(s)} />
                  <span className="text-sm text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">{error}</div>
          )}

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600 text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" /> Changes saved!
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 transition-colors"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remove Listing
            </button>
            <Button type="submit" disabled={isSaving} className="px-8 bg-primary">
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
