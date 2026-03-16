"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Video,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function RevisionSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const sessionId = searchParams.get("session_id");
  const revisionId = searchParams.get("revision_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [revisionNumber, setRevisionNumber] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId && revisionId) {
      confirmRevision();
    } else {
      setStatus("error");
      setMessage("Missing payment confirmation details. Please contact support.");
    }
  }, [sessionId, revisionId]);

  const confirmRevision = async () => {
    try {
      const res = await fetch("/api/revisions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, revisionId }),
      });
      const data = await res.json();

      if (data.success || data.alreadyConfirmed) {
        setStatus("success");
        setMessage(data.message || "Your revision has been confirmed and is being processed.");
        setPaymentAmount(data.paymentAmount || null);
        setRevisionNumber(data.revisionNumber || null);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to confirm revision payment.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Failed to confirm revision. Please contact support if you were charged.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-2xl px-4 py-20">
        {status === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Confirming your payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your revision payment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-8">
            {/* Success header */}
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground">Revision Confirmed!</h1>
              <p className="text-muted-foreground text-lg">
                {message}
              </p>
            </div>

            {/* Payment details card */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-bold text-foreground">Revision Details</h3>
              <div className="space-y-3 text-sm">
                {revisionNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revision Number</span>
                    <span className="font-semibold text-foreground">#{revisionNumber}</span>
                  </div>
                )}
                {paymentAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold text-green-600">${paymentAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Processing
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">What happens next</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Payment confirmed</p>
                    <p className="text-xs text-muted-foreground">Your payment has been processed successfully</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Processing your revision</p>
                    <p className="text-xs text-muted-foreground">Our pipeline will regenerate only the clips you flagged</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Updated video delivered</p>
                    <p className="text-xs text-muted-foreground">You'll receive an email within 24 hours with your revised video</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link href={`/video/${orderId}`}>
                  <Video className="mr-2 h-4 w-4" />
                  Back to My Video
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/videos">View All Videos</Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
              If you were charged, don't worry — contact us at{" "}
              <a href="mailto:matt@realestatephoto2video.com" className="text-accent hover:underline">
                matt@realestatephoto2video.com
              </a>{" "}
              and we'll sort it out immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href={`/video/${orderId}/revise`}>
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/support">Contact Support</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
