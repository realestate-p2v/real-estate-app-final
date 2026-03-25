import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Real Estate Photo 2 Video",
  description:
    "Learn how Real Estate Photo 2 Video collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-muted-foreground mb-2">Last updated: March 25, 2026</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-8">
          Privacy Policy
        </h1>

        {/* Table of Contents */}
        <nav className="bg-muted/50 rounded-2xl border border-border p-6 mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Table of Contents
          </h2>
          <ol className="space-y-2 text-sm">
            {[
              ["#introduction", "Introduction"],
              ["#information-we-collect", "Information We Collect"],
              ["#how-we-use-your-information", "How We Use Your Information"],
              ["#how-we-share-your-information", "How We Share Your Information"],
              ["#your-photos-and-videos", "Your Photos and Videos"],
              ["#cookies-and-tracking", "Cookies and Tracking"],
              ["#data-retention", "Data Retention"],
              ["#your-rights", "Your Rights"],
              ["#california-residents", "California Residents (CCPA)"],
              ["#childrens-privacy", "Children's Privacy"],
              ["#changes-to-this-policy", "Changes to This Policy"],
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
          {/* 1. Introduction */}
          <section id="introduction">
            <h2 className="text-2xl font-bold text-foreground mb-3">Introduction</h2>
            <p>
              Real Estate Photo 2 Video (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates
              the website{" "}
              <a
                href="https://realestatephoto2video.com"
                className="text-primary hover:underline"
              >
                realestatephoto2video.com
              </a>
              . This Privacy Policy explains what personal data we collect, how we use it, how we
              share it, and what rights you have regarding your information. By using our website or
              services, you agree to the collection and use of information in accordance with this
              policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section id="information-we-collect">
            <h2 className="text-2xl font-bold text-foreground mb-3">Information We Collect</h2>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">
              Account Information
            </h3>
            <p>
              When you create an account or place an order, we collect your name, email address, and
              optionally your phone number. If you sign in with Google, we receive your name, email,
              and profile picture from your Google account.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">
              Property Information
            </h3>
            <p>
              To produce your video or use our Lens tools, we collect the property address, listing
              photos you upload, and property details you provide such as bedrooms, bathrooms, and
              square footage.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">
              Payment Information
            </h3>
            <p>
              All payment processing is handled securely by Stripe. We never store your credit card
              number, expiration date, or CVC on our servers. Stripe may share with us your name,
              billing address, and the last four digits of your card for order confirmation purposes.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">Usage Data</h3>
            <p>
              We automatically collect information about how you interact with our site, including
              pages visited, features used, photo analyses performed, and designs created. This data
              helps us understand how our services are used and how to improve them.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">Device Data</h3>
            <p>
              Through our analytics tools, we may collect your browser type, IP address, device type,
              operating system, and referring URL. This information is collected in aggregate and used
              to optimize the site experience.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">Cookies</h3>
            <p>
              We use cookies and similar technologies for authentication, analytics, and advertising.
              See the{" "}
              <a href="#cookies-and-tracking" className="text-primary hover:underline">
                Cookies and Tracking
              </a>{" "}
              section below for full details.
            </p>
          </section>

          {/* 3. How We Use Your Information */}
          <section id="how-we-use-your-information">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How We Use Your Information
            </h2>
            <p>
              We use the information we collect to provide and improve our services. Specifically, we
              use your data to process video orders, run AI photo analysis, generate listing
              descriptions, create marketing designs, and perform virtual staging through our P2V Lens
              suite.
            </p>
            <p className="mt-3">
              We also use your information to communicate with you — sending delivery emails, order
              updates, and service notifications. Your email address may be used to send promotional
              content only with your consent, and you can unsubscribe from marketing emails at any
              time using the link included in every message.
            </p>
            <p className="mt-3">
              Additionally, we analyze usage patterns to fix bugs, develop new features, and improve
              overall service quality. Payment-related data is sent to Stripe solely to process your
              transactions.
            </p>
          </section>

          {/* 4. How We Share Your Information */}
          <section id="how-we-share-your-information">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How We Share Your Information
            </h2>
            <p>
              <strong>We do not sell your personal information.</strong> We share data only with
              third-party service providers that are necessary to deliver our products. These
              providers process your data on our behalf and are contractually obligated to protect it.
            </p>
            <p className="mt-3">Our service providers include:</p>
            <div className="mt-3 bg-muted/40 rounded-xl border border-border p-5 space-y-2 text-sm">
              <p>
                <strong>Supabase</strong> — database and user authentication (US)
              </p>
              <p>
                <strong>Cloudinary</strong> — photo and video storage and delivery (US)
              </p>
              <p>
                <strong>Stripe</strong> — payment processing (US)
              </p>
              <p>
                <strong>SendGrid</strong> — transactional and notification emails (US)
              </p>
              <p>
                <strong>Anthropic / Claude</strong> — AI photo analysis and content generation (US)
              </p>
              <p>
                <strong>OpenAI</strong> — virtual staging image generation (US)
              </p>
              <p>
                <strong>Minimax</strong> — video generation
              </p>
              <p>
                <strong>ElevenLabs</strong> — voiceover generation (US/EU)
              </p>
              <p>
                <strong>Google Analytics &amp; Meta</strong> — anonymized usage analytics (US)
              </p>
              <p>
                <strong>Vercel</strong> — website hosting (US)
              </p>
            </div>
          </section>

          {/* 5. Your Photos and Videos */}
          <section id="your-photos-and-videos">
            <h2 className="text-2xl font-bold text-foreground mb-3">Your Photos and Videos</h2>
            <p>
              Photos you upload are stored securely on Cloudinary and are used solely to produce your
              ordered video or to power Lens features you&apos;ve requested. We do not use your photos
              for training AI models, and we do not share your listing photos publicly.
            </p>
            <p className="mt-3">
              Completed videos are stored on Cloudinary and made accessible to you via your personal
              delivery link. You can request deletion of your photos and videos at any time by
              contacting us at the email address listed at the bottom of this page.
            </p>
          </section>

          {/* 6. Cookies and Tracking */}
          <section id="cookies-and-tracking">
            <h2 className="text-2xl font-bold text-foreground mb-3">Cookies and Tracking</h2>
            <p>We use cookies for the following purposes:</p>
            <p className="mt-3">
              <strong>Essential cookies</strong> are required for the site to function. These include
              authentication cookies managed by Supabase that keep you logged in.
            </p>
            <p className="mt-3">
              <strong>Analytics cookies</strong> (Google Analytics, Google Tag Manager) help us
              understand how visitors use the site so we can improve it. These cookies collect
              anonymized data about page views, session duration, and feature usage.
            </p>
            <p className="mt-3">
              <strong>Marketing cookies</strong> (Meta Pixel) allow us to measure the effectiveness
              of our advertising campaigns and show relevant ads to people who have visited our site.
            </p>
            <p className="mt-3">
              You can manage your cookie preferences at any time using our cookie consent banner,
              which appears on your first visit. You can also update your preferences later via the
              &quot;Cookie Settings&quot; link in our website footer. Please note that disabling
              essential cookies may prevent certain site features from working correctly.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section id="data-retention">
            <h2 className="text-2xl font-bold text-foreground mb-3">Data Retention</h2>
            <p>
              We retain your account data for as long as your account remains active. If you request
              account deletion, we will remove your personal data within 30 days.
            </p>
            <p className="mt-3">
              Order data and completed videos are retained for one year after delivery, after which
              they are archived. Photos you upload for video orders are retained for 90 days after
              order completion and then permanently deleted.
            </p>
            <p className="mt-3">
              P2V Lens session data — including photo analyses, descriptions, and designs — is
              retained for as long as your subscription is active. Analytics data is retained according
              to the standard retention periods set by Google and Meta.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section id="your-rights">
            <h2 className="text-2xl font-bold text-foreground mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <p className="mt-3">
              <strong>Access</strong> your personal data by requesting a copy of the information we
              hold about you.
            </p>
            <p className="mt-3">
              <strong>Correct</strong> any inaccurate information by updating your account settings or
              contacting us directly.
            </p>
            <p className="mt-3">
              <strong>Delete</strong> your account and all associated data by sending us a request.
            </p>
            <p className="mt-3">
              <strong>Opt out</strong> of marketing emails using the unsubscribe link in any email, or
              disable analytics and marketing cookies through our cookie consent banner.
            </p>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:realestatephoto2video@gmail.com"
                className="text-primary hover:underline"
              >
                realestatephoto2video@gmail.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 9. California Residents */}
          <section id="california-residents">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              California Residents (CCPA)
            </h2>
            <p>
              If you are a California resident, the California Consumer Privacy Act (CCPA) grants you
              additional rights. You have the right to know what personal information we collect and
              how it is used, the right to request deletion of your personal information, and the
              right to opt out of the sale of your personal information.
            </p>
            <p className="mt-3">
              We do not sell personal information. To exercise your CCPA rights, contact us at{" "}
              <a
                href="mailto:realestatephoto2video@gmail.com"
                className="text-primary hover:underline"
              >
                realestatephoto2video@gmail.com
              </a>
              . We will not discriminate against you for exercising any of your CCPA rights.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section id="childrens-privacy">
            <h2 className="text-2xl font-bold text-foreground mb-3">Children&apos;s Privacy</h2>
            <p>
              Our services are designed for real estate professionals and are not directed at children
              under the age of 13. We do not knowingly collect personal information from children
              under 13. If we become aware that we have inadvertently collected data from a child
              under 13, we will take steps to delete that information promptly.
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section id="changes-to-this-policy">
            <h2 className="text-2xl font-bold text-foreground mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or for legal, operational, or regulatory reasons. When we make material changes, we will
              notify you by email or by posting a prominent notice on our website. Your continued use
              of our services after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* 12. Contact */}
          <section id="contact">
            <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data, please
              contact us:
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
