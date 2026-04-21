import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { Testimonials } from "@/components/testimonials";
import { DemoSection } from "@/components/demo-section";
import { ProcessSection } from "@/components/process-section";
import LensySmart from "@/components/lensy/lensy-smart";
import { SaleBanner } from "@/components/sale-banner";
import { CTASection } from "@/components/cta-section";
import { PricingSection } from "@/components/pricing-section";
import { GreenButton } from "@/components/green-button";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";
import { TrustSection } from "@/components/trust-section";
import { FAQ } from "@/components/faq";
import { BrokerageCTA } from "@/components/brokerage-cta";
import { LensIntroSection } from "@/components/lens-intro-section";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <DemoSection />
      <SaleBanner />
      <BrokerageCTA />
      <ProcessSection />
      <LensIntroSection />
      <TrustSection />
      <CTASection />
      <FAQ />
       <Testimonials />
      <ContactSection />
      <LensySmart />
      <Footer />
    </main>
  );
}
