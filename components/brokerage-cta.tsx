import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, ArrowRight } from "lucide-react";

export function BrokerageCTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-2xl p-8 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
                <Building2 className="h-4 w-4 text-white/70" />
                <span className="text-white/80 text-sm font-medium">For Brokerages</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Listing Videos for Your Entire Team
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                Bulk pricing from <span className="text-white font-bold">$2.99/clip</span>. 
                No contracts. Every agent gets branded cinematic videos delivered in 24 hours.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-6 py-5 text-base">
                  <Link href="/pricing/brokerage">
                    View Brokerage Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild className="bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white px-6 py-5 text-base font-bold">
                  <a href="mailto:matt@realestatephoto2video.com?subject=Brokerage Inquiry&body=Hi Matt, I'm interested in brokerage pricing for listing videos. Our brokerage is [company name] and we have approximately [X] agents.">
                    Contact Us
                  </a>
                </Button>
              </div>
            </div>

            {/* Right — feature checklist */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
              {[
                "Per-clip pricing from $2.99 (Enterprise)",
                "24-hour delivery, 1 free revision included",
                "Agent branding on every video",
                "P2V Lens AI coaching — $19.95/agent/month",
                "10% off video orders with Lens subscription",
                "No contracts, no minimums",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-white/90 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
