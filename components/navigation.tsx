"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Headphones } from "lucide-react";
import { useState } from "react";
import { CountdownTimer } from "@/components/countdown-timer";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Agency Phrase */}
          <div className="flex flex-col">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={150}
                height={60}
                className="h-8 md:h-10 w-auto"
              />
            </Link>
            <span className="text-[10px] md:text-xs text-primary-foreground/70 italic font-medium leading-none mt-1">
              We&apos;re a video agency, not an app...
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Customer Service Badge */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
              <Headphones className="h-4 w-4 text-secondary" />
              <span className="text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                24/7 Support
              </span>
            </div>

            <div className="flex items-center gap-2 text-primary-foreground text-sm border-l border-white/20 pl-6">
              <span className="opacity-80">Sale ends:</span>
              <CountdownTimer />
            </div>

            <a
              href="#demo"
              className="text-primary-foreground hover:text-secondary font-medium text-sm transition-colors"
            >
              Samples
            </a>
            
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
             <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/20">
                <Headphones className="h-3 w-3 text-secondary" />
                <span className="text-primary-foreground text-[9px] font-bold uppercase">Support</span>
              </div>
            <button
              type="button"
              className="p-2 text-primary-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-primary-foreground/20 bg-primary">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-center gap-2 text-primary-foreground text-sm py-2 bg-white/5 rounded-lg">
                <span className="opacity-80">Sale ends:</span>
                <CountdownTimer />
              </div>
              
              <a
                href="#demo"
                className="text-primary-foreground text-center text-lg font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                View Samples
              </a>
              
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground w-full py-6 text-lg font-bold"
              >
                <Link href="/order">Order Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
}
