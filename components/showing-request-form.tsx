"use client";

import { useState } from "react";
import { User, Mail, Phone, Loader2, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShowingRequestFormProps {
  propertyId: string;
  propertyInfo?: {
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    price?: number;
    price_period?: string;
    status?: string;
    listing_type?: string;
  };
  agentUserId?: string;
  agentName?: string;
  source?: string;
  listingType?: string;
}

export default function ShowingRequestForm({
  propertyId,
  propertyInfo,
  agentUserId,
  agentName,
  source = "property_website",
  listingType,
}: ShowingRequestFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isRental = listingType === "rental";
  const isCommercial = listingType === "commercial";

  const defaultMessage = isCommercial
    ? "I'd like to learn more about this commercial space."
    : isRental
    ? "I'm interested in this rental. Is it still available?"
    : "I'd like to schedule a showing for this property.";

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/showings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          agentUserId,
          visitorName: form.name.trim(),
          visitorEmail: form.email.trim(),
          visitorPhone: form.phone.trim() || null,
          message: form.message.trim() || defaultMessage,
          source,
          propertyAddress: propertyInfo?.address || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError("Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inp =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">Message Sent!</h3>
        <p className="text-sm text-muted-foreground">
          {agentName || "The agent"} will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <User className="h-3 w-3 inline mr-1" />
          Your Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jane Smith"
          className={inp}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <Mail className="h-3 w-3 inline mr-1" />
          Email *
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jane@example.com"
          className={inp}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <Phone className="h-3 w-3 inline mr-1" />
          Phone
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(555) 123-4567"
          className={inp}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <MessageSquare className="h-3 w-3 inline mr-1" />
          Message
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={defaultMessage}
          rows={3}
          className={inp + " resize-none"}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!form.name.trim() || !form.email.trim() || submitting}
        className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-full"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Your info is shared only with {agentName || "the listing agent"}.
      </p>
    </div>
  );
}
