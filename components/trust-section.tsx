import Image from "next/image";
import { ShieldCheck, Lock, CreditCard } from "lucide-react";

export function TrustSection() {
  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Compact Testimonial & Security Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-gray-50 p-6 md:p-8 rounded-2xl shadow-sm">
          {/* Smaller, Sharp Headshot */}
          <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
            <Image 
              src="/timothy-wolfe.jpg" 
              alt="Timothy Wolfe" 
              fill
              className="object-cover"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex justify-center md:justify-start gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <p className="text-lg font-semibold text-gray-800 leading-snug italic mb-3">
              "P2V has completely changed how I market my listings. The quality is exceptional and the delivery is so fast—my clients are always impressed!"
            </p>
            <div className="text-sm">
              <span className="font-bold text-gray-900">Timothy Wolfe</span>
              <span className="text-gray-500 ml-2">— Realtor & Professional</span>
            </div>
          </div>
        </div>

        {/* Streamlined Security Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <CreditCard className="text-[#635bff] w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-700">Secure Stripe Checkout</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Lock className="text-green-500 w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-700">SSL Encrypted Connection</span>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-end">
            <ShieldCheck className="text-blue-500 w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-700">100% Satisfaction Guaranteed</span>
          </div>
        </div>

        {/* Mini Payment Logos */}
        <div className="mt-8 flex justify-center items-center gap-6 opacity-30 grayscale filter scale-90">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
        </div>
      </div>
    </section>
  );
}
