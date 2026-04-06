"use client";

import { LensyChatBase } from "./lensy-chat-base";

// ============================================================
// LENSY SUPPORT
// Lives on: Lens dashboard + any page for authenticated subscribers
// Audience: Lens and Lens Pro subscribers
// Purpose: Help agents use P2V tools, troubleshoot, guide
//          workflows, assist with website builds, integrations
// Premium feel — subscribers should feel like VIPs
// ============================================================

interface LensySupportProps {
  // Optional: if the agent is currently viewing a specific property,
  // Lensy can provide property-specific tool suggestions
  currentPropertyId?: string | null;
  currentPropertyAddress?: string | null;
  position?: "bottom-right" | "bottom-left";
  initialOpen?: boolean;
}

export default function LensySupport({
  currentPropertyId = null,
  currentPropertyAddress = null,
  position = "bottom-right",
  initialOpen = false,
}: LensySupportProps) {
  const greeting = currentPropertyAddress
    ? `Hey! I see you're working on ${currentPropertyAddress}. I can help you with any P2V tool — Photo Coach, descriptions, staging, graphics, videos, or your website build. What do you need?`
    : "Hey! I'm Lensy, your P2V Lens assistant. I can help you with any tool — Photo Coach, Description Writer, Design Studio, Virtual Staging, Quick Videos, your website, or anything else. What are you working on?";

  const suggestions = currentPropertyId
    ? [
        "Write a description for this listing",
        "What photos should I retake?",
        "Help me set up this property's website",
        "Create marketing graphics for this listing",
      ]
    : [
        "How do I use Photo Coach?",
        "Help me write a listing description",
        "How do I build my agent website?",
        "What can Design Studio do?",
      ];

  return (
    <LensyChatBase
      config={{
        variant: "support",
        headerLabel: "Lensy — P2V Lens Support",
        greeting,
        suggestions,
        placeholder: "Ask me anything about P2V tools...",
        bubbleGradient: "from-sky-400 to-blue-500",
        headerBg: "bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400",
        accentLight: "bg-sky-50 text-sky-600 border-sky-200",
        accentButton: "bg-sky-500 hover:bg-sky-600",
        apiPayload: {
          mode: "tool_support",
          propertyId: currentPropertyId,
        },
        footerText: "P2V Lens Member Support",
        position,
        initialOpen,
      }}
    />
  );
}
