"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface CookieConsentData {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const CONSENT_KEY = "p2v_cookie_consent";

export function getStoredConsent(): CookieConsentData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function hasConsent(type: "analytics" | "marketing"): boolean {
  const consent = getStoredConsent();
  if (!consent) return false;
  return consent[type] === true;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consent: CookieConsentData) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);

    // Dispatch a custom event so TrackingScripts can react immediately
    window.dispatchEvent(new CustomEvent("p2v_consent_updated", { detail: consent }));

    // If marketing declined, neuter fbq
    if (!consent.marketing && typeof (window as any).fbq === "function") {
      (window as any).fbq = function () {};
    }
    // If analytics declined, disable GA property
    if (!consent.analytics) {
      (window as any)["ga-disable-G-4VFMMPJDBN"] = true;
    }
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const savePreferences = () => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">We value your privacy</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                We use cookies to improve your experience, analyze site traffic, and support our
                marketing efforts. You can accept all cookies or customize your preferences.{" "}
                <Link href="/privacy#cookies-and-tracking" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Preference Panel */}
          {showPreferences && (
            <div className="mb-5 space-y-4 border-t border-border pt-5">
              {/* Essential — always on */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-foreground">Essential Cookies</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required for authentication and core site functionality.
                  </p>
                </div>
                <Switch
                  checked={true}
                  disabled
                  className="data-[state=checked]:bg-primary opacity-60"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-foreground">Analytics Cookies</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Google Analytics and Vercel Analytics — helps us understand how the site is used.
                  </p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-foreground">Marketing Cookies</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Meta Pixel — helps us measure ad performance and show relevant ads.
                  </p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={acceptAll}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black flex-1 sm:flex-none sm:px-8"
            >
              Accept All
            </Button>
            {showPreferences ? (
              <Button
                onClick={savePreferences}
                variant="outline"
                className="flex-1 sm:flex-none sm:px-8 font-semibold"
              >
                Save Preferences
              </Button>
            ) : (
              <Button
                onClick={() => setShowPreferences(true)}
                variant="outline"
                className="flex-1 sm:flex-none sm:px-8 font-semibold gap-2"
              >
                Manage Preferences
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
