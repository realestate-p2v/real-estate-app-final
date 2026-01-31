import { ShieldCheck, Star } from "lucide-react";

export function TrustSection() {
  return (
    <section className="bg-slate-50 border-y border-slate-200 py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Social Proof / Stars */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="font-semibold text-slate-900">
              Trusted by over 5,000 realtors
            </p>
          </div>

          {/* Testimonial */}
          <div className="text-center italic text-slate-600 px-4 border-x-0 md:border-x border-slate-200">
            <p className="text-sm md:text-base leading-relaxed">
              "The best marketing investment I've made this year. High quality and incredibly fast!"
            </p>
            <span className="block mt-2 font-medium text-slate-900 not-italic text-sm">
              — Sarah J., Top Producer
            </span>
          </div>

          {/* Secure Payment */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
            <div className="flex items-center text-slate-700 font-medium">
              <ShieldCheck className="h-6 w-6 text-green-600 mr-2" />
              <span>Secure Payments</span>
            </div>
            {/* Stripe Badge Placeholder - Using text/icon to match your style, but you can swap for an SVG */}
            <div className="flex items-center space-x-2 grayscale opacity-70">
                <span className="text-xs uppercase tracking-widest font-bold">Powered by Stripe</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
