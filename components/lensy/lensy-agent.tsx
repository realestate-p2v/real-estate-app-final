"use client";

import { Calendar } from "lucide-react";
import { LensyChatBase } from "./lensy-chat-base";

// ============================================================
// LENSY AGENT
// Lives on: Property Websites + Agent Websites (public, no auth)
// Audience: Buyers, renters, sellers visiting the agent's site
// Purpose: Answer listing questions, highlight features, drive
//          showing requests and bookings. Each subscriber gets
//          a custom Lensy trained on their data.
//
// CUSTOM SUB-MODELS:
// The system prompt is built from the subscriber's data:
//   - Agent bio, specialties, and personal touches
//   - All active listings with full details
//   - Market data for the agent's area
//   - Property-specific deep dive (when on a property page)
//   - Custom talking points the agent configures
// ============================================================

interface LensyAgentProps {
  // Required: identifies whose Lensy this is
  agentUserId: string;
  agentName: string;

  // Optional agent details (shown in footer + used in greeting)
  agentPhone?: string;
  agentCompany?: string;

  // Property-specific (when on a property website)
  propertyId?: string | null;
  propertyAddress?: string | null;

  // Booking features
  bookingEnabled?: boolean;
  onBookShowing?: () => void;
  onRequestShowing?: () => void;

  // Layout
  position?: "bottom-right" | "bottom-left";
  initialOpen?: boolean;
}

export default function LensyAgent({
  agentUserId,
  agentName,
  agentPhone,
  agentCompany,
  propertyId = null,
  propertyAddress = null,
  bookingEnabled = false,
  onBookShowing,
  onRequestShowing,
  position = "bottom-right",
  initialOpen = false,
}: LensyAgentProps) {
  // ── Property page vs Agent page greeting ──────────────────
  const isPropertyPage = !!propertyId;

  const greeting = isPropertyPage
    ? `Welcome! I'm Lensy, your AI guide for ${propertyAddress || "this property"}. I can tell you about the home, the neighborhood, and help you schedule a showing with ${agentName}. What would you like to know?`
    : `Hi! I'm Lensy, the AI assistant for ${agentName}${agentCompany ? ` at ${agentCompany}` : ""}. I can help you explore ${agentName}'s listings, learn about neighborhoods, or find the right property for you. How can I help?`;

  const suggestions = isPropertyPage
    ? [
        "Tell me about this property",
        "What's the neighborhood like?",
        "Are there similar listings?",
        "I'd like to schedule a showing",
      ]
    : [
        "Show me available listings",
        "What areas do you cover?",
        `Tell me about ${agentName}`,
        "I'm looking for a 3-bedroom home",
      ];

  const placeholder = isPropertyPage
    ? "Ask about this property..."
    : `Ask about ${agentName}'s listings...`;

  // ── Showing CTAs (appear after 2+ assistant messages) ─────
  const renderActions = (messageCount: number, isStreaming: boolean) => {
    if (messageCount < 2 || isStreaming) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {bookingEnabled && onBookShowing && (
          <button
            onClick={onBookShowing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <Calendar className="h-3 w-3" />
            Book a Showing
          </button>
        )}
        {onRequestShowing && (
          <button
            onClick={onRequestShowing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold transition-colors"
          >
            Request a Showing
          </button>
        )}
      </div>
    );
  };

  // ── Footer ────────────────────────────────────────────────
  const footerParts = [
    `AI assistant for ${agentName}`,
    agentPhone ? agentPhone : null,
    "Powered by P2V",
  ].filter(Boolean);

  return (
    <LensyChatBase
      config={{
        variant: "agent",
        headerLabel: isPropertyPage ? "Ask about this listing" : `Chat with ${agentName}'s AI`,
        greeting,
        suggestions,
        placeholder,
        bubbleGradient: "from-emerald-500 to-teal-600",
        headerBg: "bg-gradient-to-r from-emerald-500 to-teal-600",
        accentLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
        accentButton: "bg-emerald-600 hover:bg-emerald-700",
        apiPayload: {
          mode: "buyer_facing",
          propertyId,
          agentUserId,
        },
        footerText: footerParts.join(" • "),
        position,
        initialOpen,
        renderActions,
      }}
    />
  );
}
