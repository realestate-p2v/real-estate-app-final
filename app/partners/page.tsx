"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Camera, DollarSign, Users, ArrowRight, Mail, CheckCircle } from "lucide-react";

const STEPS = [
  { num: "1", title: "Sign Up", desc: "Email us to get your unique referral link. Takes 2 minutes." },
  { num: "2", title: "Refer Agents", desc: "Share your link with agents you work with. When they order, you earn." },
  { num: "3", title: "Get Paid", desc: "Earn 20% commission on every order placed through your link. Paid monthly." },
];

const BENEFITS = [
  { icon: DollarSign, title: "20% Commission", desc: "Earn 20% on every order. A single 25-photo order at $129 earns you $25.80." },
  { icon: Users, title: "Recurring Revenue", desc: "Agents reorder for every new listing. One referral can pay out for months." },
  { icon: Camera, title: "Complement Your Work", desc: "Your photos become cinematic videos. Agents get more value, you get more bookings." },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            <Camera className="h-4 w-4" />
            Photographer Partner Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Earn 20% on Every Referral
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You shoot the photos. We turn them into videos. Your agents get more value 
            and you earn a commission on every order they place.
          </p>
        </div>

        {/* How it works */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          {STEPS.map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                {s.num}
              </div>
              <h3 className="font-bold text-lg text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-5 mb-14">
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 flex items-start gap-5">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                <p className="text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Example earnings */}
        <div className="bg-muted/50 rounded-2xl border border-border p-8 mb-14">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">Example Earnings</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-3xl font-extrabold text-primary">$15.80</p>
              <p className="text-sm text-muted-foreground mt-1">per Starter order ($79)</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-3xl font-extrabold text-primary">$25.80</p>
              <p className="text-sm text-muted-foreground mt-1">per Professional order ($129)</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <p className="text-3xl font-extrabold text-primary">$35.80</p>
              <p className="text-sm text-muted-foreground mt-1">per Premium order ($179)</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Refer 10 agents who each order once per month = <strong className="text-foreground">$258/month passive income</strong>
          </p>
        </div>

        {/* Who it's for */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-4">Perfect For</h2>
          <div className="space-y-2">
            {[
              "Real estate photographers looking to add a revenue stream",
              "Photographers who already deliver listing photos to agents",
              "Videographers who want to offer video without the editing work",
              "Anyone connected to real estate agents in their market",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Email us to get your unique referral link and start earning 20% on every order. 
            No contracts, no minimums, no cost to join.
          </p>
          <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
            <a href="mailto:matt@realestatephoto2video.com?subject=Partner Program Inquiry&body=Hi Matt, I'm interested in the photographer partner program. My name is [your name] and I'm a real estate photographer in [your city].">
              <Mail className="mr-2 h-5 w-5" />
              Email Us to Get Started
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">matt@realestatephoto2video.com</p>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/resources/photography-guide" className="hover:text-foreground transition-colors">Free Guide</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
