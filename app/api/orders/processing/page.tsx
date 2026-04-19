// app/order/processing/page.tsx
// Phase 1A — post-submit interstitial.
//
// Behavior:
// - Reads ?orderId=<order_id> from the URL
// - Polls /api/orders/[orderId]/status every 3 seconds
// - Progress bar: 0→80% tracks video pipeline, 80→100% tracks Description
//   Writer + sample content generation
// - When both jobs complete, redirects to /order/delivery?orderId=<id>
// - On DW failure: stays on page, surfaces "contact support" message.
//   Per Matt: we do NOT redirect to delivery until all samples are ready.
//   Agents should feel like a kid on Christmas — video + three samples
//   drop together, fully formed.
// - Gracefully handles long video times (typical: ~5 min for 10 clips;
//   DW: ~30s; samples: ~30s)

"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Check,
  Film,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 15 * 60 * 1000; // 15 minutes — hard ceiling before surfacing "taking longer than usual"

type VideoStatus = "pending" | "processing" | "complete" | "failed" | "unknown";
type DwStatus = "pending" | "processing" | "complete" | "failed" | null;

interface StatusResponse {
  success: boolean;
  video_status: VideoStatus;
  description_status: DwStatus;
  sample_content_generated: boolean;
  is_first_order: boolean;
  delivered_at: string | null;
  payment_status: string | null;
  error_message: string | null;
}

export default function OrderProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tookTooLong, setTookTooLong] = useState(false);
  const [progress, setProgress] = useState(5); // start at 5% for visual movement

  const startedAtRef = useRef<number>(Date.now());
  const pollingRef = useRef<boolean>(true);

  // ─── Poll for status ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setError("No order ID found. Please check your link.");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled || !pollingRef.current) return;

      try {
        const resp = await fetch(`/api/orders/${orderId}/status`, {
          cache: "no-store",
        });
        if (!resp.ok) {
          console.warn("[processing] status fetch failed:", resp.status);
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        const data: StatusResponse = await resp.json();
        if (cancelled) return;

        setStatus(data);
        updateProgress(data);

        // Terminal success: everything is ready
        const videoReady = data.video_status === "complete";
        const dwReady =
          !data.is_first_order || // DW + samples only required for first-order
          (data.description_status === "complete" && data.sample_content_generated);

        if (videoReady && dwReady) {
          pollingRef.current = false;
          router.push(`/order/delivery?orderId=${orderId}`);
          return;
        }

        // Terminal failure: video failed
        if (data.video_status === "failed") {
          pollingRef.current = false;
          setError(
            data.error_message ||
              "We hit a snag making your video. Our team has been notified and will reach out."
          );
          return;
        }

        // DW-only failure on first order — hold delivery and surface
        if (
          data.is_first_order &&
          data.description_status === "failed" &&
          data.video_status === "complete"
        ) {
          pollingRef.current = false;
          setError(
            "Your video is ready but we're still preparing your bonus content. A member of our team has been notified — your delivery page will unlock shortly."
          );
          // Note: we still hold here per Matt's "Christmas morning" rule.
          return;
        }

        // Took too long — surface a softer message, keep polling
        const elapsed = Date.now() - startedAtRef.current;
        if (elapsed > MAX_WAIT_MS && !tookTooLong) {
          setTookTooLong(true);
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.error("[processing] poll error:", err);
        if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      pollingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ─── Progress calculation: 0→80% video, 80→100% DW + samples ────────────
  const updateProgress = (s: StatusResponse) => {
    let pct = 5;

    // Video phase (0 → 80)
    if (s.video_status === "complete") {
      pct = 80;
    } else if (s.video_status === "processing") {
      // Estimate video progress based on elapsed time within phase.
      // Typical 10-clip video = ~5 minutes. Cap at 75% so we don't promise
      // completion before the status flips.
      const elapsedMs = Date.now() - startedAtRef.current;
      const estimatedTotal = 5 * 60 * 1000;
      const linear = Math.min(0.75, elapsedMs / estimatedTotal) * 80;
      pct = Math.max(10, linear);
    } else if (s.video_status === "pending") {
      pct = 8;
    }

    // DW + samples phase (80 → 100)
    if (s.video_status === "complete") {
      if (!s.is_first_order) {
        // Non-first orders skip DW + samples; jump to 100 after video
        pct = 100;
      } else {
        if (s.description_status === "complete" && s.sample_content_generated) {
          pct = 100;
        } else if (s.description_status === "complete") {
          // Description done, sample content rendering
          pct = 92;
        } else if (s.description_status === "processing") {
          pct = 87;
        } else {
          pct = 82;
        }
      }
    }

    setProgress((prev) => Math.max(prev, Math.round(pct)));
  };

  // ─── Missing orderId error ────────────────────────────────────────────────
  if (!orderId) {
    return (
      <ErrorScreen
        title="Something went wrong"
        message="We couldn't find your order. Please check your link or contact support."
      />
    );
  }

  // ─── Hard error state ─────────────────────────────────────────────────────
  if (error) {
    return (
      <ErrorScreen
        title="Hang tight"
        message={error}
        orderId={orderId}
      />
    );
  }

  // ─── Main processing view ────────────────────────────────────────────────
  const isFirstOrder = status?.is_first_order ?? false;
  const videoDone = status?.video_status === "complete";
  const dwDone = status?.description_status === "complete";
  const samplesDone = status?.sample_content_generated ?? false;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center">
            {progress >= 100 ? (
              <Check className="h-8 w-8 text-primary" />
            ) : (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground">
            {progress >= 100 ? "All set — taking you to your video…" : "Your video is being made"}
          </h1>
          <p className="text-muted-foreground">
            {isFirstOrder
              ? "We're making your video and preparing your three bonus content samples."
              : "Hang tight — your video will be ready in just a few minutes."}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              {progress < 80 ? "Making your video" : isFirstOrder ? "Finishing your bonus content" : "Wrapping up"}
            </span>
            <span className="font-bold text-foreground">{progress}%</span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase checklist */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <PhaseRow
            icon={Film}
            label="Cinematic walkthrough video"
            done={videoDone}
            active={!videoDone}
          />
          {isFirstOrder && (
            <>
              <PhaseRow
                icon={Sparkles}
                label="Listing description"
                done={dwDone}
                active={videoDone && !dwDone}
              />
              <PhaseRow
                icon={ImageIcon}
                label="Branded flyer, social post, and listing page"
                done={samplesDone}
                active={videoDone && dwDone && !samplesDone}
              />
            </>
          )}
        </div>

        {/* Took-too-long note */}
        {tookTooLong && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              This is taking a little longer than usual. It&apos;ll still get done — feel free to
              grab a coffee. We&apos;ll email you when it&apos;s ready.
            </p>
          </div>
        )}

        {/* Reassurance footer */}
        <p className="text-xs text-muted-foreground text-center">
          You can safely leave this page — we&apos;ll email you when everything is ready. Order{" "}
          <span className="font-mono">{orderId.slice(0, 8)}…</span>
        </p>
      </div>
    </div>
  );
}

// ─── Phase checklist row ───────────────────────────────────────────────────
function PhaseRow({
  icon: Icon,
  label,
  done,
  active,
}: {
  icon: React.ElementType;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          done
            ? "bg-green-100 text-green-700"
            : active
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? (
          <Check className="h-4 w-4" />
        ) : active ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Error screen ──────────────────────────────────────────────────────────
function ErrorScreen({
  title,
  message,
  orderId,
}: {
  title: string;
  message: string;
  orderId?: string;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-4">
        <div className="inline-flex h-16 w-16 rounded-full bg-amber-100 items-center justify-center">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        {orderId && (
          <p className="text-xs text-muted-foreground">
            Order: <span className="font-mono">{orderId.slice(0, 8)}…</span>
          </p>
        )}
        <div className="pt-3">
          
            href="mailto:realestatephoto2video@gmail.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
