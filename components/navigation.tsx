"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { CountdownTimer } from "@/components/countdown-timer";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowDropdown(false);
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";

  return (
    <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="Logo" width={192} height={77} className="h-12 w-auto" />
            </Link> 
            <div className="hidden md:block h-10 w-[1px] bg-white/30" />
            <div className="hidden md:block">
              <CountdownTimer />
            </div>
          </div>
         
          <div className="hidden xl:flex items-center gap-8">
            <Link href="/portfolio" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
              Portfolio
            </Link>
            <Link href="/resources/photography-guide" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
              Free Guide
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <span className="text-primary-foreground/50">&#9662;</span>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      My Dashboard
                    </Link>
                    <Link href="/dashboard/drafts" onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      Saved Drafts
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
                <User className="h-4 w-4" />
                Sign In
              </Link>
            )}
            
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg">
              <Link href="/order">Create My Listing Video</Link>
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
              <Link href="/portfolio" onClick={() => setIsOpen(false)} className="text-primary-foreground text-lg font-semibold py-3">
                Portfolio
              </Link>
              <Link href="/resources/photography-guide" onClick={() => setIsOpen(false)} className="text-primary-foreground text-lg font-semibold py-3">
                Free Photography Guide
              </Link>

              {user ? (
                <>
                  <div className="bg-white/5 rounded-xl py-3 px-4">
                    <p className="text-primary-foreground font-semibold">{displayName}</p>
                    <p className="text-primary-foreground/60 text-sm">{user.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-primary-foreground text-lg font-semibold py-3">
                    My Dashboard
                  </Link>
                  <Link href="/dashboard/drafts" onClick={() => setIsOpen(false)} className="text-primary-foreground text-lg font-semibold py-3">
                    Saved Drafts
                  </Link>
                  <button onClick={handleSignOut} className="text-red-300 text-lg font-semibold py-3">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-primary-foreground text-lg font-semibold py-3 flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  Sign In
                </Link>
              )}

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
