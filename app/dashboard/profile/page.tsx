"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  Globe,
  MapPin,
  Upload,
  X,
  Loader2,
  Check,
  Camera,
  CreditCard,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

async function uploadToCloudinary(file: File, folder: string): Promise<string | null> {
  try {
    const sigResponse = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: `photo2video/${folder}` }),
    });
    const sigData = await sigResponse.json();
    if (!sigData.success) throw new Error("Signature failed");
    const { signature, timestamp, cloudName, apiKey, folder: folderPath } = sigData.data;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", timestamp.toString());
    fd.append("signature", signature);
    fd.append("folder", folderPath);
    fd.append("resource_type", "auto");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: "POST", body: fd });
    const result = await res.json();
    return result.secure_url || null;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

export default function AgentProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Profile fields
  const [agentName, setAgentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");

  // Images
  const [headshot, setHeadshot] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const headshotRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Branding cards
  const [brandingCards, setBrandingCards] = useState<string[]>([]);
  const [deletingCard, setDeletingCard] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/dashboard/profile");
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("lens_usage")
        .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url, saved_website, saved_location, saved_branding_cards")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setAgentName(data.saved_agent_name || "");
        setPhone(data.saved_phone || "");
        setEmail(data.saved_email || user.email || "");
        setCompany(data.saved_company || "");
        setWebsite(data.saved_website || "");
        setLocation(data.saved_location || "");
        setHeadshot(data.saved_headshot_url || null);
        setLogo(data.saved_logo_url || null);
        setBrandingCards(Array.isArray(data.saved_branding_cards) ? data.saved_branding_cards : []);
      } else {
        // Pre-fill email from auth
        setEmail(user.email || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from("lens_usage").upsert({
      user_id: userId,
      saved_agent_name: agentName.trim() || null,
      saved_phone: phone.trim() || null,
      saved_email: email.trim() || null,
      saved_company: company.trim() || null,
      saved_website: website.trim() || null,
      saved_location: location.trim() || null,
      saved_headshot_url: headshot,
      saved_logo_url: logo,
    }, { onConflict: "user_id" });

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleHeadshotUpload = async (file: File) => {
    setUploadingHeadshot(true);
    const url = await uploadToCloudinary(file, "agent-profiles");
    if (url) {
      setHeadshot(url);
      // Save immediately
      if (userId) {
        await supabase.from("lens_usage").upsert(
          { user_id: userId, saved_headshot_url: url },
          { onConflict: "user_id" }
        );
      }
    }
    setUploadingHeadshot(false);
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    const url = await uploadToCloudinary(file, "agent-profiles");
    if (url) {
      setLogo(url);
      if (userId) {
        await supabase.from("lens_usage").upsert(
          { user_id: userId, saved_logo_url: url },
          { onConflict: "user_id" }
        );
      }
    }
    setUploadingLogo(false);
  };

  const handleDeleteBrandingCard = async (index: number) => {
    if (!userId) return;
    setDeletingCard(index);
    const updated = brandingCards.filter((_, i) => i !== index);
    const { error } = await supabase.from("lens_usage").upsert(
      { user_id: userId, saved_branding_cards: updated },
      { onConflict: "user_id" }
    );
    if (!error) setBrandingCards(updated);
    setDeletingCard(null);
  };

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Agent Profile</h1>
            <p className="text-muted-foreground mt-1">Your info auto-fills the Design Studio, listing pages, and property websites.</p>
          </div>
        </div>

        {/* Headshot + Logo */}
        <section className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Photos</h2>
          <div className="flex items-start gap-8">
            {/* Headshot */}
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Headshot</p>
              <div className="relative group">
                {headshot ? (
                  <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-border">
                    <img src={headshot} alt="Headshot" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setHeadshot(null)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => headshotRef.current?.click()}
                    disabled={uploadingHeadshot}
                    className="h-28 w-28 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {uploadingHeadshot ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Upload</span>
                      </>
                    )}
                  </button>
                )}
                {headshot && (
                  <button
                    onClick={() => headshotRef.current?.click()}
                    disabled={uploadingHeadshot}
                    className="text-[10px] font-semibold text-accent hover:text-accent/80 mt-1.5"
                  >
                    {uploadingHeadshot ? "Uploading..." : "Change"}
                  </button>
                )}
              </div>
              <input
                ref={headshotRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleHeadshotUpload(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Logo */}
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Brokerage Logo</p>
              <div className="relative group">
                {logo ? (
                  <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-border bg-white flex items-center justify-center p-2">
                    <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                    <button
                      onClick={() => setLogo(null)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={uploadingLogo}
                    className="h-28 w-28 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Upload</span>
                      </>
                    )}
                  </button>
                )}
                {logo && (
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={uploadingLogo}
                    className="text-[10px] font-semibold text-accent hover:text-accent/80 mt-1.5"
                  >
                    {uploadingLogo ? "Uploading..." : "Change"}
                  </button>
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Contact Information</h2>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
                {userEmail && email !== userEmail && (
                  <p className="text-[10px] text-muted-foreground mt-1">Account email: {userEmail}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Brokerage / Company
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Coldwell Banker"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Website
                </Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="www.janesmith.com"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Austin, TX"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
              ) : saved ? (
                <><Check className="h-4 w-4 mr-2" />Saved!</>
              ) : (
                "Save Profile"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">Changes auto-fill into your marketing tools and property pages.</p>
          </div>
        </section>

        {/* Branding Cards */}
        <section className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                Saved Branding Cards
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">These appear on your property listing pages.</p>
            </div>
            <Link
              href="/dashboard/lens/design-studio"
              className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              Create New →
            </Link>
          </div>

          {brandingCards.length === 0 ? (
            <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
              <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No branding cards saved yet.</p>
              <Button asChild size="sm" variant="outline" className="font-semibold">
                <Link href="/dashboard/lens/design-studio">
                  Create in Design Studio
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brandingCards.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={url} alt={`Branding Card ${i + 1}`} className="w-full h-auto" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {i === 0 && (
                      <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteBrandingCard(i)}
                      disabled={deletingCard === i}
                      className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      {deletingCard === i ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {i === 0 && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Shown on listings
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info note */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <p className="text-sm text-cyan-800">
            <strong>Where this info appears:</strong> Your name, photo, and contact details auto-fill
            into the Design Studio (listing graphics, branding cards, yard signs), property listing pages,
            and the Lensy AI chat widget. Update it here once — it flows everywhere.
          </p>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
