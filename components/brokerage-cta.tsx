"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, CheckCircle, ArrowRight, Loader2, Check, Mail } from "lucide-react";

export function BrokerageCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [agents, setAgents] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !company) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: `Brokerage Inquiry — ${company}`,
          message: `Brokerage: ${company}\nContact: ${name}\nEmail: ${email}\nEstimated agents: ${agents || "Not specified"}\n\nSubmitted from homepage brokerage CTA.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Manage an Agency?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Give every agent cinematic listing videos at bulk rates.
          </p>
        </div>

        <div className="bg-primary rounded-2xl p-8 sm:p-10 lg:p-12 relative overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative grid lg:grid-cols-2 gap-8 items-start">
            {/* Left — copy + checklist */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-5">
                <Building2 className="h-4 w-4 text-white/70" />
                <span className="text-white/80 text-sm font-medium">For Brokerages</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Listing Videos for Your Entire Team
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                Per-clip pricing from <span className="text-white font-bold">$2.99/clip</span>.
                No long-term contracts. Every agent gets branded cinematic videos delivered in 24 hours.
              </p>

              {/* Feature checklist */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 space-y-3 mb-6">
                {[
                  "Per-clip pricing from $2.99 (Enterprise tier)",
                  "24-hour delivery, 1 free revision per listing",
                  "Agent branding on every video",
                  "P2V Lens AI coaching — $19.95/agent/month",
                  "Exclusive bulk video pricing with Lens subscription",
                  "10+ listings/month to qualify",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-white/90 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-6 py-5 text-base">
                <Link href="/pricing/brokerage">
                  View Full Pricing & Tiers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right — contact form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">We&apos;ll be in touch!</h3>
                  <p className="text-white/70 text-sm">
                    Expect a reply within a few hours. In the meantime, check out our pricing.
                  </p>
                  <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold mt-2">
                    <Link href="/pricing/brokerage">View Brokerage Pricing</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Get Brokerage Pricing</h3>
                    <p className="text-white/60 text-sm">We&apos;ll reach out with a custom quote.</p>
                  </div>
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
                  />
                  <Input
                    placeholder="Brokerage name *"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
                  />
                  <Input
                    placeholder="Approx. number of agents"
                    value={agents}
                    onChange={(e) => setAgents(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11"
                  />
                  {error && <p className="text-red-300 text-sm">{error}</p>}
                  <Button
                    type="submit"
                    disabled={submitting || !email || !company}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-5 text-base"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Get a Custom Quote
                  </Button>
                  <p className="text-white/40 text-xs text-center">
                    Or email matt@realestatephoto2video.com directly
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
