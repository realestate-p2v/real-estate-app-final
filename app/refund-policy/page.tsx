import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Real Estate Photo 2 Video",
  description:
    "Our refund and revision policy for video orders and P2V Lens subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-muted-foreground mb-2">Last updated: March 25, 2026</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-8">
          Refund Policy
        </h1>

        {/* Table of Contents */}
        <nav className="bg-muted/50 rounded-2xl border border-border p-6 mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Table of Contents
          </h2>
          <ol className="space-y-2 text-sm">
            {[
              ["#our-policy", "Our Policy"],
              ["#satisfaction-guarantee", "Our Satisfaction Guarantee"],
              ["#additional-revisions", "Additional Revisions"],
              ["#lens-subscriptions", "P2V Lens Subscriptions"],
              ["#exceptions", "Exceptions"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="prose-section space-y-10 text-[15px] leading-relaxed text-foreground/90">
          {/* 1 */}
          <section id="our-policy">
            <h2 className="text-2xl font-bold text-foreground mb-3">Our Policy</h2>
            <p>
              All sales are final. Due to the digital nature of our product, we do not offer refunds
              once a video has been delivered. Videos are available for immediate download upon
              delivery — there is no way to &quot;return&quot; a digital product once it has been
              accessed.
            </p>
          </section>

          {/* 2 */}
          <section id="satisfaction-guarantee">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Our Satisfaction Guarantee
            </h2>
            <p>
              We want you to be happy with your video. Every order includes one free revision within
              five days of delivery. If any clips don&apos;t meet your expectations, use our revision
              tool to flag the specific clips you&apos;d like regenerated. We regenerate only the clips
              you flag — everything else stays exactly the same.
            </p>
            <p className="mt-3">
              Most revisions are completed within 12 hours. This free revision is our commitment to
              making sure your video is exactly what you need for your listing.
            </p>
          </section>

          {/* 3 */}
          <section id="additional-revisions">
            <h2 className="text-2xl font-bold text-foreground mb-3">Additional Revisions</h2>
            <p>
              After your included free revision, additional revisions are available at reduced
              per-clip rates:
            </p>
            <div className="mt-4 bg-muted/40 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="text-left py-3 px-5 font-semibold text-foreground">
                      Number of Clips
                    </th>
                    <th className="text-right py-3 px-5 font-semibold text-foreground">
                      Price per Clip
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-5">1 clip</td>
                    <td className="py-3 px-5 text-right font-medium">$1.99</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-5">2–5 clips</td>
                    <td className="py-3 px-5 text-right font-medium">$1.49 / clip</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-5">6–15 clips</td>
                    <td className="py-3 px-5 text-right font-medium">$1.24 / clip</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5">16+ clips</td>
                    <td className="py-3 px-5 text-right font-medium">$0.99 / clip</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section id="lens-subscriptions">
            <h2 className="text-2xl font-bold text-foreground mb-3">P2V Lens Subscriptions</h2>
            <p>
              You can cancel your P2V Lens subscription at any time through your Account Settings or
              via the Stripe Customer Portal. When you cancel, future billing stops immediately and
              you retain full access to all Lens features through the end of your current billing
              period.
            </p>
            <p className="mt-3">
              We do not issue refunds for partial billing periods. If you cancel mid-month or
              mid-year, you will not be charged again, but no prorated refund will be provided for
              the remaining time in your current cycle.
            </p>
          </section>

          {/* 5 */}
          <section id="exceptions">
            <h2 className="text-2xl font-bold text-foreground mb-3">Exceptions</h2>
            <p>
              If we fail to deliver your video within a reasonable timeframe — specifically, more
              than 48 hours after your order was placed — please contact us and we will work with you
              to find a resolution, which may include expedited delivery or a full refund.
            </p>
            <p className="mt-3">
              If a technical error on our end prevents delivery entirely and we are unable to
              produce your video, we will issue a full refund or re-process your order at no
              additional charge — whichever you prefer.
            </p>
          </section>

          {/* 6 */}
          <section id="contact">
            <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
            <p>
              Questions about our refund policy? We&apos;re here to help.
            </p>
            <div className="mt-3 bg-muted/40 rounded-xl border border-border p-5 space-y-1 text-sm">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:realestatephoto2video@gmail.com"
                  className="text-primary hover:underline"
                >
                  realestatephoto2video@gmail.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong> (845) 536-6954
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
