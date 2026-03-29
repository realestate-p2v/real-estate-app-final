import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { TrackingScripts } from "@/components/tracking-scripts";
import { CookieConsent } from "@/components/cookie-consent";
import Script from "next/script";
import { GoogleOneTap } from "@/components/google-one-tap";
import "./globals.css";
const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Real Estate Photo 2 Video | AI Marketing Tools That Sell Listings Faster",
  description: "AI-powered listing videos, photo coaching, virtual staging, design studio, and listing descriptions — everything agents need to market listings professionally.",
  openGraph: {
    title: "Real Estate Photo 2 Video | AI Marketing Tools That Sell Listings Faster",
    description:
      "AI-powered listing videos, photo coaching, virtual staging, design studio, and listing descriptions — everything agents need to market listings professionally.",
    url: "https://realestatephoto2video.com",
    siteName: "Real Estate Photo 2 Video",
    images: [
      {
        url: "https://realestatephoto2video.com/real-estate-photo-to-video.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Real Estate Photo 2 Video — AI Marketing Tools for Agents",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Photo 2 Video | AI Marketing Tools That Sell Listings Faster",
    description:
      "AI-powered listing videos, photo coaching, virtual staging, design studio, and listing descriptions for real estate agents.",
    images: [
      "https://realestatephoto2video.com/real-estate-photo-to-video.jpg?v=2",
    ],
  },
  icons: {
    icon: '/favicon.ico?v=2',
    apple: '/apple-icon.png?v=2',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${geist.className} font-sans antialiased`}>
        {/* Google Tag Manager - Noscript fallback (harmless, no consent needed) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MKVR4C6N"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Consent-aware tracking scripts (GTM, GA, Meta Pixel) */}
        <TrackingScripts />
        {children}
        {/* Cookie consent banner */}
        <CookieConsent />
        {/* Google One Tap sign-in for logged-out visitors */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <GoogleOneTap />
        {/* Vercel Analytics (first-party, no consent needed) */}
        <Analytics />
      </body>
    </html>
  );
}
