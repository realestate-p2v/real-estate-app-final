"use client";

import React from "react"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Phone, Mail, MessageCircle } from "lucide-react";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight text-balance">
                Let's get in touch
              </h2>
              <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
                Ready to elevate your real estate listings? Reach out directly—we'd love to hear from you.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Phone Card */}
              <a 
                href="tel:+18455366954" 
                className="group flex items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-transparent hover:border-primary/20 hover:bg-primary/10 transition-all duration-300"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                  <Phone className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-primary">Call or Text</p>
                  <p className="text-2xl md:text-3xl font-black text-foreground">1 (845) 536-6954</p>
                </div>
              </a>

              {/* Email Card */}
              <a 
                href="mailto:realestatephoto2video@gmail.com" 
                className="group flex items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-transparent hover:border-primary/20 hover:bg-primary/10 transition-all duration-300"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold uppercase tracking-wider text-primary">Email Us</p>
                  <p className="text-xl md:text-2xl font-black text-foreground truncate">realestatephoto2video@gmail.com</p>
                </div>
              </a>

              {/* WhatsApp Card */}
              <a 
                href="https://wa.me/18455366954" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-6 p-6 rounded-2xl bg-[#25D366]/5 border border-transparent hover:border-[#25D366]/20 hover:bg-[#25D366]/10 transition-all duration-300"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#25D366]">WhatsApp</p>
                  <p className="text-2xl md:text-3xl font-black text-foreground">Message Now</p>
                </div>
              </a>
            </div>
          </div>

          {/* You can place your Contact Form code here in the second column */}
          <div className="bg-card p-8 rounded-3xl border shadow-sm">
             {/* Form content goes here... */}
             <p className="text-center text-muted-foreground italic">Form placeholder</p>
          </div>
        </div>
      </div>
    </section>
  );
}
