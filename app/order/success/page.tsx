import { getCheckoutSession } from "@/app/actions/stripe";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; orderId?: string }>;
}) {
  const { session_id, orderId } = await searchParams;

  let sessionData = null;
  if (session_id) {
    sessionData = await getCheckoutSession(session_id);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-foreground">
          Payment Successful!
        </h1>

        <p className="mb-2 text-lg text-muted-foreground">
          Thank you for your order. Your payment has been processed
          successfully.
        </p>

        {orderId && (
          <p className="mb-2 text-muted-foreground">
            Order ID: <span className="font-mono font-medium text-foreground">{orderId}</span>
          </p>
        )}

        {(sessionData?.customer_details?.email ?? (sessionData as any)?.customer_email) && (
          <p className="mb-8 text-muted-foreground">
            A confirmation email will be sent to{" "}
            <span className="font-medium text-foreground">
              {sessionData?.customer_details?.email ?? (sessionData as any)?.customer_email}
            </span>
          </p>
        )}

        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {"What's Next?"}
          </h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                1
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Order Received
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your photos have been uploaded and your order is confirmed
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="font-medium text-foreground">We Get to Work</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will manually enhance your photos and create your
                  AI-powered walkthrough video
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Receive Your Video
                </h3>
                <p className="text-sm text-muted-foreground">
                  {"You'll receive your completed video via email within the delivery timeframe"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              Back to Home
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
            <Link href="/order">
              Place Another Order
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
