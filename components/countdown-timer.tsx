"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { CountdownTimer } from "@/components/countdown-timer";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo & Agency Phrase */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Real Estate Photo 2 Video"
                width={160}
                height={64}
                className="h-10 md:h-12 w-auto"
              />
            </Link>
            <div className="hidden md:block h-10 w-[1px] bg-white/30" />
            <span className="hidden md:block text-lg lg:text-xl text-primary-foreground/90 italic font-semibold tracking-tight whitespace-nowrap">
              A professional video agency, not an app
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-8">
            <CountdownTimer />

            <a
              href="#demo"
              className="text-primary-foreground hover:text-secondary font-bold text-sm transition-colors"
            >
              Samples
            </a>
            
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg shadow-xl"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="xl:hidden flex items-center">
            <button
              type="button"
              className="p-2 text-primary-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="xl:hidden py-8 border-t border-primary-foreground/20 bg-primary shadow-2xl">
            <div className="flex flex-col gap-6 text-center px-4">
               <p className="text-primary-foreground italic text-lg font-semibold border-b border-white/10 pb-4">
                A Professional video agency, not an app
              </p>
              <div className="flex justify-center py-3 bg-white/5 rounded-xl">
                <CountdownTimer />
              </div>
              <a href="#demo" className="text-primary-foreground text-xl font-bold py-2" onClick={() => setIsOpen(false)}>
                View Samples
              </a>
              <Button asChild className="bg-accent text-accent-foreground py-8 text-xl font-black shadow-lg">
                <Link href="/order">Order Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
