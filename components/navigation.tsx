"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Bell, FileText, LayoutDashboard, Video, ChevronDown, BookOpen, Camera, HelpCircle, Users, Shield, Play, Building2, Sparkles, Settings, Home, Film } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { CountdownTimer } from "@/components/countdown-timer";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notification-bell";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

/* Avatar ring-pulse animation — fires every 15s */
const navStyles = `
  @keyframes avatar-ring-pulse {
    0%, 80%  { box-shadow: 0 0 0 0 transparent; }
    87%      { box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.6); }
    93%      { box-shadow: 0 0 0 5px rgba(74, 222, 128, 0.3); }
    100%     { box-shadow: 0 0 0 7px rgba(74, 222, 128, 0); }
  }
  .avatar-ring-hint {
    animation: avatar-ring-pulse 7s ease-in-out infinite;
  }
`;

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [brokerageInfo, setBrokerageInfo] = useState<{ company: string } | null>(null);
  const [isLensSubscriber, setIsLensSubscriber] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
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
    if (!user) return;
    fetch("/api/brokerage/status")
      .then(r => r.json())
      .then(d => { if (d.isBrokerage) setBrokerageInfo(d.brokerage); })
      .catch(() => {});
  }, [user]);

  // Check Lens subscription status
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
    if (isAdmin) {
      setIsLensSubscriber(true);
      return;
    }
    const checkLens = async () => {
      const { data } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user.id)
        .single();
      if (data?.is_subscriber) setIsLensSubscriber(true);
    };
    checkLens();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setShowTools(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBrokerageInfo(null);
    setShowDropdown(false);
    setIsOpen(false);
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Account";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = (displayName.charAt(0) || "U").toUpperCase();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Lens link: logged in → dashboard, logged out → landing page
  const lensLink = user ? "/dashboard" : "/lens";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: navStyles }} />
      <nav className="bg-primary border-b border-primary/80 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            
            {/* Left — Logo + Clickable Timer */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex-shrink-0">
                <Image src="/logo.png" alt="Logo" width={192} height={77} className="h-12 w-auto" />
              </Link> 
              <div className="hidden md:block h-10 w-[1px] bg-white/30" />
              <Link href="/order" className="hidden md:block hover:opacity-80 transition-opacity">
                <CountdownTimer />
              </Link>
            </div>
           
            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-7">
              <Link href="/portfolio" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
                Portfolio
              </Link>

              <Link href="/blog" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
                Blog
              </Link>

              {/* Tools Dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => { setShowTools(!showTools); setShowDropdown(false); }}
                  className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors"
                >
                  Tools
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTools ? "rotate-180" : ""}`} />
                </button>
                {showTools && (
                  <div className="absolute left-0 top-full mt-2 w-60 bg-card rounded-xl border border-border shadow-lg py-2 z-50">
                    {/* AI Tools section */}
                    <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Tools</p>
                    <Link href={lensLink} onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Sparkles className="h-4 w-4 text-cyan-500" />
                      P2V Lens Tools
                      {isLensSubscriber ? (
                        <span className="ml-auto bg-cyan-100 text-cyan-700 text-xs font-bold px-1.5 py-0.5 rounded-full">SUBSCRIBED</span>
                      ) : (
                        <span className="ml-auto bg-accent/10 text-accent text-xs font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                      )}
                    </Link>
                    <Link href="/dashboard/lens/remix" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Film className="h-4 w-4 text-muted-foreground" />
                      Video Remix
                    </Link>

                    {/* Separator */}
                    <div className="h-px bg-border my-1" />

                    {/* More Tools section */}
                    <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">More Tools</p>
                    <Link href="/tips" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Play className="h-4 w-4 text-muted-foreground" />
                      DIY Photo Tips
                    </Link>
                    <Link href="/resources/photography-guide" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Free Photography Guide
                    </Link>
                    <Link href="/directory" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      Photographer Directory
                    </Link>
                    <Link href="/support" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      Support
                    </Link>
                    <Link href="/partners" onClick={() => setShowTools(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Partners
                    </Link>
                  </div>
                )}
              </div>
              
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-8 py-6 text-lg">
                <Link href="/order">Create My Listing Video</Link>
              </Button>

              {!user && (
                <Link href="/login" className="text-primary-foreground/80 hover:text-primary-foreground font-semibold transition-colors">
                  Sign In
                </Link>
              )}

              {user && <NotificationBell userId={user.id} />}
              
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setShowDropdown(!showDropdown); setShowTools(false); }}
                    className="avatar-ring-hint h-12 w-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/40 hover:border-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
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
                        {isLensSubscriber && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Sparkles className="h-3 w-3 text-cyan-600" />
                            <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2 py-0.5 rounded-full">P2V Lens</span>
                          </div>
                        )}
                        {brokerageInfo && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Building2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">{brokerageInfo.company}</span>
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent font-semibold hover:bg-accent/5 transition-colors">
                          <Shield className="h-3.5 w-3.5" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link href="/dashboard" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                        My Dashboard
                      </Link>
                      <Link href="/dashboard/videos" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <Video className="h-3.5 w-3.5 text-muted-foreground" />
                        My Videos
                      </Link>
                      <Link href="/dashboard/lens/remix" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <Film className="h-3.5 w-3.5 text-muted-foreground" />
                        Video Remix
                      </Link>
                      <Link href="/dashboard/properties" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" />
                        My Properties
                      </Link>
                      <Link href="/dashboard" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                        P2V Lens Tools
                      </Link>
                      <Link href="/dashboard/profile" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Agent Profile
                      </Link>
                      <Link href="/dashboard/settings" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                        Account Settings
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

            {/* Mobile — Hamburger */}
            <div className="xl:hidden">
              <button onClick={() => { setIsOpen(!isOpen); setShowDropdown(false); setShowTools(false); }} className="p-2 text-primary-foreground">
                {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="xl:hidden py-5 border-t border-white/10 bg-primary max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="flex flex-col gap-1 px-4">

                {/* User info (if logged in) */}
                {user && (
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 mb-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-full w-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs">{initial}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-primary-foreground font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-primary-foreground/50 text-xs truncate">{user.email}</p>
                      {isLensSubscriber && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full">P2V Lens</span>
                        </div>
                      )}
                      {brokerageInfo && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Building2 className="h-3 w-3 text-green-300" />
                          <span className="text-xs font-semibold text-green-300">{brokerageInfo.company}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timer (mobile) */}
                <Link href="/order" onClick={() => setIsOpen(false)} className="flex justify-center py-2 bg-white/5 rounded-xl mb-3 md:hidden">
                  <CountdownTimer />
                </Link>

                {user && (
                  <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}
                    className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                    <Bell className="h-4 w-4 text-primary-foreground/60" />
                    Notifications
                  </Link>
                )}

                {/* Main nav */}
                <Link href="/portfolio" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                  Portfolio
                </Link>
                <Link href="/blog" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                  Blog
                </Link>

                {/* AI Tools section — single link */}
                <div className="h-[1px] bg-white/10 my-2" />
                <p className="text-primary-foreground/40 text-xs font-semibold uppercase tracking-wider px-2 mb-1">AI Tools</p>
                <Link href={lensLink} onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  P2V Lens Tools
                  {isLensSubscriber ? (
                    <span className="ml-auto bg-cyan-500/20 text-cyan-300 text-xs font-bold px-1.5 py-0.5 rounded-full">SUBSCRIBED</span>
                  ) : (
                    <span className="ml-auto bg-accent/20 text-accent text-xs font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </Link>

                {/* More Tools section */}
                <div className="h-[1px] bg-white/10 my-2" />
                <p className="text-primary-foreground/40 text-xs font-semibold uppercase tracking-wider px-2 mb-1">More Tools</p>
                <Link href="/tips" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Play className="h-4 w-4 text-primary-foreground/60" />
                  DIY Photo Tips
                </Link>
                <Link href="/resources/photography-guide" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-primary-foreground/60" />
                  Free Photography Guide
                </Link>
                <Link href="/directory" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Camera className="h-4 w-4 text-primary-foreground/60" />
                  Photographer Directory
                </Link>
                <Link href="/support" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-primary-foreground/60" />
                  Support
                </Link>
                <Link href="/partners" onClick={() => setIsOpen(false)}
                  className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary-foreground/60" />
                  Partners
                </Link>

                {/* Account links (if logged in) */}
                {user && (
                  <>
                    <div className="h-[1px] bg-white/10 my-2" />
                    <p className="text-primary-foreground/40 text-xs font-semibold uppercase tracking-wider px-2 mb-1">Account</p>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsOpen(false)}
                        className="text-accent font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                        <Shield className="h-4 w-4 text-accent/60" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-primary-foreground/60" />
                      My Dashboard
                    </Link>
                    <Link href="/dashboard/videos" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Video className="h-4 w-4 text-primary-foreground/60" />
                      My Videos
                    </Link>
                    <Link href="/dashboard/lens/remix" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Film className="h-4 w-4 text-primary-foreground/60" />
                      Video Remix
                    </Link>
                    <Link href="/dashboard/properties" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Home className="h-4 w-4 text-primary-foreground/60" />
                      My Properties
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      P2V Lens Tools
                    </Link>
                    <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <User className="h-4 w-4 text-primary-foreground/60" />
                      Agent Profile
                    </Link>
                    <Link href="/dashboard/settings" onClick={() => setIsOpen(false)}
                      className="text-primary-foreground font-semibold py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                      <Settings className="h-4 w-4 text-primary-foreground/60" />
                      Account Settings
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
    </>
  );
}
