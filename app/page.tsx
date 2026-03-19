import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { Testimonials } from "@/components/testimonials";
import { DemoSection } from "@/components/demo-section";
import { ProcessSection } from "@/components/process-section";
import { SaleBanner } from "@/components/sale-banner";
import { CTASection } from "@/components/cta-section";
import { PricingSection } from "@/components/pricing-section";
import { GreenButton } from "@/components/green-button";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { TrustSection } from "@/components/trust-section";
import { FAQ } from "@/components/faq";
import { BrokerageCTA } from "@/components/brokerage-cta";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <Testimonials />
      <DemoSection />
      <SaleBanner />
      <BrokerageCTA />
       <ProcessSection />
      <TrustSection />
      <CTASection />
      <FAQ />
      
      <section className="py-16 bg-primary/5">
  <div className="mx-auto max-w-3xl px-4 text-center">
    <h2 className="text-2xl font-bold mb-3">Managing 5+ Agents?</h2>
    <p className="text-lg text-muted-foreground mb-6">
      Ask about bulk pricing for brokerages — as low as <span className="font-bold text-foreground">$49/video</span> per listing. No contracts.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a href="mailto:matt@realestatephoto2video.com" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
        Email Us
      </a>
      <a href="tel:+18455366954" className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors">
        Call (845) 536-6954
      </a>
    </div>
  </div>
</section>
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
