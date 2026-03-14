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
  Users,
  DollarSign,
  LogIn,
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

export default function JoinDirectoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    market: "",
    website: "",
    instagram: "",
    linkedin: "",
    bio: "",
    specialties: [] as string[],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      // Pre-fill email from account
      setForm(prev => ({ ...prev, email: user.email || "" }));
      // Check if already has a listing
      const res = await fetch("/api/directory/me");
      const data = await res.json();
      if (data.success && data.photographer) {
        // Already has listing — redirect to edit
        router.push("/directory/edit");
        return;
      }
    }
    setAuthLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.market) {
      setError("Name and market are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = "";
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
          const uploadResult = await uploadRes.json();
          photoUrl = uploadResult.secure_url || "";
        }
      }

      const res = await fetch("/api/directory/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photo_url: photoUrl }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Something went wrong");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Not logged in — show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Join the Photographer Directory</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Create a free account to list yourself in our directory. Realtors use it to find photographers in their market.
          </p>
          <div className="bg-card rounded-2xl border border-border p-8 space-y-4">
            <p className="font-semibold text-foreground">Sign in or create an account to get started</p>
            <p className="text-sm text-muted-foreground">
              Your account also lets you order listing videos, save drafts, earn referral commissions, and manage your directory listing.
            </p>
            <Button asChild className="w-full py-6 text-lg bg-primary">
              <Link href="/login?redirect=/directory/join">
                <LogIn className="mr-2 h-5 w-5" />
                Sign In to Continue
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Submitted successfully
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Your Listing is Live!</h1>
          <p className="text-lg text-muted-foreground">
            Your profile is now visible to realtors searching for photographers in {form.market}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link href="/directory">View the Directory</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/directory/edit">Edit My Listing</Link>
            </Button>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 text-left space-y-2 mt-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Earn 20% on Referrals
            </h3>
            <p className="text-sm text-muted-foreground">
              When your agent clients order listing videos through P2V, you earn 20% commission on every order. No cap, no contract.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/partners">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            <Camera className="h-4 w-4" />
            Join the Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Get Discovered by Realtors
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            List your photography business for free. Realtors use our directory to find photographers in their market.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <Camera className="h-6 w-6 text-primary mx-auto" />
            <h3 className="font-bold text-foreground">100% Free</h3>
            <p className="text-xs text-muted-foreground">No fees, no catch. List yourself for free.</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <Users className="h-6 w-6 text-accent mx-auto" />
            <h3 className="font-bold text-foreground">Realtor Traffic</h3>
            <p className="text-xs text-muted-foreground">Realtors browse our site daily. Get in front of them.</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto" />
            <h3 className="font-bold text-foreground">20% Referral</h3>
            <p className="text-xs text-muted-foreground">Earn commission when your agents order videos.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Your Information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name / Business Name *</Label>
              <Input
                placeholder="Jane Smith Photography"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">From your account</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Market / City *</Label>
            <Input
              placeholder="e.g. Los Angeles, CA"
              value={form.market}
              onChange={(e) => setForm({ ...form, market: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">The city or region where you primarily shoot</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                placeholder="janesmithphoto.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                placeholder="@janesmithphoto"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                placeholder="linkedin.com/in/janesmith"
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Bio</Label>
            <Textarea
              placeholder="Tell realtors about your experience, style, and what makes your photography stand out..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
            />
          </div>

          {/* Photo upload */}
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
              <div>
                <label className="cursor-pointer">
                  <span className="text-sm font-semibold text-primary hover:underline">
                    {photoPreview ? "Change photo" : "Upload photo"}
                  </span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground mt-1">Square image recommended. JPG or PNG.</p>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <Label>Specialties</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.specialties.includes(s)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    checked={form.specialties.includes(s)}
                    onCheckedChange={() => toggleSpecialty(s)}
                  />
                  <span className="text-sm text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-bold bg-accent hover:bg-accent/90"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Listing...</>
            ) : (
              <><Camera className="mr-2 h-5 w-5" /> Create My Free Listing</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your listing goes live immediately. You can edit or remove it anytime.
          </p>
        </form>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
