import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
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

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <DemoSection />
      <ProcessSection />
      <SaleBanner />
     
    <TrustSection /> {/* Placed right under Hero */}
      
      <CTASection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
