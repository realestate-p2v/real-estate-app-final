import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Real Estate Photo 2 Video",
  description:
    "Terms and conditions for using Real Estate Photo 2 Video services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-muted-foreground mb-2">Last updated: March 25, 2026</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-8">
          Terms of Service
        </h1>

        {/* Table of Contents */}
        <nav className="bg-muted/50 rounded-2xl border border-border p-6 mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Table of Contents
          </h2>
          <ol className="space-y-2 text-sm">
            {[
              ["#acceptance-of-terms", "Acceptance of Terms"],
              ["#description-of-services", "Description of Services"],
              ["#account-registration", "Account Registration"],
              ["#orders-and-payment", "Orders and Payment"],
              ["#revisions", "Revisions"],
              ["#refund-policy", "Refund Policy"],
              ["#intellectual-property", "Intellectual Property"],
              ["#content-rights", "Content Rights and Permissions"],
              ["#acceptable-use", "Acceptable Use"],
              ["#lens-subscription-terms", "P2V Lens Subscription Terms"],
              ["#limitation-of-liability", "Limitation of Liability"],
              ["#termination", "Termination"],
              ["#governing-law", "Governing Law"],
              ["#changes-to-terms", "Changes to Terms"],
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
          <section id="acceptance-of-terms">
            <h2 className="text-2xl font-bold text-foreground mb-3">Acceptance of Terms</h2>
            <p>
              By accessing or using{" "}
              <a
                href="https://realestatephoto2video.com"
                className="text-primary hover:underline"
              >
                realestatephoto2video.com
              </a>{" "}
              (the &quot;Site&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Site or
              any of our services. These Terms constitute a legally binding agreement between you and
              Real Estate Photo 2 Video (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;).
            </p>
          </section>

          {/* 2 */}
          <section id="description-of-services">
            <h2 className="text-2xl font-bold text-foreground mb-3">Description of Services</h2>
            <p>
              <strong>Photo 2 Video</strong> is our core service: we transform your real estate
              listing photos into cinematic walkthrough videos. You upload your photos, choose your
              preferences, and our pipeline — powered by AI and reviewed by human editors — produces
              a polished video ready for MLS, social media, and anywhere else you market your
              listings.
            </p>
            <p className="mt-3">
              <strong>P2V Lens</strong> is our monthly subscription suite of AI-powered marketing
              tools for real estate agents. It includes an AI Photo Coach for on-site shoot guidance,
              a Marketing Design Studio for creating listing graphics, an AI Listing Description
              Writer, and Virtual Staging. Lens tools are available immediately upon subscription.
            </p>
            <p className="mt-3">
              Videos are typically delivered within 24 hours of order placement, and Lens subscribers
              receive priority delivery within 12 hours.
            </p>
          </section>

          {/* 3 */}
          <section id="account-registration">
            <h2 className="text-2xl font-bold text-foreground mb-3">Account Registration</h2>
            <p>
              To use certain features of our Site, you must create an account. You agree to provide
              accurate, current, and complete information during registration and to keep your
              account information up to date. You are responsible for maintaining the confidentiality
              of your account credentials and for all activity that occurs under your account.
            </p>
            <p className="mt-3">
              Each person may maintain only one account. Sharing account credentials with others is
              not permitted. If you suspect unauthorized access to your account, contact us
              immediately.
            </p>
          </section>

          {/* 4 */}
          <section id="orders-and-payment">
            <h2 className="text-2xl font-bold text-foreground mb-3">Orders and Payment</h2>
            <p>
              The prices displayed at the time you place an order are the final prices for that
              order. All payments are processed securely through Stripe. We do not store your credit
              card information on our servers.
            </p>
            <p className="mt-3">
              Orders begin processing immediately upon successful payment. Once an order is placed,
              our production pipeline starts working on your video right away. Admin bypass orders
              are reserved for internal testing purposes only and do not involve payment processing.
            </p>
          </section>

          {/* 5 */}
          <section id="revisions">
            <h2 className="text-2xl font-bold text-foreground mb-3">Revisions</h2>
            <p>
              Every video order includes one free revision within five days of delivery. To request a
              revision, use our revision tool to flag specific clips that you would like regenerated.
              Clips you do not flag will remain unchanged, ensuring consistency across your video.
            </p>
            <p className="mt-3">
              Additional revisions beyond the included free revision are available at published rates.
              After the five-day review window, the order is considered finalized automatically.
            </p>
          </section>

          {/* 6 */}
          <section id="refund-policy">
            <h2 className="text-2xl font-bold text-foreground mb-3">Refund Policy</h2>
            <p>
              All sales are final due to the digital nature of our product. Videos are delivered
              digitally and can be downloaded immediately upon delivery — there is no way to
              &quot;return&quot; a digital product. We do not offer refunds once a video has been
              delivered. Your included free revision serves as our satisfaction guarantee.
            </p>
            <p className="mt-3">
              P2V Lens subscriptions may be canceled at any time. Cancellation stops future charges
              but does not provide a refund for the current billing period. For complete details, see
              our{" "}
              <Link href="/refund-policy" className="text-primary hover:underline">
                Refund Policy
              </Link>
              .
            </p>
          </section>

          {/* 7 */}
          <section id="intellectual-property">
            <h2 className="text-2xl font-bold text-foreground mb-3">Intellectual Property</h2>
            <p>
              You retain full ownership of all photos you upload to our platform. By uploading
              photos, you grant us a limited, non-exclusive license to process those photos into
              videos and to apply our AI tools to them for the sole purpose of fulfilling your order
              or providing Lens features you have requested.
            </p>
            <p className="mt-3">
              The final video produced from your photos is yours. You may use it on any platform and
              for any purpose, including MLS listings, social media, websites, and advertising.
            </p>
            <p className="mt-3">
              Our branding templates, website design, AI tools, production pipeline, and proprietary
              technology remain the intellectual property of Real Estate Photo 2 Video. You may not
              resell, redistribute, reverse-engineer, or white-label our tools or services.
            </p>
          </section>

          {/* 8 */}
          <section id="content-rights">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Content Rights and Permissions
            </h2>
            <p>
              By uploading photos, you represent and warrant that you either own the photos or have
              obtained permission from the owner to use them for video production and marketing
              purposes. You also confirm that you have the right to market the property shown in the
              photos.
            </p>
            <p className="mt-3">
              We are not responsible for any copyright disputes, intellectual property claims, or
              legal issues arising from the photos you submit. Any liability related to the
              ownership or authorized use of uploaded content rests with you.
            </p>
          </section>

          {/* 9 */}
          <section id="acceptable-use">
            <h2 className="text-2xl font-bold text-foreground mb-3">Acceptable Use</h2>
            <p>
              When using our services, you agree not to upload illegal, offensive, misleading, or
              fraudulent content. You may not attempt to reverse-engineer, decompile, or otherwise
              extract the underlying technology behind our AI tools or production pipeline.
            </p>
            <p className="mt-3">
              Creating multiple accounts for the purpose of abusing free trials or promotional
              offers is prohibited. You may not use automated scripts, bots, or other programmatic
              tools to access the service without our prior written consent.
            </p>
          </section>

          {/* 10 */}
          <section id="lens-subscription-terms">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              P2V Lens Subscription Terms
            </h2>
            <p>
              P2V Lens subscriptions are billed monthly or annually through Stripe. You can cancel
              your subscription at any time through your Account Settings or via the Stripe Customer
              Portal. Cancellation stops future charges but does not entitle you to a refund for the
              current billing period.
            </p>
            <p className="mt-3">
              Subscribers are subject to monthly usage limits: up to 200 photo analyses and up to 25
              virtual stagings per billing cycle. Free trial users are limited to 3 photo analyses, 1
              listing description, 1 virtual staging, and 3 design exports.
            </p>
            <p className="mt-3">
              <strong>Subscriber Quick Videos:</strong> P2V Lens subscribers may order short-form videos of 5 to 14 clips at a rate of $4.95 per clip. This rate already reflects the 10% subscriber discount and no additional discount applies. Quick Video orders include custom branding and music selection. Quick Video orders do not include a free revision — all revisions are available at standard paid revision rates ($1.99 for 1 clip, $1.49 per clip for 2-5, $1.24 per clip for 6-15, $0.99 per clip for 16+). Voiceover is not available on Quick Video orders. The minimum order is 5 clips. Orders of 15 or more clips are charged at standard package rates.
            </p>
          </section>

          {/* 11 */}
          <section id="limitation-of-liability">
            <h2 className="text-2xl font-bold text-foreground mb-3">Limitation of Liability</h2>
            <p>
              Our services are provided on an &quot;as is&quot; and &quot;as available&quot; basis
              without warranties of any kind, whether express or implied. We do not guarantee that
              our services will be uninterrupted, error-free, or completely secure.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by law, Real Estate Photo 2 Video shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of our services. Our total liability for any claim related to our services is
              limited to the amount you paid for the specific order or subscription period giving
              rise to the claim.
            </p>
            <p className="mt-3">
              We are not responsible for the accuracy of AI-generated content, including but not
              limited to listing descriptions, photo analyses, design suggestions, and virtual
              staging images. You are responsible for reviewing and verifying all AI-generated output
              before use.
            </p>
          </section>

          {/* 12 */}
          <section id="termination">
            <h2 className="text-2xl font-bold text-foreground mb-3">Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, engage
              in fraudulent activity, or abuse our services. You may delete your account at any time
              by contacting us. Upon termination or deletion, your data will be removed in
              accordance with our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* 13 */}
          <section id="governing-law">
            <h2 className="text-2xl font-bold text-foreground mb-3">Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of
              New York, without regard to its conflict-of-law provisions. Any disputes arising under
              or in connection with these Terms shall be resolved exclusively in the state or federal
              courts located in New York.
            </p>
          </section>

          {/* 14 */}
          <section id="changes-to-terms">
            <h2 className="text-2xl font-bold text-foreground mb-3">Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              notify you by email or by posting a notice on our website. Your continued use of our
              services after such changes constitutes your acceptance of the updated Terms. We
              encourage you to review these Terms periodically.
            </p>
          </section>

          {/* 15 */}
          <section id="contact">
            <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
            <p>
              If you have questions about these Terms of Service, please reach out:
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
