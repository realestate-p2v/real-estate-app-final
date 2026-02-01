import Image from "next/image";
import { ShieldCheck, Star, CheckCircle2 } from "lucide-react";

export function TrustSection() {
  return (
    <section className="bg-white border-y border-slate-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          {/* 1. The Guarantee - Focus on "Approval First" */}
          <div className="flex items-start space-x-4">
            <div className="bg-green-50 p-3 rounded-2xl">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 leading-tight">100% Approval Guarantee</h4>
              <p className="text-sm text-slate-600 mt-1">
                Receive your watermarked preview first. Request a revision if it&apos;s not perfect. You only pay for the final, polished video.
              </p>
            </div>
          </div>

          {/* 2. Timothy Wolfe Testimonial */}
          <div className="flex flex-col items-center text-center px-6 lg:border-x lg:border-slate-100">
            <div className="relative h-14 w-14 mb-4 overflow-hidden rounded-full ring-4 ring-slate-50">
              <Image
                src="/timothy-wolfe.jpg"
                alt="Timothy Wolfe"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-slate-700 italic text-sm leading-relaxed">
              &quot;Photo 2 Video saves me so much time and money. My listings convert significantly better on social media—it&apos;s been a huge improvement.&quot;
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Timothy Wolfe • Howard Hanna
            </p>
          </div>

          {/* 3. Ratings & Security */}
          <div className="flex flex-col items-center lg:items-end space-y-4">
            <div className="text-center lg:text-right">
              <div className="flex justify-center lg:justify-end text-yellow-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-900">Trusted by 5,000+ Realtors</p>
            </div>
            
            <div className="flex items-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <ShieldCheck className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 mr-2">Secure via</span>
              <span className="text-sm font-black italic tracking-tighter text-slate-800 underline decoration-blue-500/30">stripe</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
