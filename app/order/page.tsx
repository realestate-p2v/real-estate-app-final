import Image from "next/image";
import Link from "next/link";
import { OrderForm } from "@/components/order-form";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ArrowLeft, Shield, Clock, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Your Video | Real Estate Photo 2 Video",
  description:
    "Upload your listing photos, select music, and order your professional walkthrough video. Fast 24-hour delivery."
};

const trustBadges = [
  { icon: Shield, text: "Secure Payment" },
  { icon: Clock, text: "72-Hour Delivery" },
  { icon: Award, text: "100% Satisfaction" },
];

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Trust Badges */}
      <div className="bg-primary/5 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-center gap-6 md:gap-12">
            {trustBadges.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 text-sm"
              >
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Let's Create Your Walkthrough Video
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your photos, arrange them in order, select your music, and
            checkout. We'll deliver your HD video within 72 hours.
          </p>
        </div>

        <OrderForm />
      </div>

      <WhatsAppButton />
    </main>
  );
}
