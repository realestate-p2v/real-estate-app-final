"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell, useAccent } from "@/components/dashboard-shell";
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
  ShoppingCart,
  ImageIcon,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  Home,
  Star,
  Wand2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GateOverlay } from "@/components/gate-overlay";
import { SpinWheel } from "@/components/spin-wheel";
import * as exifr from "exifr";

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

interface CategoryScore {
  name: string;
  score: number;
  max: number;
  note: string;
}

interface ScoringResult {
  score: number;
  room_type: string;
  categories: CategoryScore[];
  summary: string;
  feedback: string[];
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
  { key: "bedroom_2", label: "Bedroom 2", icon: "🛏️" },
  { key: "bedroom_3", label: "Bedroom 3", icon: "🛏️" },
  { key: "bathroom_2", label: "Bathroom 2", icon: "🚿" },
  { key: "laundry", label: "Laundry", icon: "🧺" },
  { key: "garage", label: "Garage", icon: "🚗" },
  { key: "backyard_pool", label: "Backyard / Pool", icon: "🏊" },
  { key: "special_features", label: "Special Features", icon: "✨" },
];

const FREE_APPROVED_LIMIT = 3;

const SURPRISE_SEGMENTS = [
  { value: 5,  label: "5%\nOFF",  color: "#3b82f6", angle: 70 },
  { value: 8,  label: "8%\nOFF",  color: "#8b5cf6", angle: 55 },
  { value: 5,  label: "5%\nOFF",  color: "#06b6d4", angle: 70 },
  { value: 10, label: "10%\nOFF", color: "#f59e0b", angle: 40 },
  { value: 5,  label: "5%\nOFF",  color: "#22c55e", angle: 70 },
  { value: 8,  label: "8%\nOFF",  color: "#ec4899", angle: 55 },
];

/* ═══════════════════════════════════════════
   DARK-THEMED LOCAL PRIMITIVES
   ═══════════════════════════════════════════ */

function DarkInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/[0.2] focus:bg-white/[0.06] focus:outline-none transition-colors ${className}`}
    />
  );
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function PhotoCoachPage() {
  return (
    <Suspense>
      <DashboardShell accent="blue" maxWidth="4xl">
        <PhotoCoachInner />
      </DashboardShell>
    </Suspense>
  );
}

function PhotoCoachInner() {
  const a = useAccent();
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Auth
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [freeApprovedUsed, setFreeApprovedUsed] = useState(0);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
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
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [shootingRoom, setShootingRoom] = useState<string>("");
  const [addOtherRoom, setAddOtherRoom] = useState("");
  const [showAiEdit, setShowAiEdit] = useState(false);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);

  // HDR detection
  const [hdrDetected, setHdrDetected] = useState<boolean | null>(null);
  const [hdrBannerDismissed, setHdrBannerDismissed] = useState(false);
  const [showHdrHelp, setShowHdrHelp] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Gallery view
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryEditUrl, setGalleryEditUrl] = useState<string | null>(null);

  // Paywall
  const [paywallHit, setPaywallHit] = useState(false);

  // Access gating
  const [showGate, setShowGate] = useState(false);
  const [gateType, setGateType] = useState<"buy_video" | "subscribe" | "upgrade_pro">("buy_video");
  const [hasPaidOrder, setHasPaidOrder] = useState(false);

  // Surprise discount wheel
  const [showSurpriseWheel, setShowSurpriseWheel] = useState(false);
  const [surprisePromoCode, setSurprisePromoCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Pre-fill address from URL params ─── */
  useEffect(() => {
    const addr = searchParams.get("address");
    if (addr) {
      const city = searchParams.get("city") || "";
      const state = searchParams.get("state") || "";
      const parts = [addr, city, state].filter(Boolean).join(", ");
      setNewAddress(parts);
      setShowNewSession(true);
    }
  }, [searchParams]);

  /* ─── Sound Effects via Web Audio API ─── */
  const playApprovedSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, [soundEnabled]);

  const playPerfectSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [1047, 1319, 1568];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const startTime = ctx.currentTime + i * 0.15;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {}
  }, [soundEnabled]);

  /* ─── Auth & Subscription Check ─── */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;
      setUser(authUser);
      setAuthLoading(false);

      if (!authUser) return;

      const admin = authUser.email === "realestatephoto2video@gmail.com";
      setIsAdmin(admin);

      if (admin) {
        setIsSubscriber(true);
        return;
      }

      const [usageResult, orderResult] = await Promise.all([
        supabase
          .from("lens_usage")
          .select("is_subscriber, subscription_tier, trial_expires_at, free_analyses_used")
          .eq("user_id", authUser.id)
          .single(),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id)
          .eq("payment_status", "paid"),
      ]);

      const usage = usageResult.data;
      const hasPaid = (orderResult.count || 0) > 0;
      setHasPaidOrder(hasPaid);

      if (usage) {
        const isSub = usage.is_subscriber;
        const hasActiveTrial = usage.trial_expires_at && new Date(usage.trial_expires_at) > new Date();
        setIsSubscriber(isSub || hasActiveTrial);
        setFreeApprovedUsed(usage.free_analyses_used || 0);

        if (!isSub && !hasActiveTrial) {
          setGateType(hasPaid ? "subscribe" : "buy_video");
        }
      } else {
        setGateType(hasPaid ? "subscribe" : "buy_video");
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
    const { data } = await supabase
      .from("lens_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setSessions(data);
    setLoadingSessions(false);
  };

  /* ─── Create Session ─── */
  const createSession = async () => {
    if (!newAddress.trim() || !user) return;

    if (!isSubscriber && !isAdmin) {
      setShowGate(true);
      return;
    }

    const { data } = await supabase
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
      setActiveSession(data);
      setSessions((prev) => [data, ...prev]);
      setNewAddress("");
      setShowNewSession(false);
      setShowChecklist(true);
      setChecklistSetup(false);
      setSelectedRooms({});
      setExtraBedrooms(0);
      setExtraBathrooms(0);
    }
  };

  const openSession = (session: any) => {
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
    const rooms = { ...selectedRooms };

    const existingBedroomNums = Object.keys(rooms)
      .filter(k => k.startsWith("bedroom_"))
      .map(k => parseInt(k.split("_")[1]) || 0);
    const highestBedroom = existingBedroomNums.length > 0 ? Math.max(...existingBedroomNums) : 3;
    const startBedroom = rooms["master_bedroom"] ? Math.max(highestBedroom + 1, 4) : Math.max(highestBedroom + 1, 2);

    for (let i = 0; i < extraBedrooms; i++) {
      rooms[`bedroom_${startBedroom + i}`] = "pending";
    }

    const existingBathroomNums = Object.keys(rooms)
      .filter(k => k.startsWith("bathroom_"))
      .map(k => parseInt(k.split("_")[1]) || 0);
    const highestBathroom = existingBathroomNums.length > 0 ? Math.max(...existingBathroomNums) : 1;
    const startBathroom = rooms["master_bath"] ? Math.max(highestBathroom + 1, 3) : Math.max(highestBathroom + 1, 2);

    for (let i = 0; i < extraBathrooms; i++) {
      rooms[`bathroom_${startBathroom + i}`] = "pending";
    }

    setSelectedRooms(rooms);
    setChecklistSetup(true);
    setShowChecklist(false);

    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: rooms })
        .eq("id", activeSession.id);
      setActiveSession((prev: any) => prev ? { ...prev, checklist: rooms } : prev);
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
      setActiveSession((prev: any) => prev ? { ...prev, checklist: updated } : prev);
    }
  };

  const setRoomNext = async (key: string) => {
    const updated: Record<string, string> = {};
    const isAlreadyNext = selectedRooms[key] === "next";
    for (const [k, v] of Object.entries(selectedRooms)) {
      updated[k] = v === "next" ? "pending" : v;
    }
    if (!isAlreadyNext) {
      updated[key] = "next";
    }
    setSelectedRooms(updated);
    if (isAlreadyNext) {
      setShootingRoom("");
    }
    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: updated })
        .eq("id", activeSession.id);
      setActiveSession((prev: any) => prev ? { ...prev, checklist: updated } : prev);
    }
  };

  const getCurrentRoomLabel = () => {
    if (!shootingRoom) return "";
    const room = DEFAULT_ROOMS.find((r) => r.key === shootingRoom);
    if (room) return room.label;
    if (shootingRoom.startsWith("bedroom_")) return `Bedroom ${shootingRoom.split("_")[1]}`;
    if (shootingRoom.startsWith("bathroom_")) return `Bathroom ${shootingRoom.split("_")[1]}`;
    return shootingRoom.replace("custom_", "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  /* ─── Photo Capture & Upload ─── */
  const handleCapture = () => {
    if (!isSubscriber && !isAdmin && freeApprovedUsed >= FREE_APPROVED_LIMIT) {
      setPaywallHit(true);
      return;
    }
    const hasChecklist = checklistSetup && Object.keys(selectedRooms).length > 0;
    if (hasChecklist) {
      setShowRoomPicker(true);
      return;
    }
    setShootingRoom("");
    fileInputRef.current?.click();
  };

  const proceedWithRoom = (roomKey: string) => {
    setShootingRoom(roomKey);
    setShowRoomPicker(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const addOtherAndShoot = async () => {
    if (!addOtherRoom.trim()) return;
    const key = `custom_${addOtherRoom.trim().toLowerCase().replace(/\s+/g, "_")}`;
    const updated = { ...selectedRooms, [key]: "pending" };
    setSelectedRooms(updated);
    setAddOtherRoom("");
    if (activeSession) {
      await supabase
        .from("lens_sessions")
        .update({ checklist: updated })
        .eq("id", activeSession.id);
      setActiveSession((prev: any) => prev ? { ...prev, checklist: updated } : prev);
    }
    proceedWithRoom(key);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    e.target.value = "";

    if (!isSubscriber && !isAdmin) {
      setShowGate(true);
      return;
    }

    setUploading(true);
    setLastResult(null);
    setLastPhotoUrl(null);
    setShowAiEdit(false);
    setEditedPreviewUrl(null);

    try {
      if (hdrDetected === null) {
        const isHdr = await checkHdr(file);
        setHdrDetected(isHdr);
      }

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

      const coachRes = await fetch("/api/lens/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: uploadResult.secure_url,
          session_id: activeSession.id,
          user_id: user?.id,
          hdr_detected: hdrDetected,
        }),
      });

      const result = await coachRes.json();

      if (!coachRes.ok) throw new Error(result.summary || "Analysis failed");

      setLastResult(result);

      if (result.surprise && isSubscriber) {
        setShowSurpriseWheel(true);
      }

      if (result.score === 10) {
        playPerfectSound();
      } else if (result.approved) {
        playApprovedSound();
      }

      if (!result.approved) {
        const updatedTotal = (activeSession.total_analyses || 0) + 1;
        await supabase
          .from("lens_sessions")
          .update({ total_analyses: updatedTotal })
          .eq("id", activeSession.id);
        setActiveSession((prev: any) =>
          prev ? { ...prev, total_analyses: updatedTotal } : prev
        );
      }
    } catch (err: any) {
      console.error("Photo Coach error:", err);
      setLastResult({
        score: 0,
        room_type: "",
        categories: [],
        summary: err.message || "Failed to analyze photo. Please try again.",
        feedback: [],
        flagged_issues: [],
        what_would_make_10: "",
        approved: false,
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score === 10) return "Perfect Shot!";
    if (score >= 8) return "Good Shot!";
    if (score >= 5) return "Needs Improvement";
    return "Reshoot";
  };

  const checkHdr = async (file: File): Promise<boolean> => {
    try {
      const basicExif = await exifr.parse(file, {
        pick: ["Make", "Model", "CustomRendered"],
        makerNote: false,
        translateValues: false,
      });

      if (basicExif) {
        const make = String(basicExif.Make || "").toLowerCase();
        const model = String(basicExif.Model || "").toLowerCase();

        if (make.includes("apple") && model.includes("iphone")) {
          const modelMatch = model.match(/iphone\s*(\d+)/);
          if (modelMatch) {
            const modelNum = parseInt(modelMatch[1]);
            if (modelNum >= 12) return true;
          }
        }

        if (make.includes("google")) return true;

        if (basicExif.CustomRendered && (basicExif.CustomRendered === 3 || basicExif.CustomRendered === 4 || String(basicExif.CustomRendered).toLowerCase().includes("hdr"))) {
          return true;
        }
      }

      const fullExif = await exifr.parse(file, {
        makerNote: true,
        translateValues: false,
      });

      if (fullExif) {
        const allKeys = Object.keys(fullExif);
        for (const key of allKeys) {
          const keyLower = key.toLowerCase();
          const valStr = String(fullExif[key]).toLowerCase();
          if (keyLower.includes("hdr") || valStr.includes("hdr") || valStr.includes("rich tone")) {
            return true;
          }
        }
      }

      return false;
    } catch (e) {
      return true;
    }
  };

  const getEditedUrl = (originalUrl: string) => {
    if (!originalUrl.includes("/upload/")) return originalUrl;
    return originalUrl.replace(
      "/upload/",
      "/upload/e_auto_brightness/e_auto_color/e_auto_contrast/e_improve/"
    );
  };

  const handleAiEdit = () => {
    if (!lastPhotoUrl) return;
    const edited = getEditedUrl(lastPhotoUrl);
    setEditedPreviewUrl(edited);
    setShowAiEdit(true);
  };

  const savePhotoToGallery = async (url: string, editedUrl: string | null) => {
    if (!activeSession || !lastResult) return;
    const roomLbl = getCurrentRoomLabel();
    const newPhoto: SessionPhoto = {
      url: lastPhotoUrl!,
      room: roomLbl,
      score: lastResult.score,
      feedback: lastResult.summary,
      fixable_issues: lastResult.feedback,
      flagged_issues: lastResult.flagged_issues,
      approved: true,
      edited: !!editedUrl,
      edited_url: editedUrl,
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

    setActiveSession((prev: any) =>
      prev
        ? { ...prev, photos: updatedPhotos, approved_count: updatedCount, total_analyses: updatedTotal }
        : prev
    );

    if (shootingRoom && selectedRooms[shootingRoom]) {
      const updatedChecklist = { ...selectedRooms, [shootingRoom]: "done" };
      setSelectedRooms(updatedChecklist);
      await supabase
        .from("lens_sessions")
        .update({ checklist: updatedChecklist })
        .eq("id", activeSession.id);
      setActiveSession((prev: any) => prev ? { ...prev, checklist: updatedChecklist } : prev);
    }

    if (!isSubscriber && !isAdmin) {
      const newUsed = freeApprovedUsed + 1;
      setFreeApprovedUsed(newUsed);
      await supabase
        .from("lens_usage")
        .upsert({
          user_id: user.id,
          free_analyses_used: newUsed,
          total_analyses: updatedTotal,
        }, { onConflict: "user_id" });
    }

    setLastResult(null);
    setLastPhotoUrl(null);
    setShowAiEdit(false);
    setEditedPreviewUrl(null);
  };

  const handleGalleryAiEdit = (index: number) => {
    const photos = activeSession?.photos || [];
    const photo = photos[index];
    if (!photo) return;
    const edited = getEditedUrl(photo.url);
    setGalleryEditUrl(edited);
  };

  const applyGalleryEdit = async (index: number, useEdited: boolean) => {
    if (!activeSession) return;
    const photos = [...(activeSession.photos || [])];
    if (useEdited && galleryEditUrl) {
      photos[index] = { ...photos[index], edited: true, edited_url: galleryEditUrl };
    }
    await supabase
      .from("lens_sessions")
      .update({ photos })
      .eq("id", activeSession.id);
    setActiveSession((prev: any) => prev ? { ...prev, photos } : prev);
    setGalleryEditUrl(null);
    setSelectedPhotoIndex(null);
  };

  const deleteGalleryPhoto = async (index: number) => {
    if (!activeSession) return;
    const photos = [...(activeSession.photos || [])];
    const removed = photos.splice(index, 1)[0];
    const updatedCount = Math.max(0, (activeSession.approved_count || 0) - 1);

    await supabase
      .from("lens_sessions")
      .update({ photos, approved_count: updatedCount })
      .eq("id", activeSession.id);
    setActiveSession((prev: any) =>
      prev ? { ...prev, photos, approved_count: updatedCount } : prev
    );

    if (removed?.url) {
      fetch("/api/lens/coach", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: removed.url }),
      }).catch(() => {});
    }

    setSelectedPhotoIndex(null);
    setGalleryEditUrl(null);
  };

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
      <div className="flex items-center justify-center py-32">
        <Loader2 className={`h-8 w-8 animate-spin ${a.text}`} />
      </div>
    );
  }

  /* ═══ Not Logged In ═══ */
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 space-y-5 backdrop-blur-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] flex items-center justify-center">
            <LogIn className="h-8 w-8 text-white/50" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Sign In to Try AI Photo Coach</h1>
          <p className="text-white/60 max-w-md mx-auto">
            Create a free account to try the AI Photo Coach. Your first 3 approved photos are free — no subscription required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-black px-8 py-6 text-base shadow-lg ${a.btnShadow}`}>
              <Link href="/login?redirect=/dashboard/lens/coach">
                <LogIn className="mr-2 h-4 w-4" />Sign In
              </Link>
            </Button>
            <Button asChild className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-8 py-6 text-base">
              <Link href="/lens">Learn About P2V Lens</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Paywall ═══ */
  if (paywallHit) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-10 space-y-5 backdrop-blur-sm">
          <div className={`mx-auto h-16 w-16 rounded-2xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center`}>
            <Lock className={`h-8 w-8 ${a.text}`} />
          </div>
          <h1 className="text-2xl font-extrabold text-white">You&apos;ve Used Your 3 Free Photos</h1>
          <p className="text-white/60 max-w-md mx-auto">
            Subscribe to P2V Lens for unlimited AI photo coaching, plus listing descriptions, design studio, virtual staging, and more — starting at $27.95/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className={`${a.btnBg} ${a.btnBgHover} text-white font-black px-8 py-6 text-base shadow-lg ${a.btnShadow}`}>
              <Link href="/lens">
                <Sparkles className="mr-2 h-4 w-4" />Subscribe to P2V Lens
              </Link>
            </Button>
            <Button
              className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold px-8 py-6 text-base"
              onClick={() => setPaywallHit(false)}
            >
              Back to Session
            </Button>
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
      <>
        {/* Header */}
        <div className="mc-animate flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Photo Coach</h1>
            <p className="text-white/50 mt-1">Open a shoot session, snap photos, get instant AI scoring</p>
          </div>
        </div>

        {/* Status badge */}
        {isAdmin ? (
          <div className="mc-animate rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 mb-8 flex items-center gap-3" style={{ animationDelay: "0.05s" }}>
            <Star className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300 font-semibold">Admin — Unlimited Access</p>
          </div>
        ) : isSubscriber ? (
          <div className={`mc-animate rounded-xl border ${a.border} ${a.bg} px-4 py-3 mb-8 flex items-center gap-3`} style={{ animationDelay: "0.05s" }}>
            <Sparkles className={`h-5 w-5 ${a.text} flex-shrink-0`} />
            <p className="text-sm text-white/80">
              <span className={`font-bold ${a.textLight}`}>P2V Lens Subscriber</span> — Unlimited photo coaching
            </p>
          </div>
        ) : (
          <div className={`mc-animate rounded-xl border ${a.border} ${a.bg} px-4 py-3 mb-8 flex items-center gap-3`} style={{ animationDelay: "0.05s" }}>
            <Sparkles className={`h-5 w-5 ${a.text} flex-shrink-0`} />
            <p className="text-sm text-white/80">
              <span className="font-bold text-white">Free trial:</span> {FREE_APPROVED_LIMIT - freeApprovedUsed} of {FREE_APPROVED_LIMIT} approved photos remaining. Subscribe for unlimited access.
            </p>
          </div>
        )}

        {/* New Session */}
        <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 mb-8 backdrop-blur-sm" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-bold text-white mb-4">Start a New Shoot</h2>
          {showNewSession ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1.5 block uppercase tracking-wider">Property Address</label>
                <DarkInput
                  placeholder="123 Main St, City, State"
                  value={newAddress}
                  onChange={setNewAddress}
                  onKeyDown={(e) => e.key === "Enter" && createSession()}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createSession}
                  disabled={!newAddress.trim()}
                  className={`${a.btnBg} ${a.btnBgHover} text-white font-bold`}
                >
                  <Camera className="h-4 w-4 mr-2" />Start Shoot
                </Button>
                <Button
                  onClick={() => setShowNewSession(false)}
                  className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowNewSession(true)}
              className={`${a.btnBg} ${a.btnBgHover} text-white font-bold py-6 text-base w-full sm:w-auto`}
            >
              <Plus className="h-5 w-5 mr-2" />New Shoot Session
            </Button>
          )}
        </div>

        {/* Existing Sessions */}
        {loadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : sessions.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-8 w-1.5 ${a.btnBg} rounded-full`} />
              <h2 className="text-xl font-bold text-white">Your Sessions</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {sessions.map((session: any, i: number) => (
                <button
                  key={session.id}
                  onClick={() => openSession(session)}
                  className="mc-chip-animate text-left rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-2 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 group backdrop-blur-sm"
                  style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Home className={`h-4 w-4 ${a.text}`} />
                      <h3 className={`font-bold text-white group-hover:${a.textLight} transition-colors line-clamp-1`}>
                        {session.property_address}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      session.status === "active"
                        ? "bg-green-400/20 text-green-300"
                        : "bg-white/[0.06] text-white/50"
                    }`}>
                      {session.status === "active" ? "Active" : session.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/55">
                    {session.approved_count || 0} approved photo{(session.approved_count || 0) !== 1 ? "s" : ""} · {session.total_analyses || 0} total analyzed
                  </p>
                  <p className="text-xs text-white/35">
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
            <Camera className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No shoot sessions yet. Start your first one above!</p>
          </div>
        )}
      </>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER — Active Session (shooting mode)
     ═══════════════════════════════════════════ */

  const approvedPhotos = (activeSession.photos || []).filter((p: SessionPhoto) => p.approved);
  const checklistEntries = Object.entries(selectedRooms);

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="mc-animate flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveSession(null);
              setLastResult(null);
              setLastPhotoUrl(null);
              setShowGallery(false);
            }}
            className="text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white line-clamp-1">
              {activeSession.property_address}
            </h1>
            <p className="text-sm text-white/55">
              {approvedPhotos.length} approved · {activeSession.total_analyses || 0} analyzed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
            title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-white/60" />
            ) : (
              <VolumeX className="h-4 w-4 text-white/60" />
            )}
          </button>
          <button
            onClick={() => setShowGallery(!showGallery)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              showGallery
                ? `${a.bg} ${a.border} ${a.textLight}`
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:border-white/[0.15]"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Gallery ({approvedPhotos.length})
          </button>
        </div>
      </div>

      {/* Free trial indicator */}
      {!isSubscriber && !isAdmin && (
        <div className={`mc-animate rounded-xl border ${a.border} ${a.bg} px-4 py-2.5 mb-6 flex items-center gap-3`} style={{ animationDelay: "0.05s" }}>
          <Sparkles className={`h-4 w-4 ${a.text} flex-shrink-0`} />
          <p className="text-xs text-white/80">
            <span className="font-bold text-white">Free trial:</span> {FREE_APPROVED_LIMIT - freeApprovedUsed} approved photo{FREE_APPROVED_LIMIT - freeApprovedUsed !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}

      {/* HDR detection banner */}
      {hdrDetected === true && (
        <div className="mc-animate rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-2 mb-6 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-300 font-semibold">HDR Active</p>
        </div>
      )}
      {hdrDetected === false && !hdrBannerDismissed && (
        <div className="mc-animate rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 mb-6 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-amber-200 font-semibold">Enable HDR for better results</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                HDR helps capture detail in bright windows and dark corners — important for real estate photos.
              </p>
            </div>
            <button
              onClick={() => setHdrBannerDismissed(true)}
              className="text-amber-400/60 hover:text-amber-300 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowHdrHelp(!showHdrHelp)}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
          >
            <Info className="h-3 w-3" />
            {showHdrHelp ? "Hide instructions" : "How to enable HDR"}
          </button>
          {showHdrHelp && (
            <div className="bg-black/20 rounded-lg p-3 space-y-2 text-xs text-amber-100/80">
              <div>
                <p className="font-bold text-amber-200">iPhone:</p>
                <p>Settings → Camera → Smart HDR → ON. Or tap the HDR icon in the camera app top bar.</p>
              </div>
              <div>
                <p className="font-bold text-amber-200">Samsung:</p>
                <p>Camera → Settings → Scene Optimizer → ON (includes auto HDR). Or look for &quot;Rich Tone&quot; in camera settings.</p>
              </div>
              <div>
                <p className="font-bold text-amber-200">Google Pixel:</p>
                <p>HDR+ is always on by default — no action needed.</p>
              </div>
              <div>
                <p className="font-bold text-amber-200">Other Android:</p>
                <p>Camera → Settings → look for HDR, Rich Tone, or Scene Optimizer and turn it on.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Tips */}
      <div className="mc-animate rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden mb-6 backdrop-blur-sm">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            📸 Tips for best photo quality
          </span>
          <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${showTips ? "rotate-180" : ""}`} />
        </button>
        {showTips && (
          <div className="px-4 pb-4 space-y-3 text-xs text-white/60">
            <div>
              <p className="font-bold text-white mb-1">Camera Format (iPhone)</p>
              <p>
                Go to Settings → Camera → Formats → choose <span className="font-semibold text-white">&quot;Most Compatible&quot;</span> (JPEG).
                This ensures maximum compatibility with web uploads and video processing. &quot;High Efficiency&quot; (HEIF) can sometimes
                cause issues. ProRAW is unnecessary for listing photos.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-1">Enable Grid & Level (iPhone)</p>
              <p>
                Settings → Camera → turn on <span className="font-semibold text-white">Grid</span> and <span className="font-semibold text-white">Level</span>.
                The grid helps with composition (rule of thirds) and the level ensures your camera is perfectly straight —
                critical for real estate photos where vertical lines need to be vertical.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-1">Shooting Technique</p>
              <p>• Hold your phone at <span className="font-semibold text-white">chest height</span> — not eye level. This shows more floor and feels more natural.</p>
              <p>• Stand in <span className="font-semibold text-white">doorways or corners</span> to capture the most room possible.</p>
              <p>• Shoot <span className="font-semibold text-white">toward natural light</span> (windows) when possible — it makes rooms look brighter and more inviting.</p>
              <p>• Turn on <span className="font-semibold text-white">all lights</span> in every room, even during the day.</p>
              <p>• Open all blinds and curtains fully.</p>
              <p>• Close all toilet lids.</p>
              <p>• Remove personal items, shoes, trash cans from view.</p>
            </div>
            <div>
              <p className="font-bold text-white mb-1">Wide-Angle Lens</p>
              <p>
                If your phone has an ultra-wide lens (0.5x), use it for small rooms like bathrooms and closets.
                Use the standard lens (1x) for larger rooms — ultra-wide can distort larger spaces.
                AI Edit will correct minor lens distortion automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Setup Modal */}
      {showChecklist && !checklistSetup && (
        <div className="mc-animate rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-1">Property Checklist</h2>
          <p className="text-sm text-white/55 mb-4">
            Select the rooms you need to photograph so you don&apos;t miss a shot. You can skip this.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {DEFAULT_ROOMS.map((room) => {
              const selected = !!selectedRooms[room.key];
              return (
                <button
                  key={room.key}
                  onClick={() => toggleRoom(room.key)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    selected
                      ? `${a.border} ${a.bg} ${a.textLight} font-semibold`
                      : "border-white/[0.08] bg-white/[0.02] text-white/70 hover:border-white/[0.15] hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="mr-1.5">{room.icon}</span> {room.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Extra Bedrooms:</span>
              <button
                onClick={() => setExtraBedrooms(Math.max(0, extraBedrooms - 1))}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 flex items-center justify-center hover:bg-white/[0.08]"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-bold text-white w-4 text-center">{extraBedrooms}</span>
              <button
                onClick={() => setExtraBedrooms(extraBedrooms + 1)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 flex items-center justify-center hover:bg-white/[0.08]"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Extra Bathrooms:</span>
              <button
                onClick={() => setExtraBathrooms(Math.max(0, extraBathrooms - 1))}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 flex items-center justify-center hover:bg-white/[0.08]"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-bold text-white w-4 text-center">{extraBathrooms}</span>
              <button
                onClick={() => setExtraBathrooms(extraBathrooms + 1)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 flex items-center justify-center hover:bg-white/[0.08]"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <DarkInput
              placeholder="Add other room..."
              value={customRoom}
              onChange={setCustomRoom}
              onKeyDown={(e) => e.key === "Enter" && addCustomRoom()}
              className="max-w-xs"
            />
            <Button
              onClick={addCustomRoom}
              disabled={!customRoom.trim()}
              className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveChecklist}
              className={`${a.btnBg} ${a.btnBgHover} text-white font-black`}
            >
              <Check className="h-4 w-4 mr-2" />Save Checklist
            </Button>
            <Button
              onClick={skipChecklist}
              className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
            >
              Skip
            </Button>
          </div>
        </div>
      )}

      {/* Checklist Bar */}
      {checklistSetup && checklistEntries.length > 0 && !showGallery && (
        <div className="mc-animate rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 mb-6 backdrop-blur-sm">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm font-bold text-white flex items-center gap-2">
              📋 Checklist — {checklistEntries.filter(([, v]) => v === "done").length}/{checklistEntries.length} done
            </span>
            <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${showChecklist ? "rotate-180" : ""}`} />
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
                        : "border-white/[0.15] hover:border-white/[0.3]"
                    }`}
                  >
                    {status === "done" && <Check className="h-3 w-3" />}
                  </button>
                  <span className={`text-sm flex-1 ${status === "done" ? "text-white/35 line-through" : "text-white/85"}`}>
                    {roomLabel(key)}
                  </span>
                  {status !== "done" && (
                    <button
                      onClick={() => setRoomNext(key)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        status === "next"
                          ? `${a.btnBg} border-transparent text-white font-bold`
                          : "border-white/[0.1] text-white/50 hover:border-white/[0.2]"
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

      {/* Gallery View */}
      {showGallery ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Approved Photos ({approvedPhotos.length})
              </h2>
            </div>

            {approvedPhotos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-10 w-10 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">No approved photos yet. Start shooting!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {approvedPhotos.map((photo: SessionPhoto, i: number) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedPhotoIndex(i); setGalleryEditUrl(null); }}
                    className="relative group rounded-xl overflow-hidden border border-white/[0.08] hover:border-white/[0.2] transition-all text-left"
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={photo.edited_url || photo.url}
                        alt={photo.room || `Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {photo.score}/10
                      </div>
                      {photo.edited && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          AI Edited
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    {photo.room && (
                      <div className="px-2 py-1.5 bg-white/[0.03]">
                        <p className="text-xs font-semibold text-white/80 truncate">{photo.room}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Photo Detail Modal */}
            {selectedPhotoIndex !== null && approvedPhotos[selectedPhotoIndex] && (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-4">
                {(() => {
                  const photo = approvedPhotos[selectedPhotoIndex];
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">
                          {photo.room || `Photo ${selectedPhotoIndex + 1}`}
                          <span className="text-white/50 font-normal ml-2">· {photo.score}/10</span>
                        </h3>
                        <button
                          onClick={() => { setSelectedPhotoIndex(null); setGalleryEditUrl(null); }}
                          className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                          <X className="h-4 w-4 text-white/50" />
                        </button>
                      </div>

                      {galleryEditUrl ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-white/60 text-center">Original</p>
                              <div className="rounded-lg overflow-hidden border border-white/[0.08]">
                                <img src={photo.url} alt="Original" className="w-full aspect-[4/3] object-cover" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-blue-300 text-center">AI Enhanced</p>
                              <div className="rounded-lg overflow-hidden border border-blue-400/40">
                                <img src={galleryEditUrl} alt="AI Enhanced" className="w-full aspect-[4/3] object-cover" />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => applyGalleryEdit(selectedPhotoIndex, true)}
                              className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold" size="sm"
                            >
                              <Wand2 className="h-3.5 w-3.5 mr-1.5" />Use AI Edit
                            </Button>
                            <Button
                              onClick={() => setGalleryEditUrl(null)}
                              className="flex-1 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold" size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                            <img
                              src={photo.edited_url || photo.url}
                              alt={photo.room || "Photo"}
                              className="w-full max-h-72 object-contain"
                            />
                          </div>

                          <p className="text-sm text-white/60">{photo.feedback}</p>

                          <div className="flex gap-2">
                            {!photo.edited && (
                              <Button
                                onClick={() => handleGalleryAiEdit(selectedPhotoIndex)}
                                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold" size="sm"
                              >
                                <Wand2 className="h-3.5 w-3.5 mr-1.5" />AI Edit
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteGalleryPhoto(selectedPhotoIndex)}
                              className="flex-1 bg-red-500/10 border border-red-400/30 hover:bg-red-500/20 text-red-300 font-bold" size="sm"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Gallery Actions */}
          {approvedPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const photosForOrder = approvedPhotos.map((photo: SessionPhoto, i: number) => ({
                    id: `coach-${Date.now()}-${i}`,
                    secure_url: photo.edited_url || photo.url,
                    preview: photo.edited_url || photo.url,
                    description: photo.room || "",
                    uploadStatus: "complete",
                    camera_direction: null,
                    camera_speed: null,
                    custom_motion: "",
                    crop_offset_landscape: 50,
                    crop_offset_vertical: 50,
                  }));
                  sessionStorage.setItem("coach_photos_for_order", JSON.stringify(photosForOrder));
                  sessionStorage.setItem("coach_property_address", activeSession.property_address);
                  window.location.href = "/order";
                }}
                className={`${a.btnBg} ${a.btnBgHover} text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base shadow-lg ${a.btnShadow}`}
              >
                <ShoppingCart className="h-5 w-5 flex-shrink-0" />
                Order Video ({approvedPhotos.length})
              </button>
              <button
                onClick={() => {
                  const urlsForDescription = approvedPhotos.map((p: SessionPhoto) => p.edited_url || p.url);
                  sessionStorage.setItem("coach_photos_for_description", JSON.stringify(urlsForDescription));
                  sessionStorage.setItem("coach_property_address", activeSession.property_address);
                  window.location.href = "/dashboard/lens/descriptions";
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base shadow-lg shadow-sky-500/30"
              >
                <Sparkles className="h-5 w-5 flex-shrink-0" />
                AI Description
              </button>
              <button
                onClick={() => {
                  approvedPhotos.forEach((photo: SessionPhoto, i: number) => {
                    setTimeout(() => {
                      const url = photo.edited_url || photo.url;
                      const downloadUrl = url.includes("/upload/")
                        ? url.replace("/upload/", "/upload/fl_attachment/")
                        : url;
                      const dl = document.createElement("a");
                      dl.href = downloadUrl;
                      dl.download = `${activeSession.property_address.replace(/[^a-zA-Z0-9]/g, "_")}_${photo.room || i + 1}.jpg`;
                      document.body.appendChild(dl);
                      dl.click();
                      document.body.removeChild(dl);
                    }, i * 500);
                  });
                }}
                className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-white text-sm sm:text-base"
              >
                <Download className="h-5 w-5 flex-shrink-0" />
                Download All
              </button>
              <button
                onClick={() => setShowGallery(false)}
                className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-white text-sm sm:text-base"
              >
                <Camera className="h-5 w-5 flex-shrink-0" />
                Continue Shooting
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Shooting View */
        <div className="space-y-6">
          {/* Room Picker */}
          {showRoomPicker && (
            <div className={`mc-animate rounded-2xl border ${a.border} bg-white/[0.03] p-6 space-y-4 backdrop-blur-sm`}>
              <h3 className="text-lg font-bold text-white">Which room are we shooting?</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedRooms)
                  .filter(([, status]) => status !== "done")
                  .map(([key]) => (
                    <button
                      key={key}
                      onClick={() => proceedWithRoom(key)}
                      className={`text-left px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:${a.border.replace("/20", "/40")} hover:${a.bg} transition-all text-sm`}
                    >
                      <span className="font-semibold text-white">{roomLabel(key)}</span>
                    </button>
                  ))}
              </div>

              {Object.entries(selectedRooms).some(([, status]) => status === "done") && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <p className="text-xs text-white/45 mb-1.5">Completed:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedRooms)
                      .filter(([, status]) => status === "done")
                      .map(([key]) => (
                        <button
                          key={key}
                          onClick={() => proceedWithRoom(key)}
                          className="text-xs px-2 py-1 rounded-lg bg-green-400/15 text-green-300 hover:bg-green-400/25 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" /> {roomLabel(key)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.08]">
                <p className="text-xs text-white/45 mb-2">Not on the list?</p>
                <div className="flex gap-2">
                  <DarkInput
                    placeholder="e.g. Wine Cellar, Pantry..."
                    value={addOtherRoom}
                    onChange={setAddOtherRoom}
                    onKeyDown={(e) => e.key === "Enter" && addOtherAndShoot()}
                    className="flex-1"
                  />
                  <Button
                    onClick={addOtherAndShoot}
                    disabled={!addOtherRoom.trim()}
                    size="sm"
                    className="bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
                  >
                    <Plus className="h-4 w-4 mr-1" />Add & Shoot
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => proceedWithRoom("")}
                  className="text-xs text-white/45 hover:text-white transition-colors underline"
                >
                  Skip — take photo without a room label
                </button>
                <button
                  onClick={() => setShowRoomPicker(false)}
                  className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected room indicator */}
          {!showRoomPicker && !lastResult && !uploading && !analyzing && shootingRoom && (
            <div className={`rounded-xl border ${a.border} ${a.bg} px-4 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Camera className={`h-4 w-4 ${a.text}`} />
                <p className={`text-sm font-semibold ${a.textLight}`}>
                  Shooting: {getCurrentRoomLabel()}
                </p>
              </div>
              <button
                onClick={() => setShowRoomPicker(true)}
                className={`text-xs font-semibold ${a.text} hover:${a.textLight} underline transition-colors`}
              >
                Change
              </button>
            </div>
          )}

          {/* Take Photo Button */}
          {!showRoomPicker && !lastResult && (
            <div className="text-center">
              <button
                onClick={handleCapture}
                disabled={uploading || analyzing}
                className={`relative inline-flex items-center justify-center h-28 w-28 sm:h-32 sm:w-32 rounded-full ${a.btnBg} ${a.btnBgHover} text-white shadow-2xl ${a.btnShadow} transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploading || analyzing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Camera className="h-10 w-10" />
                )}
              </button>
              <p className="text-sm text-white/60 mt-3">
                {uploading ? "Uploading..." : analyzing ? "AI is analyzing your photo..." : "Tap to take a photo"}
              </p>
              {!uploading && !analyzing && (
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                      setTimeout(() => {
                        fileInputRef.current?.setAttribute("capture", "environment");
                      }, 1000);
                    }
                  }}
                  className="text-xs text-white/50 hover:text-white transition-colors mt-2 underline"
                >
                  or choose from gallery
                </button>
              )}
            </div>
          )}

          {!showRoomPicker && !lastResult && (uploading || analyzing) && shootingRoom && (
            <div className="text-center">
              <p className="text-xs text-white/55">
                Shooting: <span className="font-semibold text-white">{getCurrentRoomLabel()}</span>
              </p>
            </div>
          )}

          {/* Scoring Result */}
          {lastResult && lastResult.score > 0 && (() => {
            // Score-state colors — kept semantic (green/amber/red) but dark-tuned
            const sc = lastResult.approved
              ? { border: "border-green-400/40", bg: "bg-green-400/[0.08]", chip: "bg-green-500", title: "text-green-300" }
              : lastResult.score >= 5
              ? { border: "border-amber-400/40", bg: "bg-amber-400/[0.08]", chip: "bg-amber-500", title: "text-amber-300" }
              : { border: "border-red-400/40", bg: "bg-red-400/[0.08]", chip: "bg-red-500", title: "text-red-300" };
            return (
              <div
                className={`rounded-2xl border-2 p-6 space-y-4 transition-all backdrop-blur-sm ${sc.border} ${sc.bg}`}
                style={{ userSelect: "none" }}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl ${sc.chip} shadow-lg`}>
                    {lastResult.score}
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold ${sc.title}`}>
                      {getScoreLabel(lastResult.score)}
                    </h3>
                    <p className="text-sm text-white/65">{lastResult.summary}</p>
                  </div>
                </div>

                {lastResult.categories && lastResult.categories.length > 0 && (
                  <div className="space-y-2">
                    {lastResult.categories.map((cat, i) => {
                      const catColor =
                        cat.score === cat.max ? { text: "text-green-300", bar: "bg-green-500" } :
                        cat.score > 0 ? { text: "text-amber-300", bar: "bg-amber-500" } :
                        { text: "text-red-300", bar: "bg-red-500" };
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold text-white/85">{cat.name}</span>
                              <span className={`text-xs font-bold ${catColor.text}`}>{cat.score}/{cat.max}</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${catColor.bar}`}
                                style={{ width: `${(cat.score / cat.max) * 100}%` }}
                              />
                            </div>
                            {cat.note && (
                              <p className="text-[11px] text-white/50 mt-0.5">{cat.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {lastPhotoUrl && (
                  <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/[0.06]">
                    <img
                      src={lastPhotoUrl}
                      alt="Analyzed photo"
                      className="w-full rounded-xl"
                      style={{ maxHeight: "300px", objectFit: "contain", pointerEvents: "none", userSelect: "none" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ userSelect: "none" }}>
                      <span className="text-4xl font-black text-white opacity-10 rotate-[-20deg]">P2V LENS</span>
                    </div>
                  </div>
                )}

                {lastResult.feedback.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-white mb-2">
                      {lastResult.approved ? "What would make it better:" : "Fix these before reshooting:"}
                    </p>
                    <div className="space-y-1.5">
                      {lastResult.feedback.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${lastResult.approved ? "text-green-400" : "text-amber-400"}`} />
                          <span className="text-white/75">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lastResult.flagged_issues.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Noted for AI Editing:</p>
                    <div className="space-y-1.5">
                      {lastResult.flagged_issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-400" />
                          <span className="text-white/60">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lastResult.approved && lastResult.what_would_make_10 && lastResult.score < 10 && (
                  <div className="bg-black/20 border border-white/[0.06] rounded-xl p-3">
                    <p className="text-sm">
                      <span className="font-bold text-white">To get a 10: </span>
                      <span className="text-white/60">{lastResult.what_would_make_10}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  {lastResult.approved ? (
                    showAiEdit ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wand2 className="h-4 w-4 text-blue-400" />
                          <p className="text-sm font-bold text-white">AI Edit Preview</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-white/55 text-center">Original</p>
                            <div className="rounded-lg overflow-hidden border border-white/[0.08]">
                              <img src={lastPhotoUrl!} alt="Original" className="w-full aspect-[4/3] object-cover" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-blue-300 text-center">AI Enhanced</p>
                            <div className="rounded-lg overflow-hidden border border-blue-400/40">
                              <img src={editedPreviewUrl!} alt="AI Enhanced" className="w-full aspect-[4/3] object-cover" />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-white/50 text-center">
                          Auto brightness, color correction, contrast, and general enhancement applied
                        </p>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => savePhotoToGallery(lastPhotoUrl!, editedPreviewUrl)}
                            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30"
                          >
                            <Wand2 className="h-4 w-4 mr-2" />Use AI Edit
                          </Button>
                          <Button
                            onClick={() => savePhotoToGallery(lastPhotoUrl!, null)}
                            className="flex-1 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
                          >
                            Use Original
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAiEdit}
                          className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/30"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />AI Edit
                        </Button>
                        <Button
                          onClick={() => savePhotoToGallery(lastPhotoUrl!, null)}
                          className="flex-1 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
                        >
                          <Camera className="h-4 w-4 mr-2" />Skip — Next Photo
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          if (lastPhotoUrl) {
                            fetch("/api/lens/coach", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ photo_url: lastPhotoUrl }),
                            }).catch(() => {});
                          }
                          setLastResult(null);
                          setLastPhotoUrl(null);
                          fileInputRef.current?.click();
                        }}
                        className={`flex-1 font-bold text-white ${
                          lastResult.score >= 5
                            ? "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/30"
                            : "bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30"
                        }`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />Reshoot
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!activeSession || !lastPhotoUrl) return;
                          const roomLbl = getCurrentRoomLabel();
                          const newPhoto: SessionPhoto = {
                            url: lastPhotoUrl,
                            room: roomLbl,
                            score: lastResult.score,
                            feedback: lastResult.summary,
                            fixable_issues: lastResult.feedback,
                            flagged_issues: lastResult.flagged_issues,
                            approved: true,
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
                          setActiveSession((prev: any) =>
                            prev ? { ...prev, photos: updatedPhotos, approved_count: updatedCount } : prev
                          );
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
                          if (shootingRoom && selectedRooms[shootingRoom]) {
                            const updatedChecklist = { ...selectedRooms, [shootingRoom]: "done" };
                            setSelectedRooms(updatedChecklist);
                            await supabase
                              .from("lens_sessions")
                              .update({ checklist: updatedChecklist })
                              .eq("id", activeSession.id);
                            setActiveSession((prev: any) => prev ? { ...prev, checklist: updatedChecklist } : prev);
                          }
                          setLastResult(null);
                          setLastPhotoUrl(null);
                        }}
                        className="flex-1 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold"
                      >
                        <Check className="h-4 w-4 mr-2" />Keep Anyway
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Error state */}
          {lastResult && lastResult.score === 0 && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-3 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300">{lastResult.summary}</p>
                <button
                  onClick={handleCapture}
                  className="text-sm font-semibold text-red-300 hover:text-red-200 mt-1 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Recent approved mini gallery */}
          {approvedPhotos.length > 0 && !lastResult && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white">Recent Approved</p>
                <button
                  onClick={() => setShowGallery(true)}
                  className={`text-xs font-semibold ${a.textLight} hover:text-white flex items-center gap-1`}
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {approvedPhotos.slice(-5).map((photo: SessionPhoto, i: number) => {
                  const realIndex = approvedPhotos.length - 5 + i;
                  const idx = realIndex < 0 ? i : realIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => { setShowGallery(true); setSelectedPhotoIndex(idx); setGalleryEditUrl(null); }}
                      className="flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border border-white/[0.08] hover:border-white/[0.2] transition-all"
                    >
                      <img src={photo.edited_url || photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Surprise discount wheel */}
      {showSurpriseWheel && (
        <SpinWheel
          title="🎉 Surprise! Spin for a Video Discount!"
          segments={SURPRISE_SEGMENTS}
          promoCode={surprisePromoCode || ""}
          onResult={async (segment) => {
            try {
              const res = await fetch("/api/surprise-spin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ percent: segment.value }),
              });
              const data = await res.json();
              if (data.success) {
                setSurprisePromoCode(data.code);
              }
            } catch (err) {
              console.error("Surprise spin error:", err);
            }
          }}
          onClose={() => setShowSurpriseWheel(false)}
        />
      )}

      {/* Access gate */}
      {showGate && <GateOverlay gateType={gateType} toolName="Photo Coach" onClose={() => setShowGate(false)} />}
    </>
  );
}
