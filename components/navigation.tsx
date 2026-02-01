"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Trophy } from "lucide-react";
import { useState } from "react";
import { CountdownTimer } from "@/components/countdown-timer";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo & Agency Phrase Side-by-Side */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={150}
                height={60}
                className="h-8 md:h-10 w-auto"
              />
            </Link>
            <div className="hidden sm:block h-8 w-[1px] bg-white/20" /> {/* Vertical Divider */}
            <span className="hidden sm:block text-xs md:text-sm text-primary-foreground/80 italic font-medium leading-tight max-w-[140px]">
              We&apos;re a video agency, not an app...
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            
            {/* Gold Award Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] border border-yellow-300/50">
              <Trophy className="h-4 w-4 text-yellow-900" />
              <span className="text-yellow-950 text-[11px] font-black uppercase tracking-tight">
                Award Winning Support
              </span>
            </div>

            <div className="flex items-center gap-2 text-primary-foreground text-sm border-l border-white/10 pl-6">
              <span className="opacity-70">Sale ends:</span>
              <CountdownTimer />
            </div>

            <a
              href="#demo"
              className="text-primary-foreground hover:text-secondary font-medium text-sm"
            >
              Samples
            </a>
            
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 lg:hidden">
             <div className="flex items-center gap-1.5 bg-yellow-500 px-2 py-1 rounded-full border border-yellow-300">
                <Trophy className="h-3 w-3 text-yellow-900" />
                <span className="text-yellow-950 text-[9px] font-black uppercase">Support</span>
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
          <div className="lg:hidden py-6 border-t border-primary-foreground/20 bg-primary">
            <div className="flex flex-col gap-5 text-center">
               <p className="text-primary-foreground/70 italic text-sm">
                We&apos;re a video agency, not an app...
              </p>
              <div className="flex items-center justify-center gap-2 text-primary-foreground text-sm py-2 bg-white/5 rounded-lg">
                <CountdownTimer />
              </div>
              <a href="#demo" className="text-primary-foreground text-lg py-2" onClick={() => setIsOpen(false)}>
                Samples
              </a>
              <Button asChild className="bg-accent text-accent-foreground py-6 text-lg font-bold">
                <Link href="/order">Order Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
