import Image from "next/image";
import { ShieldCheck, Lock, CreditCard, CheckCircle2 } from "lucide-react";

export function TrustSection() {
  return (
    <section className="py-24 bg-white overflow-hidden border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Timothy Wolfe Testimonial --- */}
        <div className="relative bg-gray-50 rounded-3xl p-8 md:p-12 shadow-sm mb-20">
          {/* Subtle Quote Background Icon */}
          <div className="absolute top-6 left-6 text-gray-200 opacity-50 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-4 3.638-4 5.849h4v10h-10z"/></svg>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Professional Headshot */}
            <div className="flex-shrink-0">
              <div className="relative h-32 w-32 md:h-44 md:w-44 rounded-2xl overflow-hidden shadow-xl rotate-2">
                <Image 
                  src="/timothy-wolfe.jpg" 
                  alt="Timothy Wolfe, Realtor" 
                  fill
                  className="object-cover -rotate-2 scale-110"
                />
              </div>
            </div>
            
            {/* The Quote */}
            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex justify-center md:justify-start gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed mb-6">
                "P2V has completely changed how I market my listings. The quality is exceptional and the delivery is so fast that I can get my homes on the market immediately. My clients are always impressed!"
              </blockquote>
              <div>
                 <div className="font-bold text-gray-900 text-lg">Timothy Wolfe</div>
                 <div className="text-green-600 font-bold tracking-tight">Realtor & Real Estate Professional</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Secure Checkout Section --- */}
        <div className="pt-12 border-t border-gray-100">
          <div className="flex flex-col items-center">
            <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-10 text-center">
              Trusted Industry Standard Security
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              {/* Stripe Security */}
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <CreditCard className="text-[#635bff] w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Secure Stripe Payment</h4>
                  <p className="text-sm text-gray-500">256-bit AES encryption</p>
                </div>
              </div>

              {/* SSL Security */}
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Lock className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">SSL Encrypted Connection</h4>
                  <p className="text-sm text-gray-500">Your data is always protected</p>
                </div>
              </div>

              {/* Guarantee */}
              <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <ShieldCheck className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">100% Satisfaction</h4>
                  <p className="text-sm text-gray-500">Love your video or we'll fix it</p>
                </div>
              </div>
            </div>
            
            {/* Stripe & Major Card Logos Bar */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
