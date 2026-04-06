"use client";

import { LensyChatBase } from "./lensy-chat-base";

// ============================================================
// LENSY SUPPORT
// Lives on: Lens dashboard (authenticated, subscribers only)
// Audience: Lens and Lens Pro subscribers
// Purpose: Help agents use P2V tools, troubleshoot, guide
//          workflows, assist with website builds, integrations
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
        headerLabel: "Lensy — Support",
        greeting,
        suggestions,
        placeholder: "Ask me anything about P2V tools...",
        bubbleGradient: "from-cyan-600 to-blue-600",
        headerBg: "bg-gradient-to-r from-cyan-600 to-blue-600",
        accentLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
        accentButton: "bg-cyan-600 hover:bg-cyan-700",
        apiPayload: {
          mode: "tool_support",
          propertyId: currentPropertyId,
        },
        position,
        initialOpen,
      }}
    />
  );
}
