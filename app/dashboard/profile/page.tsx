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
  Palette,
  Plus,
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

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

const BROKERAGE_COLORS = [
  { hex: "#b40101", label: "KW Red" },{ hex: "#666666", label: "KW Gray" },{ hex: "#003399", label: "CB Blue" },{ hex: "#012169", label: "CB Navy" },
  { hex: "#003da5", label: "RM Blue" },{ hex: "#dc1c2e", label: "RM Red" },{ hex: "#b5985a", label: "C21 Gold" },{ hex: "#1c1c1c", label: "C21 Black" },
  { hex: "#000000", label: "CMP Black" },{ hex: "#333333", label: "CMP Dark" },{ hex: "#002349", label: "SIR Blue" },{ hex: "#1a1a1a", label: "SIR Black" },
  { hex: "#552448", label: "BH Purple" },{ hex: "#2d1a33", label: "BH Dark" },{ hex: "#1c3f6e", label: "EXP Blue" },{ hex: "#006341", label: "HH Green" },
  { hex: "#003d28", label: "HH Dk Green" },{ hex: "#4c8c2b", label: "BHG Green" },{ hex: "#d4272e", label: "EXT Red" },{ hex: "#e31937", label: "ERA Red" },
  { hex: "#273691", label: "ERA Blue" },{ hex: "#a02021", label: "RF Red" },{ hex: "#ffffff", label: "White" },
];

const ACCENT_COLORS = ["#b8860b","#c41e3a","#1e40af","#0d6e4f","#6b21a8","#be185d","#0e7490","#c2410c","#71717a","#ffffff","#000000"];

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

  // Company colors
  const [companyColors, setCompanyColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState("#000000");

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
        .select("saved_agent_name, saved_phone, saved_email, saved_company, saved_headshot_url, saved_logo_url, saved_website, saved_location, saved_branding_cards, saved_company_colors")
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
        setCompanyColors(Array.isArray(data.saved_company_colors) ? data.saved_company_colors : []);
      } else {
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

    const updates = {
      saved_agent_name: agentName.trim() || null,
      saved_phone: phone.trim() || null,
      saved_email: email.trim() || null,
      saved_company: company.trim() || null,
      saved_website: website.trim() || null,
      saved_location: location.trim() || null,
      saved_headshot_url: headshot,
      saved_logo_url: logo,
      saved_company_colors: companyColors,
    };

    const { data: existing } = await supabase
      .from("lens_usage")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from("lens_usage")
        .update(updates)
        .eq("user_id", userId);
      error = result.error;
    } else {
      const result = await supabase
        .from("lens_usage")
        .insert({ user_id: userId, ...updates });
      error = result.error;
    }

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
      if (userId) {
        await supabase.from("lens_usage")
          .update({ saved_headshot_url: url })
          .eq("user_id", userId);
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
        await supabase.from("lens_usage")
          .update({ saved_logo_url: url })
          .eq("user_id", userId);
      }
    }
    setUploadingLogo(false);
  };

  const handleDeleteBrandingCard = async (index: number) => {
    if (!userId) return;
    setDeletingCard(index);
    const updated = brandingCards.filter((_, i) => i !== index);
    const { error } = await supabase.from("lens_usage")
      .update({ saved_branding_cards: updated })
      .eq("user_id", userId);
    if (!error) setBrandingCards(updated);
    setDeletingCard(null);
  };

  const addColor = (hex: string) => {
    const normalized = hex.toLowerCase();
    if (companyColors.includes(normalized) || companyColors.length >= 6) return;
    setCompanyColors([...companyColors, normalized]);
  };

  const removeColor = (hex: string) => {
    setCompanyColors(companyColors.filter(c => c !== hex));
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
        </section>

        {/* Company Colors */}
        <section className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
            <Palette className="h-5 w-5 text-accent" />
            Company Colors
          </h2>
          <p className="text-sm text-muted-foreground mb-5">Pick up to 6 brand colors. These auto-fill as defaults in the Design Studio.</p>

          {/* Selected colors */}
          {companyColors.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-5">
              {companyColors.map(hex => (
                <div key={hex} className="relative group">
                  <div
                    className="h-12 w-12 rounded-xl border-2 border-border shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                  <button
                    onClick={() => removeColor(hex)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-[9px] text-muted-foreground text-center mt-1 font-mono">{hex}</p>
                </div>
              ))}
              {companyColors.length < 6 && (
                <div className="h-12 w-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Plus className="h-4 w-4" />
                </div>
              )}
            </div>
          )}

          {companyColors.length >= 6 && (
            <p className="text-xs text-amber-600 mb-4">Maximum 6 colors reached. Remove one to add another.</p>
          )}

          {/* Brokerage presets */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Brokerage Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {BROKERAGE_COLORS.map(c => {
                const selected = companyColors.includes(c.hex.toLowerCase());
                return (
                  <button
                    key={c.hex + c.label}
                    onClick={() => selected ? removeColor(c.hex.toLowerCase()) : addColor(c.hex)}
                    title={c.label}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-[10px] font-semibold"
                    style={{
                      borderColor: selected ? "#6366f1" : "rgba(0,0,0,0.1)",
                      backgroundColor: selected ? "rgba(99,102,241,0.08)" : "transparent",
                    }}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-sm border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-muted-foreground">{c.label}</span>
                    {selected && <Check className="h-3 w-3 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent colors */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Accent Colors</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(hex => {
                const selected = companyColors.includes(hex.toLowerCase());
                return (
                  <button
                    key={hex}
                    onClick={() => selected ? removeColor(hex.toLowerCase()) : addColor(hex)}
                    className="h-8 w-8 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: hex,
                      borderColor: selected ? "#6366f1" : "rgba(0,0,0,0.1)",
                      boxShadow: selected ? "0 0 0 2px rgba(99,102,241,0.4)" : "none",
                    }}
                    title={hex}
                  >
                    {selected && (
                      <Check className="h-4 w-4 mx-auto" style={{ color: isLightColor(hex) ? "#333" : "#fff" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color picker */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Custom Color</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColorInput}
                onChange={e => setCustomColorInput(e.target.value)}
                className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0 bg-transparent"
              />
              <Input
                value={customColorInput}
                onChange={e => setCustomColorInput(e.target.value)}
                className="w-28 font-mono text-sm"
                placeholder="#000000"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addColor(customColorInput)}
                disabled={companyColors.length >= 6 || companyColors.includes(customColorInput.toLowerCase())}
                className="font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        </section>

        {/* Save button between sections */}
        <div className="flex items-center gap-3 mb-6 px-2">
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
            <strong>Where this info appears:</strong> Your name, photo, contact details, and brand colors auto-fill
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
