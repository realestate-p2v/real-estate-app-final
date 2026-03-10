import Script from "next/script";
import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import PromoPopup from '@/components/PromoPopup';

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Real Estate Photo 2 Video | Professional Video Agency',
  description: 'A professional video agency, not an app. We manually transform your listing photos into stunning, hand-edited walkthrough videos.',
  generator: 'v0.app',
  
  openGraph: {
    title: 'Real Estate Photo 2 Video | Professional Video Agency',
    description: 'Turn listing photos into professional walkthrough videos. Hand-edited by real editors for maximum impact.',
    url: 'https://realestatephoto2video.com', 
    siteName: 'Real Estate Photo 2 Video',
    images: [
      {
        // The "?v=2" at the end is the cache-buster that forces an update
        url: 'https://realestatephoto2video.com/real-estate-photo-to-video.jpg?v=2', 
        width: 1200,
        height: 630,
        alt: 'Professional Real Estate Video Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Photo 2 Video',
    description: 'Hand-edited professional real estate videos from your listing photos.',
    images: ['https://realestatephoto2video.com/real-estate-photo-to-video.jpg?v=2'],
  },

  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} font-sans antialiased`}>
        <Script
  id="meta-pixel"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1769748957035473');
      fbq('track', 'PageView');
    `,
  }}
/>
        {children}
        <PromoPopup />
        <Analytics />
      </body>
    </html>
  )
}
