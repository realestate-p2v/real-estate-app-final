import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Real Estate Photo 2 Video | Transform Listing Photos Into Walkthrough Videos',
  description: 'A professional video agency, not an app. We manually transform your listing photos into stunning, hand-edited walkthrough videos with fast 72-hour delivery.',
  generator: 'v0.app',
  
  // Open Graph / Facebook / WhatsApp / Instagram
  openGraph: {
    title: 'Real Estate Photo 2 Video | Professional Video Agency',
    description: 'Turn listing photos into professional walkthrough videos. Hand-edited by real editors for maximum impact.',
    url: 'https://realestate-p2v.com', // Update this to your live URL when ready
    siteName: 'Real Estate Photo 2 Video',
    images: [
      {
        url: '/og-image.jpg', // Ensure this file is in your /public folder
        width: 1200,
        height: 630,
        alt: 'Professional Real Estate Video Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Photo 2 Video',
    description: 'Hand-edited professional real estate videos from your listing photos.',
    images: ['/og-image.jpg'],
  },

  // Favicons & Icons
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
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
        {children}
        <Analytics />
      </body>
    </html>
  )
}
