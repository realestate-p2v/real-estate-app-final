import Image from "next/image";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";
export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={350}
              height={120}
              className="h-20 md:h-24 w-auto object-contain"
            />
            <p className="text-background/60 text-sm max-w-xs text-center md:text-left leading-relaxed">
              AI-powered real estate marketing — cinematic listing videos, photo coaching, virtual staging, design studio, and listing descriptions.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/realestatephoto2video/" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@realestatephoto2video" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors" aria-label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.82a4.83 4.83 0 01-1-.13z"/></svg>
              </a>
              <a href="https://www.youtube.com/@RealEstatePhoto2Video" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors" aria-label="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61587039633673" target="_blank" rel="noopener noreferrer" className="text-background/50 hover:text-background transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
          {/* Column 2: The "Friendly Human" Middle (Trust Column) */}
          <div className="flex flex-col items-center text-center space-y-6 md:pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                A Note From Our Team
              </h4>
              <p className="text-sm text-background/70 max-w-[280px] leading-relaxed">
                We're a friendly team of editors, not just a bunch of algorithms. We use AI to speed things up, but a real human hand-finishes every video to make sure it's perfect for you.
              </p>
            </div>
            
            {/* Made in USA Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-lg">🇺🇸</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background/90">
                Crafted in the USA
              </span>
            </div>
          </div>
          {/* Column 3: Navigation & Copyright */}
          <div className="flex flex-col items-center md:items-end space-y-8 md:pt-4">
            <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
              <Link href="/" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Home
              </Link>
              <Link href="/portfolio" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Portfolio
              </Link>
              <a href="#pricing" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Pricing
              </a>
              <Link href="/resources/photography-guide" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Free Guide
              </Link>
              <Link href="/directory" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Directory
              </Link>
              <Link href="/partners" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Partners
              </Link>
              <Link href="/support" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Support
              </Link>
            </nav>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3">
              <Link href="/privacy" className="text-background/50 hover:text-background text-xs transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-background/50 hover:text-background text-xs transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund-policy" className="text-background/50 hover:text-background text-xs transition-colors">
                Refund Policy
              </Link>
              <CookieSettingsButton />
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-background/40 text-[11px] uppercase tracking-[0.15em] font-bold">
                © {new Date().getFullYear()} Real Estate Photo 2 Video
              </p>
              <p className="text-background/30 text-[10px] mt-1 italic">
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
