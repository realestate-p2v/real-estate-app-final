"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Sparkles,
  CreditCard,
  ImageIcon,
  Gift,
  AlertTriangle,
  Loader2,
  Check,
  ExternalLink,
  Upload,
  X,
  ArrowLeft,
  Settings,
  Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

interface LensUsage {
  is_subscriber: boolean;
  subscription_tier: string | null;
  monthly_analyses: number;
  analysis_limit: number;
  current_period_end: string | null;
  saved_headshot_url: string | null;
  saved_logo_url: string | null;
}

interface Charge {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created: number;
  receipt_url: string | null;
}

interface ReferralInfo {
  code: string;
  total_earned: number;
  total_orders: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Lens
  const [lensUsage, setLensUsage] = useState<LensUsage | null>(null);

  // Billing
  const [charges, setCharges] = useState<Charge[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingHasMore, setBillingHasMore] = useState(false);

  // Saved Assets
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Referral
  const [referral, setReferral] = useState<ReferralInfo | null>(null);

  // Portal
  const [portalLoading, setPortalLoading] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/dashboard/settings");
        return;
      }

      setUser(user);
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setPhone(user.user_metadata?.phone || "");

      // Fetch Lens usage
      const { data: lens } = await supabase
        .from("lens_usage")
        .select("is_subscriber, subscription_tier, monthly_analyses, analysis_limit, current_period_end, saved_headshot_url, saved_logo_url")
        .eq("user_id", user.id)
        .single();

      if (lens) {
        setLensUsage(lens);
        setHeadshotUrl(lens.saved_headshot_url);
        setLogoUrl(lens.saved_logo_url);
      }

      // Fetch referral info
      const { data: refData } = await supabase
        .from("referral_codes")
        .select("code, total_earned, total_orders")
        .eq("user_id", user.id)
        .single();

      if (refData) {
        setReferral(refData);
      }

      // Fetch billing history
      fetchBillingHistory();

      setLoading(false);
    };
    init();
  }, []);

  const fetchBillingHistory = async (startingAfter?: string) => {
    setBillingLoading(true);
    try {
      const url = startingAfter
        ? `/api/stripe/billing-history?starting_after=${startingAfter}`
        : "/api/stripe/billing-history";
      const res = await fetch(url);
      const data = await res.json();
      if (data.charges) {
        setCharges((prev) => (startingAfter ? [...prev, ...data.charges] : data.charges));
        setBillingHasMore(data.has_more || false);
      }
    } catch (e) {
      console.error("Failed to fetch billing:", e);
    }
    setBillingLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
    setProfileSaving(false);
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal");
      }
    } catch (e) {
      alert("Failed to open billing portal");
    }
    setPortalLoading(false);
  };

  const uploadAsset = async (file: File, type: "headshot" | "logo") => {
    if (!user) return;
    setAssetUploading(type);
    try {
      const sigRes = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "photo2video/assets" }),
      });
      const sigData = await sigRes.json();
      if (!sigData.success) throw new Error("Signature failed");

      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", timestamp.toString());
      fd.append("signature", signature);
      fd.append("folder", folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();

      if (result.secure_url) {
        const updateField = type === "headshot" ? "saved_headshot_url" : "saved_logo_url";
        await supabase
          .from("lens_usage")
          .update({ [updateField]: result.secure_url })
          .eq("user_id", user.id);

        if (type === "headshot") setHeadshotUrl(result.secure_url);
        else setLogoUrl(result.secure_url);
      }
    } catch (e) {
      console.error(`Failed to upload ${type}:`, e);
    }
    setAssetUploading(null);
  };

  const clearAsset = async (type: "headshot" | "logo") => {
    if (!user) return;
    const updateField = type === "headshot" ? "saved_headshot_url" : "saved_logo_url";
    await supabase
      .from("lens_usage")
      .update({ [updateField]: null })
      .eq("user_id", user.id);

    if (type === "headshot") setHeadshotUrl(null);
    else setLogoUrl(null);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || !user) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await supabase.auth.signOut();
        window.location.href = "/";
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (e) {
      alert("Failed to delete account");
    }
    setDeleting(false);
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = (fullName.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();
  const usagePercent = lensUsage
    ? Math.round((lensUsage.monthly_analyses / (lensUsage.analysis_limit || 200)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ═══ SECTION 1: PROFILE ═══ */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Profile</h2>
            </div>

            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {initial}
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here — contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                >
                  {profileSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : profileSaved ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : null}
                  {profileSaved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* ═══ SECTION 2: P2V LENS SUBSCRIPTION ═══ */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-cyan-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-600" />
              </div>
              <h2 className="text-lg font-bold text-foreground">P2V Lens Subscription</h2>
            </div>

            {lensUsage?.is_subscriber ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {lensUsage.subscription_tier === "yearly" ? "Individual (Yearly)" : "Individual ($27.95/mo)"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                      {lensUsage.current_period_end && (
                        <span className="text-xs text-muted-foreground">
                          Renews{" "}
                          {new Date(lensUsage.current_period_end).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">
                      Usage: {lensUsage.monthly_analyses}/{lensUsage.analysis_limit || 200} analyses this month
                    </span>
                    <span className="font-semibold text-foreground">{usagePercent}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    variant="outline"
                    className="font-semibold"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                  <Button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    variant="outline"
                    className="font-semibold text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 text-center">
                <Sparkles className="h-8 w-8 text-cyan-600 mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">You&apos;re not subscribed to P2V Lens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI Photo Coach, Design Studio, Description Writer, Virtual Staging, and more — all in one subscription.
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  <Link href="/lens">Subscribe to P2V Lens</Link>
                </Button>
              </div>
            )}
          </div>

          {/* ═══ SECTION 3: BILLING HISTORY ═══ */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Billing History</h2>
            </div>

            {charges.length === 0 && !billingLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No billing history found.</p>
            ) : (
              <div className="space-y-2">
                {charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {charge.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(charge.created)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-foreground">
                        ${charge.amount.toFixed(2)}
                      </span>
                      {charge.receipt_url && (
                        <a
                          href={charge.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {billingHasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const last = charges[charges.length - 1];
                      if (last) fetchBillingHistory(last.id);
                    }}
                    disabled={billingLoading}
                    className="w-full mt-2"
                  >
                    {billingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Load More
                  </Button>
                )}
              </div>
            )}

            {billingLoading && charges.length === 0 && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* ═══ SECTION 4: SAVED ASSETS ═══ */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Saved Assets</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              These are used in the Design Studio and auto-populate when you create new designs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Headshot */}
              <div className="space-y-2">
                <Label className="font-semibold">Headshot</Label>
                {headshotUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={headshotUrl}
                      alt="Headshot"
                      className="h-24 w-24 rounded-lg object-cover border border-border"
                    />
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => headshotInputRef.current?.click()}
                        className="text-xs"
                      >
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearAsset("headshot")}
                        className="text-xs text-red-600 border-red-200"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => headshotInputRef.current?.click()}
                    className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    {assetUploading === "headshot" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Upload</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={headshotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAsset(file, "headshot");
                  }}
                  className="hidden"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="font-semibold">Logo</Label>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-24 w-24 rounded-lg object-contain border border-border bg-white p-1"
                    />
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs"
                      >
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearAsset("logo")}
                        className="text-xs text-red-600 border-red-200"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    {assetUploading === "logo" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Upload</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAsset(file, "logo");
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 5: REFERRAL PROGRAM ═══ */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Referral Program</h2>
            </div>

            {referral ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Your Code</p>
                    <p className="font-bold text-foreground text-lg">{referral.code}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="font-bold text-foreground text-lg">
                      ${referral.total_earned?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-bold text-foreground text-lg">{referral.total_orders || 0}</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="font-semibold">
                  <Link href="/dashboard/referral-earnings">View Referral Dashboard</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  You don&apos;t have a referral code yet.
                </p>
                <Button asChild variant="outline" className="font-semibold">
                  <Link href="/dashboard/referral-earnings">Set Up Your Referral Code</Link>
                </Button>
              </div>
            )}
          </div>

          {/* ═══ SECTION 6: DANGER ZONE ═══ */}
          <div className="bg-card rounded-2xl border-2 border-red-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 font-semibold"
              >
                Delete Account
              </Button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-red-700">
                  Type DELETE to confirm permanent deletion of your account:
                </p>
                <Input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                  className="max-w-xs border-red-300"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteText !== "DELETE" || deleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Permanently Delete Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
