"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, FileText, LayoutDashboard } from "lucide-react";
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
    setIsOpen(false);
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = (displayName.charAt(0) || "U").toUpperCase();

  return (
    <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Left — Logo + Timer */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="Logo" width={192} height={77} className="h-12 w-auto" />
            </Link> 
            <div className="hidden md:block h-10 w-[1px] bg-white/30" />
            <div className="hidden md:block">
              <CountdownTimer />
            </div>
          </div>
         
          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-8">
            <Link href="/portfolio" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
              Portfolio
            </Link>
            <Link href="/resources/photography-guide" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
              Free Guide
            </Link>
            
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg">
              <Link href="/order">Create My Listing Video</Link>
            </Button>

            {!user && (
              <Link href="/login" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
                Sign In
              </Link>
            )}

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 hover:border-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-full w-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                      {initial}
                    </div>
                  )}
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
            )}
          </div>

          {/* Mobile — Hamburger only */}
          <div className="xl:hidden">
            <button onClick={() => { setIsOpen(!isOpen); setShowDropdown(false); }} className="p-2 text-primary-foreground">
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="xl:hidden py-5 border-t border-white/10 bg-primary">
            <div className="flex flex-col gap-1 px-4">

              {/* User info bar (if logged in) */}
              {user && (
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 mb-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-full w-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-primary-foreground font-semibold text-sm truncate">{displayName}</p>
                    <p className="text-primary-foreground/50 text-xs truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Timer */}
              <div className="flex justify-center py-2 bg-white/5 rounded-xl mb-3 md:hidden">
                <CountdownTimer />
              </div>

              {/* Nav Links */}
              <Link href="/portfolio" onClick={() => setIsOpen(false)}
                className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                Portfolio
              </Link>
              <Link href="/resources/photography-guide" onClick={() => setIsOpen(false)}
                className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                Free Photography Guide
              </Link>

              {/* Account links (if logged in) */}
              {user && (
                <>
                  <div className="h-[1px] bg-white/10 my-2" />
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}
                    className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                    <LayoutDashboard className="h-4 w-4 text-primary-foreground/60" />
                    My Dashboard
                  </Link>
                  <Link href="/dashboard/drafts" onClick={() => setIsOpen(false)}
                    className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary-foreground/60" />
                    Saved Drafts
                  </Link>
                  <button onClick={handleSignOut}
                    className="text-red-300 font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 w-full text-left">
                    <LogOut className="h-4 w-4 text-red-300/60" />
                    Sign Out
                  </button>
                </>
              )}

              {/* Sign In (if logged out) */}
              {!user && (
                <>
                  <div className="h-[1px] bg-white/10 my-2" />
                  <Link href="/login" onClick={() => setIsOpen(false)}
                    className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                    <User className="h-4 w-4 text-primary-foreground/60" />
                    Sign In
                  </Link>
                </>
              )}

              {/* CTA */}
              <div className="mt-3">
                <Button asChild className="w-full bg-accent text-accent-foreground py-5 text-lg font-black">
                  <Link href="/order" onClick={() => setIsOpen(false)}>Order Now</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
