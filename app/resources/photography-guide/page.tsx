"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Download, BookOpen, Camera, Lightbulb, Home, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PhotographyGuidePage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/guide-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setIsUnlocked(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left column — copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                Free Download — Second Edition
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                The Realtor's Guide to Real Estate Photography
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Everything you need to capture stunning listing photos that sell homes faster. 
                9 chapters covering camera settings, lighting, staging, shot lists, editing, 
                drone photography, and more.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Camera settings for phones and DSLRs that actually work",
                  "Room-by-room lighting guide (the #1 thing agents get wrong)",
                  "The exact shot list used by top-producing agents",
                  "10 common mistakes that kill your listing — and how to fix them",
                  "NEW: Complete DIY drone photography chapter with 2026 FCC ban guide",
                  "Quick reference checklists you can print and bring to every shoot",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground italic pt-2">
                23 pages · Printable checklists · No fluff, just actionable advice
              </p>
            </div>

            {/* Right column — email gate or download */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                {!isUnlocked ? (
                  <div className="bg-card rounded-2xl border border-border shadow-lg p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Camera className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Get Your Free Copy</h2>
                      <p className="text-sm text-muted-foreground">
                        Enter your email and the guide is yours instantly. No spam, just real estate marketing tips.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          type="email"
                          placeholder="you@yourbrokerage.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 text-base"
                          required
                        />
                        {error && (
                          <p className="text-sm text-red-500">{error}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                        ) : (
                          <>Download Free Guide</>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        We respect your inbox. Unsubscribe anytime.
                      </p>
                    </form>

                    <div className="border-t pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> 23 pages</span>
                      <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> 2nd Edition</span>
                      <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> PDF</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border-2 border-green-500 shadow-lg p-8 space-y-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Your Guide is Ready!</h2>
                    <p className="text-muted-foreground">
                      Click below to download your free copy. We also sent a confirmation to <strong>{email}</strong>.
                    </p>
                    
                    <Button
                      asChild
                      className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                    >
                      <a href="/Realtors_Guide_to_Real_Estate_Photography.pdf" download>
                        <Download className="mr-2 h-5 w-5" />
                        Download PDF Guide
                      </a>
                    </Button>

                    <div className="border-t pt-6 space-y-3">
                      <p className="text-sm font-semibold text-foreground">Ready to turn your photos into a video?</p>
                      <Button asChild variant="outline" className="w-full h-11">
                        <Link href="/order">
                          Create My Listing Video — 15% off with code PHOTO15
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Inside Section */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">What's Inside the Guide</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: "Camera Settings", desc: "Smartphone and DSLR settings optimized for real estate. Wide-angle, HDR, tripod techniques." },
              { icon: Lightbulb, title: "Lighting Mastery", desc: "Room-by-room lighting guide. Golden hour, mixed lighting, and the one rule that fixes 80% of bad photos." },
              { icon: Home, title: "Staging Quick Wins", desc: "15-minute staging tricks that transform photos. The 5-item kit every agent should bring to shoots." },
              { icon: BookOpen, title: "Complete Shot List", desc: "The 25-35 photo checklist used by top agents. Never miss a key room or angle again." },
              { icon: Sparkles, title: "DIY Drone Photography", desc: "2026 drone guide with FCC ban explained, 6 recommended drones, FAA rules, and the 5-shot aerial list." },
              { icon: CheckCircle, title: "Quick Reference Cards", desc: "Printable checklists, camera settings table, drone comparison chart. Bring to every shoot." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Better Photos. Better Videos. More Sales.</h2>
          <p className="text-muted-foreground text-lg">
            Great listing photos are just the beginning. At Real Estate Photo 2 Video, 
            we turn your photos into cinematic walkthrough videos — delivered in 24 hours, 
            starting at $79.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
              <Link href="/order">Create My Listing Video</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-lg">
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <p className="mt-1">realestatephoto2video.com</p>
        </div>
      </footer>
    </div>
  );
}
