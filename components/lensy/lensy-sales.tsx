"use client";

import { LensyChatBase } from "./lensy-chat-base";

// ============================================================
// LENSY SALES
// Lives on: P2V public pages (homepage, /lens, /pricing, etc.)
// Audience: Non-subscribers, visitors, potential customers
// Purpose: Answer product questions, explain pricing, drive
//          subscriptions, help with guest video orders
// ============================================================

interface LensySalesProps {
  position?: "bottom-right" | "bottom-left";
  initialOpen?: boolean;
}

export default function LensySales({
  position = "bottom-right",
  initialOpen = false,
}: LensySalesProps) {
  return (
    <LensyChatBase
      config={{
        variant: "sales",
        headerLabel: "Lensy — P2V",
        greeting:
          "Hi there! I'm Lensy, your P2V guide. I can help you learn about our real estate marketing tools — from AI-powered listing videos to virtual staging and agent websites. What would you like to know?",
        suggestions: [
          "What is P2V?",
          "How much does it cost?",
          "Can I try it free?",
          "How do listing videos work?",
        ],
        placeholder: "Ask about P2V...",
        bubbleGradient: "from-orange-500 to-red-500",
        headerBg: "bg-gradient-to-r from-orange-500 to-red-500",
        accentLight: "bg-orange-50 text-orange-700 border-orange-200",
        accentButton: "bg-orange-600 hover:bg-orange-700",
        apiPayload: {
          mode: "sales",
        },
        footerText: "Powered by P2V",
        position,
        initialOpen,
      }}
    />
  );
}
