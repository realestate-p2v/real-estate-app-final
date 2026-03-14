"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Search,
  MessageCircle,
  Mail,
  ChevronDown,
  CheckCircle,
  Loader2,
  Clock,
  RefreshCw,
  CreditCard,
  HelpCircle,
} from "lucide-react";

const FAQS = [
  {
    q: "How long does it take to receive my video?",
    a: "Most orders are delivered within 24 hours. During peak times, it may take up to 48 hours. You'll receive an email with a Google Drive link to watch and download your video.",
  },
  {
    q: "How do revisions work?",
    a: "Every order includes 2 free revisions. Just reply to your delivery email with the shot numbers and what you'd like changed. We only regenerate the clips you flag — everything else stays the same. 3rd+ revisions are available at a small per-clip fee.",
  },
  {
    q: "What photo quality do you need?",
    a: "For best results, upload the highest quality photos you have. The minimum dimension is 768px on the shortest side. We recommend at least 2000px wide for HD video quality. Most modern phone photos work great.",
  },
  {
    q: "Can I choose the camera movements?",
    a: "Yes! Each photo in the uploader has a camera direction picker where you can choose from 11 movements (forward, back, orbit, tilt, rise, etc.) plus speed control. Or leave it on Auto and our AI picks the best movement for each photo.",
  },
  {
    q: "What's the difference between 768P and 1080P?",
    a: "768P HD is included with every order and looks great on most screens and listing sites. 1080P Full HD (+$10) is crystal-clear and recommended for luxury listings, large displays, and YouTube.",
  },
  {
    q: "Do you offer refunds?",
    a: "If you're not satisfied after your 2 free revisions, contact us and we'll work with you to make it right. We want every agent to love their video.",
  },
  {
    q: "What is the Listing URL mode?",
    a: "Instead of uploading photos yourself, you can paste your Zillow, Realtor.com, or MLS listing URL and we'll pull and sequence the photos for you. There's a +$25 service fee for this convenience.",
  },
  {
    q: "Can I get both landscape and vertical versions?",
    a: "Yes! Select 'Both' in the orientation selector for +$15. You'll get a landscape version (16:9) for MLS and Zillow, plus a vertical version (9:16) for Instagram Reels, TikTok, and YouTube Shorts.",
  },
  {
    q: "What does photo editing include?",
    a: "For $2.99/photo, we auto-correct brightness, contrast, saturation, white balance, horizon straightening, and lens distortion using AI-powered analysis. Every correction is reviewed by a real editor before delivery.",
  },
  {
    q: "Do you work with brokerages?",
    a: "Yes! We offer bulk pricing starting at $49/video for 10+ orders per month, with no contract required. Email matt@realestatephoto2video.com to discuss brokerage pricing.",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", orderNumber: "", message: "" });
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filteredFaqs = searchQuery.trim()
    ? FAQS.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQS;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setIsSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      setSent(true);
    } catch {
      alert("Failed to send. Please email us directly at matt@realestatephoto2video.com");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">How Can We Help?</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Find answers below or get in touch. We typically respond within a few hours.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <Clock className="h-6 w-6 text-primary mx-auto" />
            <h3 className="font-bold text-foreground">24-Hour Delivery</h3>
            <p className="text-sm text-muted-foreground">Most orders delivered same day or next morning</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <RefreshCw className="h-6 w-6 text-primary mx-auto" />
            <h3 className="font-bold text-foreground">2 Free Revisions</h3>
            <p className="text-sm text-muted-foreground">Included with every order, no questions asked</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center space-y-2">
            <CreditCard className="h-6 w-6 text-primary mx-auto" />
            <h3 className="font-bold text-foreground">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">Powered by Stripe with SSL encryption</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No matching questions found. Try a different search or contact us below.</p>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
          </div>

          {sent ? (
            <div className="bg-card rounded-2xl border-2 border-green-500 p-8 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Message Sent!</h3>
              <p className="text-muted-foreground">We'll get back to you within a few hours. Check your email for our response.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    placeholder="Jane Smith"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Order Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  placeholder="If this is about an existing order"
                  value={contactForm.orderNumber}
                  onChange={(e) => setContactForm({ ...contactForm, orderNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="How can we help?"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={isSending} className="w-full py-6 text-base bg-primary">
                {isSending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</> : <>Send Message</>}
              </Button>
            </form>
          )}
        </div>

        {/* WhatsApp + Email */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          <a
            href="https://wa.me/18455366954?text=Hi%20Matt%2C%20I%20have%20a%20question%20about%20Real%20Estate%20Photo%202%20Video"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-green-500 hover:shadow-sm transition-all"
          >
            <div className="h-11 w-11 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Chat with us directly</p>
            </div>
          </a>
          <a
            href="mailto:matt@realestatephoto2video.com"
            className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Email</h3>
              <p className="text-sm text-muted-foreground">matt@realestatephoto2video.com</p>
            </div>
          </a>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8">
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
