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
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={150}
              height={60}
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary-foreground text-sm">
              <span className="opacity-80">Sale ends:</span>
              <CountdownTimer />
            </div>
            <a
              href="#demo"
              className="text-primary-foreground hover:text-secondary font-medium"
            >
              View Sample
            </a>
            <a
              href="#pricing"
              className="text-primary-foreground hover:text-secondary font-medium"
            >
              Pricing
            </a>
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Link href="/order">Order Now</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-primary-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/20">
            <div className="flex flex-col gap-4">
              <a
                href="#demo"
                className="text-primary-foreground hover:text-secondary font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                View Sample
              </a>
              <a
                href="#pricing"
                className="text-primary-foreground hover:text-secondary font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
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
