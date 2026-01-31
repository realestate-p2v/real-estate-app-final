import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";

export function TrustSection() {
  return (
    <section className="bg-slate-50/50 border-y border-slate-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
          
          {/* Social Proof */}
          <div className="flex flex-col items-center md:items-start space-y-2 flex-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Trusted by 5,000+ Realtors
            </p>
          </div>

          {/* Timothy Wolfe Testimonial */}
          <div className="flex flex-col md:flex-row items-center gap-4 flex-[2] max-w-2xl">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
              <Image
                src="/timothy-wolfe.jpg" // Make sure to save the photo as this name in /public
                alt="Timothy Wolfe"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-slate-700 leading-relaxed font-medium">
                "Photo 2 Video saves me so much time and money. My video listings convert significantly better on social media—it's been a huge improvement for my business."
              </p>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-bold text-slate-900">Timothy Wolfe</span> • Howard Hanna Realty
              </p>
            </div>
          </div>

          {/* Stripe / Secure Payment */}
          <div className="flex flex-col items-center md:items-end space-y-2 flex-1">
            <div className="flex items-center space-x-2 text-slate-800">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-sm uppercase tracking-tight">Secure Checkout</span>
            </div>
            <div className="flex items-center opacity-60">
                {/* Standard Stripe style text for a clean look */}
                <span className="text-[10px] font-semibold uppercase tracking-widest mr-1">Powered by</span>
                <span className="text-lg font-bold tracking-tighter italic">stripe</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
