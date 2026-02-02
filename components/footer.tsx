import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      {/* Google Analytics Script */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4VFMMPJDBN"
        strategy="afterInteractive"
      />
      <Script id="footer-google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4VFMMPJDBN');
        `}
      </Script>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          
          {/* Column 1: Brand & Logo */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={270}
              height={105}
              className="h-14 md:h-16 w-auto"
            />
            <p className="text-background/60 text-sm max-w-xs text-center md:text-left leading-relaxed">
              Helping agents stand out with cinematic property tours and professional photo enhancements.
            </p>
          </div>

          {/* Column 2: The "Friendly Human" Middle (Trust Column) */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-primary/90 uppercase tracking-widest">A Note From Our Team</h4>
              <p className="text-sm text-background/70 max-w-[280px] leading-relaxed">
                We’re a friendly team of editors, not just a bunch of algorithms. We use AI to speed things up, but a real human hand-finishes every video to make sure it’s perfect for you.
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
          <div className="flex flex-col items-center md:items-end space-y-6">
            <nav className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
              <Link href="/" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Home
              </Link>
              <a href="#pricing" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-background/70 hover:text-background text-sm font-semibold transition-colors">
                Contact
              </a>
            </nav>
            
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
