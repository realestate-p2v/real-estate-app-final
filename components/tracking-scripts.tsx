"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const CONSENT_KEY = "p2v_cookie_consent";

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
}

export function TrackingScripts() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    // Read initial consent
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsent({ analytics: !!parsed.analytics, marketing: !!parsed.marketing });
      }
    } catch {
      // No consent yet — scripts stay dormant
    }

    // Listen for consent updates (from the cookie banner)
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setConsent({ analytics: !!detail.analytics, marketing: !!detail.marketing });
      }
    };
    window.addEventListener("p2v_consent_updated", handler);

    // Also listen for storage changes (e.g. Cookie Settings reset + reload)
    const storageHandler = () => {
      try {
        const updated = localStorage.getItem(CONSENT_KEY);
        if (updated) {
          const parsed = JSON.parse(updated);
          setConsent({ analytics: !!parsed.analytics, marketing: !!parsed.marketing });
        } else {
          setConsent(null);
        }
      } catch {
        setConsent(null);
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("p2v_consent_updated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return (
    <>
      {/* Google Tag Manager — loads only if analytics consented */}
      {consent?.analytics && (
        <Script
          id="gtm-consent"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MKVR4C6N');`,
          }}
        />
      )}

      {/* Google Analytics — loads only if analytics consented */}
      {consent?.analytics && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-4VFMMPJDBN"
            strategy="afterInteractive"
          />
          <Script id="ga-consent" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4VFMMPJDBN');
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — loads only if marketing consented */}
      {consent?.marketing && (
        <Script
          id="meta-pixel-consent"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1769748957035473');
fbq('track', 'PageView');`,
          }}
        />
      )}
    </>
  );
}
