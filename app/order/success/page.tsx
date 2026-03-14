import { getCheckoutSession } from "@/app/actions/stripe";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight, BookOpen, Clock, Eye, Mail, Share2 } from "lucide-react";
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

  const customerEmail = sessionData?.customer_details?.email ?? (sessionData as any)?.customer_email;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Real Estate Photo 2 Video" width={192} height={77} className="h-12 w-auto" />
          </Link>
          <Button asChild variant="outline" size="sm" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10">
            <Link href="/order">New Order</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-14">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">You're All Set!</h1>
          <p className="text-lg text-muted-foreground">
            Your order has been received and payment confirmed.
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground mt-2">
              Order ID: <span className="font-mono font-medium text-foreground">{orderId}</span>
            </p>
          )}
          {customerEmail && (
            <p className="text-sm text-muted-foreground mt-1">
              Confirmation sent to <span className="font-medium text-foreground">{customerEmail}</span>
            </p>
          )}
        </div>

        {/* What Happens Next Timeline */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">What Happens Next</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="w-0.5 flex-1 bg-green-600 mt-1" />
              </div>
              <div className="pb-6">
                <h3 className="font-bold text-foreground">Order Confirmed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your photos are uploaded and your payment is processed. We're on it.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div className="w-0.5 flex-1 bg-border mt-1" />
              </div>
              <div className="pb-6">
                <h3 className="font-bold text-foreground">Video Production</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our pipeline generates cinematic camera movements for each photo, assembles the clips with your music and branding, and a real editor reviews everything before delivery.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="w-0.5 flex-1 bg-transparent mt-1" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Delivery Within 24 Hours</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll receive an email with a Google Drive link to watch and download your video. 2 free revisions are included if you want any changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photography Guide CTA */}
        <Link href="/resources/photography-guide" className="block mb-8">
          <div className="bg-card rounded-2xl border border-border p-6 flex items-start gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg">Free: The Realtor's Guide to Real Estate Photography</h3>
              <p className="text-sm text-muted-foreground mt-1">
                23-page guide with camera settings, lighting tips, staging checklists, drone photography, and more. Download your free copy while you wait.
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-2">
                Download Free Guide <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>

        {/* Share Section */}
        <div className="bg-muted/30 rounded-2xl border border-border p-6 text-center mb-8">
          <Share2 className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">Know an agent who needs listing videos?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share the love. Send them to realestatephoto2video.com
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <a
                href={`mailto:?subject=Check out this listing video service&body=I just ordered a professional walkthrough video for my listing at realestatephoto2video.com. They turn your photos into a cinematic video in 24 hours, starting at $79. Worth checking out!`}
              >
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="cursor-pointer"
              asChild
            >
              <a
                href={`https://wa.me/?text=I just ordered a professional listing video at realestatephoto2video.com — they turn your photos into a cinematic walkthrough video in 24 hours, starting at $79. Check it out!`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Share via WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="px-8 py-6 text-lg">
            <Link href="/order">
              Place Another Order
            </Link>
          </Button>
        </div>
      </main>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-2xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/resources/photography-guide" className="hover:text-foreground transition-colors">Free Guide</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
