"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Sparkles,
  Lock,
  LogIn,
  X,
  Plus,
  Minus,
  Check,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  ShoppingCart,
  ImageIcon,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  ArrowRight,
  Home,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface SessionPhoto {
  url: string;
  room: string;
  score: number;
  feedback: string;
  fixable_issues: string[];
  flagged_issues: string[];
  approved: boolean;
  edited: boolean;
  edited_url: string | null;
  analyzed_at: string;
}

interface Session {
  id: string;
  property_address: string;
  status: string;
  photos: SessionPhoto[];
  checklist: Record<string, string>; // room_key -> "pending" | "next" | "done"
  total_analyses: number;
  approved_count: number;
  created_at: string;
}

interface ScoringResult {
  score: number;
  summary: string;
  fixable_issues: string[];
  flagged_issues: string[];
  what_would_make_10: string;
  approved: boolean;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const DEFAULT_ROOMS = [
  { key: "exterior_front", label: "Exterior Front", icon: "🏠" },
  { key: "exterior_back", label: "Exterior Back", icon: "🏡" },
  { key: "entry_foyer", label: "Entry / Foyer", icon: "🚪" },
  { key: "living_room", label: "Living Room", icon: "🛋️" },
  { key: "kitchen", label: "Kitchen", icon: "🍳" },
  { key: "dining_room", label: "Dining Room", icon: "🍽️" },
  { key: "master_bedroom", label: "Master Bedroom", icon: "🛏️" },
  { key: "master_bath", label: "Master Bath", icon: "🚿" },
  { key: "bedroom_2", label: "Bedroom 2", icon: "🛏️", countable: true, base: "bedroom", startAt: 2 },
  { key: "bedroom_3", label: "Bedroom 3", icon: "🛏️", countable: true, base: "bedroom", startAt: 3 },
  { key: "bathroom_2", label: "Bathroom 2", icon: "🚿", countable: true, base: "bathroom", startAt: 2 },
  { key: "laundry", label: "Laundry", icon: "🧺" },
  { key: "garage", label: "Garage", icon: "🚗" },
  { key: "backyard_pool", label: "Backyard / Pool", icon: "🏊" },
  { key: "special_features", label: "Special Features", icon: "✨" },
];

const FREE_APPROVED_LIMIT = 3;

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function PhotoCoachPage() {
  const supabase = createClient();

  // Auth
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [freeApprovedUsed, setFreeApprovedUsed] = useState(0);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Checklist
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistSetup, setChecklistSetup] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Record<string, string>>({});
  const [extraBedrooms, setExtraBedrooms] = useState(0);
  const [extraBathrooms, setExtraBathrooms] = useState(0);
  const [customRoom, setCustomRoom] = useState("");

  // Shooting
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ScoringResult | null>(null);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gallery view
  const [showGallery, setShowGallery] = useState(false);

  // Paywall
  const [paywallHit, setPaywallHit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const approvedSoundRef = useRef<HTMLAudioElement | null>(null);
  const perfectSoundRef = useRef<HTMLAudioElement | null>(null);

  /* ─── Auth & Subscription Check ─── */
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);

      if (!user) return;

      const admin = user.email === "realestatephoto2video@gmail.com";
      setIsAdmin(admin);

      if (admin) {
        setIsSubscriber(true);
        return;
      }

      // Check lens_usage for subscription + free trial count
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (usage) {
        setIsSubscriber(usage.is_subscriber);
        setFreeApprovedUsed(usage.free_analyses_used || 0);
      }
    };
    init();
  }, []);

  /* ─── Load Sessions ─── */
  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    const { data, error } = await supabase
      .from("lens_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setSessions(data as Session[]);
    }
    setLoadingSessions(false);
  };

  /* ─── Create Session ─── */
  const createSession = async () => {
    if (!newAddress.trim() || !user) return;

    const { data, error } = await supabase
      .from("lens_sessions")
      .insert({
        user_id: user.id,
        property_address: newAddress.trim(),
        photos: [],
        checklist: {},
      })
      .select()
      .single();

    if (data) {
      setActiveSession(data as Session);
      setSessions((prev) => [data as Session, ...prev]);
      setNewAddress("");
      setShowNewSession(false);
      setShowChecklist(true); // Prompt checklist on new session
      setChecklistSetup(false);
      setSelectedRooms({});
      setExtraBedrooms(0);
      setExtraBathrooms(0);
    }
  };

  const openSession = (session: Session) => {
    setActiveSession(session);
    setLastResult(null);
    setLastPhotoUrl(null);
    setShowGallery(false);
    setChecklistSetup(Object.keys(session.checklist || {}).length > 0);
    setSelectedRooms(session.checklist || {});
  };

  /* ─── Checklist ─── */
  const toggleRoom = (key: string) => {
    setSelectedRooms((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = "pending";
      }
      return next;
    });
  };

  const addCustomRoom = () => {
    if (!customRoom.trim()) return;
    const key = `custom_${customRoom.trim().toLowerCase().replace(/\s+/g, "_")}`;
    setSelectedRooms((prev) => ({ ...prev, [key]: "pending" }));
    setCustomRoom("");
  };

  const saveChecklist = async () => {
    // Add extra bedrooms/bathrooms
    const rooms = { ...selectedRooms };
    for (let i = 4; i < 4 + extraBedrooms; i++) {
      rooms[`bedroom_${i}`] = "pending";
    }
    for (let i = 3; i < 3 + extraBathrooms; i++) {
      rooms[`bathroom_${i}`] = "pending";
    }

    setSelectedRooms(rooms);
    setChecklistSetup(true);
    setShowChecklist(false);

    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: rooms })
        .eq("id", activeSession.id);
      setActiveSession((prev) => prev ? { ...prev, checklist: rooms } : prev);
    }
  };

  const skipChecklist = () => {
    setChecklistSetup(true);
    setShowChecklist(false);
  };

  const markRoomDone = async (key: string) => {
    const updated = { ...selectedRooms, [key]: selectedRooms[key] === "done" ? "pending" : "done" };
    setSelectedRooms(updated);
    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: updated })
        .eq("id", activeSession.id);
      setActiveSession((prev) => prev ? { ...prev, checklist: updated } : prev);
    }
  };

  const setRoomNext = async (key: string) => {
    // Clear previous "next", set this one
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(selectedRooms)) {
      updated[k] = v === "next" ? "pending" : v;
    }
    updated[key] = "next";
    setSelectedRooms(updated);
    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: updated })
        .eq("id", activeSession.id);
      setActiveSession((prev) => prev ? { ...prev, checklist: updated } : prev);
    }
  };

  /* ─── Get current "next" room label ─── */
  const getCurrentRoomLabel = () => {
    const nextKey = Object.entries(selectedRooms).find(([, v]) => v === "next")?.[0];
    if (!nextKey) return "";
    const room = DEFAULT_ROOMS.find((r) => r.key === nextKey);
    if (room) return room.label;
    // Custom room
    return nextKey.replace("custom_", "").replace(/_/g, " ");
  };

  /* ─── Photo Capture & Upload ─── */
  const handleCapture = () => {
    // Check paywall
    if (!isSubscriber && !isAdmin && freeApprovedUsed >= FREE_APPROVED_LIMIT) {
      setPaywallHit(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    e.target.value = "";

    setUploading(true);
    setLastResult(null);
    setLastPhotoUrl(null);

    try {
      // Upload to Cloudinary (same signed pattern as descriptions page)
      const sigResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "p2v-lens/coach" }),
      });
      const sigData = await sigResponse.json();
      if (!sigData.success) throw new Error("Signature failed");

      const { signature, timestamp, cloudName, apiKey, folder } = sigData.data;
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", timestamp.toString());
      uploadData.append("signature", signature);
      uploadData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: "POST", body: uploadData }
      );
      const uploadResult = await uploadRes.json();

      if (!uploadResult.secure_url) throw new Error("Upload failed");

      setLastPhotoUrl(uploadResult.secure_url);
      setUploading(false);
      setAnalyzing(true);

      // Call Coach API
      const coachRes = await fetch("/api/lens/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: uploadResult.secure_url,
          session_id: activeSession.id,
          user_id: user?.id,
        }),
      });

      const result: ScoringResult = await coachRes.json();

      if (!coachRes.ok) throw new Error(result.summary || "Analysis failed");

      setLastResult(result);

      // Play sound
      if (soundEnabled) {
        if (result.score === 10) {
          perfectSoundRef.current?.play().catch(() => {});
        } else if (result.approved) {
          approvedSoundRef.current?.play().catch(() => {});
        }
      }

      // If approved, save to session
      if (result.approved) {
        const roomLabel = getCurrentRoomLabel();
        const newPhoto: SessionPhoto = {
          url: uploadResult.secure_url,
          room: roomLabel,
          score: result.score,
          feedback: result.summary,
          fixable_issues: result.fixable_issues,
          flagged_issues: result.flagged_issues,
          approved: true,
          edited: false,
          edited_url: null,
          analyzed_at: new Date().toISOString(),
        };

        const updatedPhotos = [...(activeSession.photos || []), newPhoto];
        const updatedCount = (activeSession.approved_count || 0) + 1;
        const updatedTotal = (activeSession.total_analyses || 0) + 1;

        await supabase
          .from("lens_sessions")
          .update({
            photos: updatedPhotos,
            approved_count: updatedCount,
            total_analyses: updatedTotal,
          })
          .eq("id", activeSession.id);

        setActiveSession((prev) =>
          prev
            ? { ...prev, photos: updatedPhotos, approved_count: updatedCount, total_analyses: updatedTotal }
            : prev
        );

        // Update free trial usage
        if (!isSubscriber && !isAdmin) {
          const newUsed = freeApprovedUsed + 1;
          setFreeApprovedUsed(newUsed);
          await supabase
            .from("lens_usage")
            .upsert({
              user_id: user.id,
              free_analyses_used: newUsed,
              total_analyses: (activeSession.total_analyses || 0) + 1,
            }, { onConflict: "user_id" });
        }
      } else {
        // Not approved — update total_analyses only
        const updatedTotal = (activeSession.total_analyses || 0) + 1;
        await supabase
          .from("lens_sessions")
          .update({ total_analyses: updatedTotal })
          .eq("id", activeSession.id);
        setActiveSession((prev) =>
          prev ? { ...prev, total_analyses: updatedTotal } : prev
        );
      }
    } catch (err: any) {
      console.error("Photo Coach error:", err);
      setLastResult({
        score: 0,
        summary: err.message || "Failed to analyze photo. Please try again.",
        fixable_issues: [],
        flagged_issues: [],
        what_would_make_10: "",
        approved: false,
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  /* ─── Score Color ─── */
  const getScoreColor = (score: number) => {
    if (score >= 8) return "green";
    if (score >= 5) return "amber";
    return "red";
  };

  const getScoreLabel = (score: number) => {
    if (score === 10) return "Perfect Shot!";
    if (score >= 8) return "Good Shot!";
    if (score >= 5) return "Needs Improvement";
    return "Reshoot";
  };

  /* ─── Room label from key ─── */
  const roomLabel = (key: string) => {
    const room = DEFAULT_ROOMS.find((r) => r.key === key);
    if (room) return room.label;
    if (key.startsWith("bedroom_")) return `Bedroom ${key.split("_")[1]}`;
    if (key.startsWith("bathroom_")) return `Bathroom ${key.split("_")[1]}`;
    if (key.startsWith("custom_")) return key.replace("custom_", "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return key;
  };

  /* ═══════════════════════════════════════════
     RENDER — Auth Loading
     ═══════════════════════════════════════════ */
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

  /* ═══ Not Logged In ═══ */
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Sign In to Try AI Photo Coach
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create a free account to try the AI Photo Coach. Your first 3 approved photos are free — no subscription required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base">
                <Link href="/login?redirect=/dashboard/lens/coach">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-6 text-base">
                <Link href="/lens">Learn About P2V Lens</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Paywall ═══ */
  if (paywallHit) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="bg-card rounded-2xl border border-border p-10 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              You&apos;ve Used Your 3 Free Photos
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Subscribe to P2V Lens for unlimited AI photo coaching, plus listing descriptions, design studio, virtual staging, and more — starting at $27.95/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-base">
                <Link href="/lens">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Subscribe to P2V Lens
                </Link>
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 text-base"
                onClick={() => setPaywallHit(false)}
              >
                Back to Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — Session List (no active session)
     ═══════════════════════════════════════════ */
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        {/* Hidden audio elements for fun feedback */}
        <audio ref={approvedSoundRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" preload="auto" />
        <audio ref={perfectSoundRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" preload="auto" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/dashboard/lens" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                AI Photo Coach
              </h1>
              <p className="text-muted-foreground mt-1">
                Open a shoot session, snap photos, get instant AI scoring
              </p>
            </div>
          </div>

          {/* Free trial / subscription badge */}
          {isAdmin ? (
            <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
              <Star className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-semibold">Admin — Unlimited Access</p>
            </div>
          ) : isSubscriber ? (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-600 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-bold text-cyan-700">P2V Lens Subscriber</span> — Unlimited photo coaching
              </p>
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-bold">Free trial:</span> {FREE_APPROVED_LIMIT - freeApprovedUsed} of {FREE_APPROVED_LIMIT} approved photos remaining. Subscribe for unlimited access.
              </p>
            </div>
          )}

          {/* New Session */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Start a New Shoot</h2>
            {showNewSession ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Property Address</label>
                  <Input
                    placeholder="123 Main St, City, State"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createSession()}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={createSession}
                    disabled={!newAddress.trim()}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Shoot
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewSession(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowNewSession(true)}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-6 text-base w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Shoot Session
              </Button>
            )}
          </div>

          {/* Existing Sessions */}
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-1.5 bg-accent rounded-full" />
                <h2 className="text-xl font-bold text-foreground">Your Sessions</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => openSession(session)}
                    className="text-left bg-card rounded-xl border border-border p-5 space-y-2 hover:border-accent/40 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-accent" />
                        <h3 className="font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                          {session.property_address}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        session.status === "active"
                          ? "bg-green-100 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {session.status === "active" ? "Active" : session.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.approved_count || 0} approved photo{(session.approved_count || 0) !== 1 ? "s" : ""} · {session.total_analyses || 0} total analyzed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No shoot sessions yet. Start your first one above!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — Active Session (shooting mode)
     ═══════════════════════════════════════════ */

  const approvedPhotos = (activeSession.photos || []).filter((p) => p.approved);
  const nextRoom = Object.entries(selectedRooms).find(([, v]) => v === "next");
  const checklistEntries = Object.entries(selectedRooms);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hidden audio — we use simple Web Audio beeps since we can't host files */}
      <audio ref={approvedSoundRef} preload="auto" />
      <audio ref={perfectSoundRef} preload="auto" />

      {/* Hidden file input — camera on mobile, gallery fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveSession(null);
                setLastResult(null);
                setLastPhotoUrl(null);
                setShowGallery(false);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground line-clamp-1">
                {activeSession.property_address}
              </h1>
              <p className="text-sm text-muted-foreground">
                {approvedPhotos.length} approved · {activeSession.total_analyses || 0} analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => setShowGallery(!showGallery)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                showGallery
                  ? "bg-accent/10 border-accent text-accent"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Gallery ({approvedPhotos.length})
            </button>
          </div>
        </div>

        {/* Free trial indicator */}
        {!isSubscriber && !isAdmin && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-xs text-foreground">
              <span className="font-bold">Free trial:</span> {FREE_APPROVED_LIMIT - freeApprovedUsed} approved photo{FREE_APPROVED_LIMIT - freeApprovedUsed !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}

        {/* ─── Checklist Setup Modal ─── */}
        {showChecklist && !checklistSetup && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Property Checklist</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select the rooms you need to photograph so you don&apos;t miss a shot. You can skip this.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {DEFAULT_ROOMS.filter((r) => !r.countable).map((room) => (
                <button
                  key={room.key}
                  onClick={() => toggleRoom(room.key)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    selectedRooms[room.key]
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-border hover:border-accent/30"
                  }`}
                >
                  <span className="mr-1.5">{room.icon}</span> {room.label}
                </button>
              ))}
            </div>

            {/* Extra bedrooms/bathrooms */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Extra Bedrooms:</span>
                <button
                  onClick={() => setExtraBedrooms(Math.max(0, extraBedrooms - 1))}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-4 text-center">{extraBedrooms}</span>
                <button
                  onClick={() => setExtraBedrooms(extraBedrooms + 1)}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Extra Bathrooms:</span>
                <button
                  onClick={() => setExtraBathrooms(Math.max(0, extraBathrooms - 1))}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-4 text-center">{extraBathrooms}</span>
                <button
                  onClick={() => setExtraBathrooms(extraBathrooms + 1)}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Custom room */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Add other room..."
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomRoom()}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={addCustomRoom} disabled={!customRoom.trim()} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveChecklist}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Checklist
              </Button>
              <Button variant="outline" onClick={skipChecklist}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* ─── Checklist Bar (during shooting) ─── */}
        {checklistSetup && checklistEntries.length > 0 && !showGallery && (
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                📋 Checklist — {checklistEntries.filter(([, v]) => v === "done").length}/{checklistEntries.length} done
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showChecklist ? "rotate-180" : ""}`} />
            </button>
            {showChecklist && (
              <div className="mt-3 space-y-1.5">
                {checklistEntries.map(([key, status]) => (
                  <div key={key} className="flex items-center gap-2">
                    <button
                      onClick={() => markRoomDone(key)}
                      className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        status === "done"
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      {status === "done" && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`text-sm flex-1 ${status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {roomLabel(key)}
                    </span>
                    {status !== "done" && (
                      <button
                        onClick={() => setRoomNext(key)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          status === "next"
                            ? "bg-accent text-accent-foreground border-accent font-bold"
                            : "border-border text-muted-foreground hover:border-accent/40"
                        }`}
                      >
                        {status === "next" ? "Shooting" : "Next"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Gallery View ─── */}
        {showGallery ? (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Approved Photos ({approvedPhotos.length})
                </h2>
              </div>

              {approvedPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No approved photos yet. Start shooting!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {approvedPhotos.map((photo, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                      <div className="aspect-[4/3] relative">
                        <img
                          src={photo.edited_url || photo.url}
                          alt={photo.room || `Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {photo.score}/10
                        </div>
                      </div>
                      {photo.room && (
                        <div className="px-2 py-1.5 bg-card">
                          <p className="text-xs font-semibold text-foreground truncate">{photo.room}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery Actions */}
            {approvedPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/order"
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  <ShoppingCart className="h-5 w-5 flex-shrink-0" />
                  Order Video ({approvedPhotos.length})
                </Link>
                <Link
                  href={`/dashboard/lens/descriptions?from_coach=${activeSession.id}`}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  Write Description
                </Link>
                <button
                  onClick={() => {
                    // Open each photo URL in a new tab for download
                    // (zip would require server-side — this is the simple approach)
                    approvedPhotos.forEach((photo, i) => {
                      const url = photo.edited_url || photo.url;
                      const a = document.createElement("a");
                      a.href = url;
                      a.target = "_blank";
                      a.download = `${activeSession.property_address.replace(/[^a-zA-Z0-9]/g, "_")}_${photo.room || i + 1}.jpg`;
                      a.rel = "noopener noreferrer";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    });
                  }}
                  className="bg-card border border-border hover:border-accent/40 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-foreground text-sm sm:text-base"
                >
                  <Download className="h-5 w-5 flex-shrink-0" />
                  Download All
                </button>
                <button
                  onClick={() => setShowGallery(false)}
                  className="bg-card border border-border hover:border-accent/40 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-foreground text-sm sm:text-base"
                >
                  <Camera className="h-5 w-5 flex-shrink-0" />
                  Continue Shooting
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ─── Shooting View ─── */
          <div className="space-y-6">
            {/* Current room indicator */}
            {nextRoom && (
              <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Camera className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-accent">
                  Shooting: {roomLabel(nextRoom[0])}
                </p>
              </div>
            )}

            {/* Take Photo Button */}
            <div className="text-center">
              <button
                onClick={handleCapture}
                disabled={uploading || analyzing}
                className="relative inline-flex items-center justify-center h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading || analyzing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Camera className="h-10 w-10" />
                )}
              </button>
              <p className="text-sm text-muted-foreground mt-3">
                {uploading ? "Uploading..." : analyzing ? "AI is analyzing your photo..." : "Tap to take a photo"}
              </p>
              {/* Gallery option as secondary */}
              {!uploading && !analyzing && (
                <button
                  onClick={() => {
                    // Remove capture attribute temporarily for gallery access
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                      // Restore capture attribute after
                      setTimeout(() => {
                        fileInputRef.current?.setAttribute("capture", "environment");
                      }, 1000);
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 underline"
                >
                  or choose from gallery
                </button>
              )}
            </div>

            {/* ─── Scoring Result ─── */}
            {lastResult && lastResult.score > 0 && (
              <div
                className={`rounded-2xl border-2 p-6 space-y-4 transition-all ${
                  lastResult.approved
                    ? lastResult.score === 10
                      ? "bg-green-50 border-green-400 dark:bg-green-950/20 dark:border-green-600"
                      : "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-700"
                    : lastResult.score >= 5
                    ? "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-600"
                    : "bg-red-50 border-red-300 dark:bg-red-950/20 dark:border-red-600"
                }`}
                style={{ userSelect: "none" }}
              >
                {/* Score header */}
                <div className="flex items-center gap-4">
                  <div
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl ${
                      lastResult.approved
                        ? "bg-green-500"
                        : lastResult.score >= 5
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  >
                    {lastResult.score}
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold ${
                      lastResult.approved
                        ? "text-green-700 dark:text-green-400"
                        : lastResult.score >= 5
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"
                    }`}>
                      {getScoreLabel(lastResult.score)}
                    </h3>
                    <p className="text-sm text-muted-foreground">{lastResult.summary}</p>
                  </div>
                </div>

                {/* Photo preview with watermark overlay */}
                {lastPhotoUrl && (
                  <div className="relative rounded-xl overflow-hidden" style={{ pointerEvents: "none" }}>
                    <img
                      src={lastPhotoUrl}
                      alt="Analyzed photo"
                      className="w-full max-h-64 object-contain bg-black/5 rounded-xl"
                    />
                    {/* Light watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <span className="text-4xl font-black text-black rotate-[-20deg]">P2V LENS</span>
                    </div>
                  </div>
                )}

                {/* Fixable issues */}
                {lastResult.fixable_issues.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">
                      {lastResult.approved ? "What would make it better:" : "Fix these before reshooting:"}
                    </p>
                    <div className="space-y-1.5">
                      {lastResult.fixable_issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                            lastResult.approved ? "text-green-600" : "text-amber-500"
                          }`} />
                          <span className="text-foreground">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flagged issues (non-penalized) */}
                {lastResult.flagged_issues.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-foreground mb-2">Noted for AI Editing:</p>
                    <div className="space-y-1.5">
                      {lastResult.flagged_issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                          <span className="text-muted-foreground">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What would make it a 10 */}
                {lastResult.approved && lastResult.what_would_make_10 && lastResult.score < 10 && (
                  <div className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
                    <p className="text-sm">
                      <span className="font-bold text-foreground">To get a 10: </span>
                      <span className="text-muted-foreground">{lastResult.what_would_make_10}</span>
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  {lastResult.approved ? (
                    <>
                      <Button
                        onClick={handleCapture}
                        className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Next Photo
                      </Button>
                      <Button
                        onClick={() => setShowGallery(true)}
                        variant="outline"
                        className="flex-1"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        View Gallery
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={async () => {
                          // User chose to reshoot — delete the photo from Cloudinary
                          if (lastPhotoUrl) {
                            fetch("/api/lens/coach", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ photo_url: lastPhotoUrl }),
                            }).catch(() => {});
                          }
                          setLastResult(null);
                          setLastPhotoUrl(null);
                          handleCapture();
                        }}
                        className={`flex-1 font-bold text-white ${
                          lastResult.score >= 5
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reshoot
                      </Button>
                      <Button
                        onClick={async () => {
                          // User chose to keep the photo anyway — add to gallery
                          if (!activeSession || !lastPhotoUrl) return;
                          const roomLbl = getCurrentRoomLabel();
                          const newPhoto: SessionPhoto = {
                            url: lastPhotoUrl,
                            room: roomLbl,
                            score: lastResult.score,
                            feedback: lastResult.summary,
                            fixable_issues: lastResult.fixable_issues,
                            flagged_issues: lastResult.flagged_issues,
                            approved: true, // User accepted it
                            edited: false,
                            edited_url: null,
                            analyzed_at: new Date().toISOString(),
                          };
                          const updatedPhotos = [...(activeSession.photos || []), newPhoto];
                          const updatedCount = (activeSession.approved_count || 0) + 1;
                          await supabase
                            .from("lens_sessions")
                            .update({
                              photos: updatedPhotos,
                              approved_count: updatedCount,
                            })
                            .eq("id", activeSession.id);
                          setActiveSession((prev) =>
                            prev ? { ...prev, photos: updatedPhotos, approved_count: updatedCount } : prev
                          );
                          // Count against free trial
                          if (!isSubscriber && !isAdmin) {
                            const newUsed = freeApprovedUsed + 1;
                            setFreeApprovedUsed(newUsed);
                            await supabase
                              .from("lens_usage")
                              .upsert({
                                user_id: user.id,
                                free_analyses_used: newUsed,
                                total_analyses: (activeSession.total_analyses || 0),
                              }, { onConflict: "user_id" });
                          }
                          setLastResult(null);
                          setLastPhotoUrl(null);
                        }}
                        variant="outline"
                        className="flex-1 font-bold"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Keep Anyway
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error state */}
            {lastResult && lastResult.score === 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-400">{lastResult.summary}</p>
                  <button
                    onClick={handleCapture}
                    className="text-sm font-semibold text-red-600 hover:text-red-800 mt-1 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Recent approved in this session (mini gallery) */}
            {approvedPhotos.length > 0 && !lastResult && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-foreground">Recent Approved</p>
                  <button
                    onClick={() => setShowGallery(true)}
                    className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {approvedPhotos.slice(-5).map((photo, i) => (
                    <div key={i} className="flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border border-border">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
