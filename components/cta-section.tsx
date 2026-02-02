import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-primary py-20 md:py-28 relative overflow-hidden">
      {/* Ultra-low saturation glow - almost white-pink */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFF0F0]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-8">
          {/* Muted Icon Container */}
          <div className="bg-[#FFF0F0]/10 rounded-full p-4 animate-bounce-slow">
            <Zap className="h-12 w-12 text-[#b94b4b]" />
          </div>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black text-primary-foreground text-balance tracking-tight">
          Ready to <span className="text-[#b94b4b]">Skyrocket</span> Your Sales?
        </h2>
        
        <p className="mt-8 text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto font-medium">
          Get your professional walkthrough video hand-edited and delivered in under 72 hours. 
        </p>

        <div className="mt-12 flex flex-col items-center gap-6">
          {/* HIGH CONVERSION GREEN BUTTON */}
          <Button
            asChild
            size="lg"
            className="group bg-[#22c55e] hover:bg-[#16a34a] text-white text-xl md:text-2xl px-12 py-10 md:py-12 rounded-2xl shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_50px_rgba(34,197,94,0.5)] transition-all duration-300 hover:-translate-y-1 active:scale-95 w-full md:w-auto font-black italic"
          >
            <Link href="/order" className="flex items-center justify-center gap-3">
              GET STARTED NOW — <span className="line-through opacity-60 font-normal">$149</span> $79
              <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>

          {/* Muted Desaturated Icons */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-6">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5 text-[#FFDADA]" />
              100% Satisfaction
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <Clock className="h-5 w-5 text-[#FFDADA]" />
              Fast 72h Delivery
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-5 w-5 text-[#FFDADA]" />
              Secure Checkout
            </div>
          </div>
        </div>

        <p className="mt-8 text-primary-foreground/50 text-sm">
          No subscription required. One-time payment per listing.
        </p>
      </div>
    </section>
  );
}
