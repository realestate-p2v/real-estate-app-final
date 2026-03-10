"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How does it work?",
    a: "Upload your listing photos, arrange them in order, choose your music and branding, then checkout. Our AI generates cinematic camera movements for each photo and assembles them into a professional walkthrough video. You'll receive it within 24 hours."
  },
  {
    q: "How long does delivery take?",
    a: "Most videos are delivered within 24 hours. After you submit your order, our team reviews the final video for quality before sending it to your inbox with a Google Drive download link."
  },
  {
    q: "What photos should I upload?",
    a: "Upload high-quality photos of every room and exterior angle you want in the video. The more photos, the longer and more detailed your video. We recommend 10-25 photos for the best result. Make sure photos are well-lit and in landscape orientation."
  },
  {
    q: "Can I choose the camera movements?",
    a: "Yes! Each photo has a camera direction selector where you can choose from movements like Forward, Back, Orbit, Look Up, Rise, and more. You can also set the speed (Slow, Med, Fast) or write your own custom camera movement description. If you leave it on Auto, our AI will choose the best movement for each shot."
  },
  {
    q: "What music options do you have?",
    a: "We offer 7 curated background tracks across different vibes — tropical, acoustic, classical, pop, and more. You can also generate custom AI music by selecting a vibe preset, or upload your own audio track."
  },
  {
    q: "Can I include my branding?",
    a: "Absolutely. You can add your name, brokerage, phone number, email, and website as a lower-third overlay on the video. You can also upload your logo. Branding is included free with every order."
  },
  {
    q: "What about professional voiceover?",
    a: "We offer AI-generated voiceover narration for an additional $25. Choose from 4 professional voices (2 male, 2 female). You can write your own script or let our AI generate one based on your listing details."
  },
  {
    q: "How much does it cost?",
    a: "Pricing starts at $79 for up to 15 photos, $129 for up to 25 photos, and $179 for up to 35 photos. Optional add-ons include voiceover ($25), 1080P HD upgrade ($10), and photo editing ($2.99/photo). Two free revisions are included with every order."
  },
  {
    q: "What if I need changes?",
    a: "Every order includes 2 free revisions. After delivery, you can request specific changes to individual clips — change camera direction, speed, or describe what you want different. We'll regenerate only the clips you flag and deliver a revised video within 24 hours."
  },
  {
    q: "Do you offer photo editing?",
    a: "Yes! For $2.99 per photo, our AI automatically corrects brightness, contrast, saturation, white balance, and straightens horizons. You'll receive both the corrected photos and the video. Toggle it on in the order form to add it to any order."
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
        <p className="text-center text-muted-foreground mb-10">Everything you need to know about our service</p>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
