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
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Image
              src="/logo.png"
              alt="Real Estate Photo 2 Video"
              width={200}
              height={80}
              className="h-16 md:h-20 w-auto"
            />
            <p className="mt-4 text-background/70 text-sm max-w-xs text-center md:text-left">
              Transforming real estate photos into stunning walkthrough videos
              for agents and brokers nationwide.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-background/70 hover:text-background text-sm"
              >
                Home
              </Link>
              <a
                href="#pricing"
                className="text-background/70 hover:text-background text-sm"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-background/70 hover:text-background text-sm"
              >
                Contact
              </a>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-background/50 text-sm">
                {new Date().getFullYear()} Real Estate Photo 2 Video. All rights
                reserved.
              </p>
              /*<Link
                href="/admin/dashboard"
                className="text-background/30 hover:text-background/60 text-xs transition-colors"
              >
                Admin
              </Link>*/
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
