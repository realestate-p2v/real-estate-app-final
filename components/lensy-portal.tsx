"use client";

import { LensyChatBase } from "./lensy-chat-base";
import { Calendar } from "lucide-react";

// ============================================================
// LENSY PORTAL
// Lives on: p2v.homes public portal + agent websites
// Two modes:
//   1. Portal — p2v.homes homepage, /listings, /search, /join
//      Audience: Home buyers + agents discovering the platform
//   2. Agent Site — [handle].p2v.homes or custom domain agent sites
//      Audience: Buyers visiting a specific agent's website
//
// Green themed (not cyan like main site, not sky-blue like
// dashboard support, not orange like sales). This is the
// customer-facing Lensy for the p2v.homes ecosystem.
//
// Usage:
//   Portal:     <LensyPortal mode="portal" />
//   Listing:    <LensyPortal mode="portal" currentListingAddress="123 Main St" />
//   Agent home: <LensyPortal mode="agent_site" agentName="Jane Smith" agentUserId="..." />
//   Agent prop: <LensyPortal mode="agent_site" agentName="Jane Smith" agentUserId="..."
//                 currentPropertyId="..." currentPropertyAddress="123 Main St"
//                 bookingEnabled onBookShowing={fn} onRequestShowing={fn} />
// ============================================================

// ── Portal mode props ────────────────────────────────────────
interface PortalModeProps {
  mode: "portal";
  /** If the visitor is on a specific listing page */
  currentListingAddress?: string;
  position?: "bottom-right" | "bottom-left";
}

// ── Agent site mode props ────────────────────────────────────
interface AgentSiteModeProps {
  mode: "agent_site";
  agentName: string;
  agentCompany?: string;
  agentPhone?: string;
  agentPrimaryColor?: string;
  agentUserId: string;
  /** If the visitor is on a specific property detail page */
  currentPropertyId?: string;
  currentPropertyAddress?: string;
  /** Show "Book a Showing" CTA after 2+ messages */
  bookingEnabled?: boolean;
  onBookShowing?: () => void;
  onRequestShowing?: () => void;
  position?: "bottom-right" | "bottom-left";
}

type LensyPortalProps = PortalModeProps | AgentSiteModeProps;

export default function LensyPortal(props: LensyPortalProps) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE 1: PORTAL — p2v.homes public pages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (props.mode === "portal") {
    const isListingPage = !!props.currentListingAddress;

    return (
      <LensyChatBase
        config={{
          variant: "portal",
          headerLabel: "Lensy · p2v.homes",
          greeting: isListingPage
            ? "Hi! I'm Lensy. I can tell you more about this property or help you connect with the listing agent. What would you like to know?"
            : "Hi! I'm Lensy. I can help you find your next home, or if you're an agent, I can tell you how to build your own professional website on P2V. What are you looking for?",
          suggestions: isListingPage
            ? [
                "Tell me about this property",
                "What's the neighborhood like?",
                "How do I schedule a showing?",
                "Are there similar listings?",
              ]
            : [
                "Help me find a home",
                "I'm a real estate agent",
                "What is p2v.homes?",
                "Browse listings near me",
              ],
          placeholder: isListingPage
            ? "Ask about this property..."
            : "Ask Lensy anything...",

          // Green theming
          bubbleGradient: "from-green-400 to-emerald-500",
          headerBg: "bg-gradient-to-r from-green-500 to-emerald-500",
          accentLight: "bg-green-50 text-green-700 border-green-200",
          accentButton: "bg-green-500 hover:bg-green-600",

          apiPayload: {
            mode: "portal",
            currentListingAddress: props.currentListingAddress,
          },
          footerText: "Powered by P2V · realestatephoto2video.com",
          position: props.position || "bottom-right",
        }}
      />
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE 2: AGENT SITE — [handle].p2v.homes or custom domain
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const isPropertyPage = !!props.currentPropertyAddress;

  return (
    <LensyChatBase
      config={{
        variant: "portal",
        headerLabel: `Lensy · ${props.agentName}`,
        greeting: isPropertyPage
          ? `Hi! I'm Lensy. I can tell you more about ${props.currentPropertyAddress} or help you schedule a showing with ${props.agentName}. What would you like to know?`
          : `Hi! I'm Lensy, ${props.agentName}'s AI assistant. I can help you explore listings, learn about neighborhoods, or schedule a showing. What are you looking for?`,
        suggestions: isPropertyPage
          ? [
              "Tell me about this property",
              "What's the neighborhood like?",
              "Schedule a showing",
              "Are there similar listings?",
            ]
          : [
              "Show me available listings",
              `Tell me about ${props.agentName}`,
              "What areas do you cover?",
              "I'd like to schedule a showing",
            ],
        placeholder: isPropertyPage
          ? "Ask about this property..."
          : `Ask about ${props.agentName}'s listings...`,

        // Green theming — agent's primary color tints the header
        bubbleGradient: "from-green-400 to-emerald-500",
        headerBg: props.agentPrimaryColor
          ? `bg-[${props.agentPrimaryColor}]`
          : "bg-gradient-to-r from-green-500 to-emerald-500",
        accentLight: "bg-green-50 text-green-700 border-green-200",
        accentButton: "bg-green-500 hover:bg-green-600",

        apiPayload: {
          mode: "agent_site",
          agentUserId: props.agentUserId,
          propertyId: props.currentPropertyId,
        },
        footerText: `AI assistant for ${props.agentName} · Powered by P2V`,
        position: props.position || "bottom-right",

        // Lead capture CTAs — appear after 2+ assistant messages
        renderActions: (messageCount: number, isStreaming: boolean) => {
          if (messageCount < 2 || isStreaming) return null;

          const hasBooking = props.bookingEnabled && props.onBookShowing;
          const hasRequest = !!props.onRequestShowing;
          if (!hasBooking && !hasRequest) return null;

          return (
            <div className="flex flex-wrap gap-2 mt-2">
              {hasBooking && (
                <button
                  onClick={props.onBookShowing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
                >
                  <Calendar className="h-3 w-3" />
                  Book a Showing
                </button>
              )}
              {hasRequest && (
                <button
                  onClick={props.onRequestShowing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-400/30 text-green-400 bg-green-400/10 hover:bg-green-400/20 text-xs font-semibold transition-colors"
                >
                  Request a Showing
                </button>
              )}
            </div>
          );
        },
      }}
    />
  );
}
