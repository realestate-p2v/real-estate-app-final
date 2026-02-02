import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
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
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          
          {/* Left Column: Logo & Main Blurb */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={200}
              height={80}
              className="h-16 md:h-20 w-auto"
            />
            <p className="text-background/70 text-sm max-w-xs text-center md:text-left">
              Transforming real estate photos into stunning walkthrough videos
              for agents and brokers nationwide.
            </p>
            
            {/* Made in USA Badge */}
            <div className="flex items-center gap-2 pt-2 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-xl">🇺🇸</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background/80">
                Made in the USA
              </span>
            </div>
          </div>

          {/* Middle/Right Column: Human Team Blurb & Links */}
          <div className="flex flex-col items-center md:items-end w-full md:w-auto gap-8">
            
            {/* Human Team Blurb */}
            <div className="bg-background/5 border border-background/10 p-5 rounded-2xl max-w-sm">
              <p className="text-xs leading-relaxed text-background/80 text-center md:text-right italic">
                <span className="text-primary font-bold not-italic block mb-1">Human-Powered Quality</span>
                We are a dedicated video agency team, not an automated AI app. We combine professional photo and video editing with advanced AI tools to create truly custom, high-end products for your listings.
              </p>
            </div>

            {/* Navigation & Copyright */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-6">
                <Link href="/" className="text-background/70 hover:text-background text-sm font-medium">
                  Home
                </Link>
                <a href="#pricing" className="text-background/70 hover:text-background text-sm font-medium">
                  Pricing
                </a>
                <a href="#contact" className="text-background/70 hover:text-background text-sm font-medium">
                  Contact
                </a>
              </div>
              <p className="text-background/40 text-[11px] uppercase tracking-widest font-bold">
                © {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
