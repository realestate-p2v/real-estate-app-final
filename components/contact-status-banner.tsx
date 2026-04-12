"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

export function ContactStatusBanner() {
  const searchParams = useSearchParams();
  const status = searchParams.get("contact");

  if (!status) return null;

  if (status === "success") {
    return (
      <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Message sent! The agent will get back to you soon.
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      <XCircle className="h-4 w-4 flex-shrink-0" />
      Something went wrong. Please try again or contact the agent directly.
    </div>
  );
}
