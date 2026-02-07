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
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="Logo" width={192} height={77} className="h-12 w-auto" />
            </Link> 
           
 <div className="hidden md:block h-10 w-[1px] bg-white/30" />
            <span className="hidden md:block text-lg text-primary-foreground/90 italic font-semibold">
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-8">
            <CountdownTimer />
            
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg">
              <Link href="/order">Get Started</Link>
            </Button>
          </div>

          <div className="xl:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-primary-foreground">
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="xl:hidden py-8 border-t border-white/10 bg-primary">
            <div className="flex flex-col gap-6 text-center px-4">
              <p className="text-primary-foreground italic font-semibold">A Professional video agency, not an app</p>
              <div className="flex justify-center py-3 bg-white/5 rounded-xl">
                <CountdownTimer />
              </div>
              <Button asChild className="bg-accent text-accent-foreground py-8 text-xl font-black">
                <Link href="/order">Order Now</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
