"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Search,
  MapPin,
  Globe,
  Instagram,
  Linkedin,
  Camera,
  Loader2,
  UserPlus,
  Users,
  Image as ImageIcon,
  MessageCircle,
  Send,
  CheckCircle,
  ChevronDown,
  X,
} from "lucide-react";

interface Photographer {
  id: string;
  name: string;
  market: string;
  website: string;
  instagram: string;
  linkedin: string;
  portfolio: string;
  photo_url: string;
  specialties: string[];
  bio: string;
}

function ContactForm({ photographer, onClose }: { photographer: Photographer; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("All fields are required.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/directory/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId: photographer.id, ...form }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="p-4 bg-green-50 border-t border-green-200 text-center space-y-2">
        <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
        <p className="text-sm font-semibold text-green-700">Message sent to {photographer.name}!</p>
        <p className="text-xs text-green-600">They'll reply directly to your email.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Contact {photographer.name}</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="h-9 text-sm"
          required
        />
        <Input
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="h-9 text-sm"
          required
        />
        <Textarea
          placeholder="Hi, I'm looking for a real estate photographer for my listing..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="text-sm resize-none"
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button type="submit" disabled={sending} size="sm" className="w-full bg-primary">
          {sending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
          {sending ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}

function PhotographerCard({ p }: { p: Photographer }) {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 bg-muted flex items-center justify-center">
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {p.market}
          </div>
        </div>
        {p.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
        )}
        {p.specialties && p.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.specialties.map((s) => (
              <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
        {/* Links */}
        <div className="flex items-center gap-3 pt-1">
          {p.portfolio && (
            <a href={p.portfolio.startsWith("http") ? p.portfolio : `https://${p.portfolio}`} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors" title="Portfolio">
              <ImageIcon className="h-4 w-4" />
            </a>
          )}
          {p.website && (
            <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors" title="Website">
              <Globe className="h-4 w-4" />
            </a>
          )}
          {p.instagram && (
            <a href={`https://instagram.com/${p.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-pink-500 transition-colors" title="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {p.linkedin && (
            <a href={p.linkedin.startsWith("http") ? p.linkedin : `https://linkedin.com/in/${p.linkedin}`} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-blue-600 transition-colors" title="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          )}
        </div>
        {/* Contact toggle */}
        <button
          onClick={() => setShowContact(!showContact)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
            showContact
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {showContact ? "Close" : "Contact"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showContact ? "rotate-180" : ""}`} />
        </button>
      </div>
      {showContact && (
        <ContactForm photographer={p} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}

export default function DirectoryPage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  useEffect(() => {
    loadPhotographers();
  }, []);

  const loadPhotographers = async () => {
    try {
      const res = await fetch("/api/directory");
      const data = await res.json();
      if (data.success) {
        setPhotographers(data.photographers || []);
      }
    } catch (err) {
      console.error("Failed to load directory:", err);
    } finally {
      setLoading(false);
    }
  };

  const allSpecialties = Array.from(
    new Set(photographers.flatMap((p) => p.specialties || []))
  ).sort();

  const filtered = photographers.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.market.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      !selectedSpecialty ||
      (p.specialties || []).includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
            <Camera className="h-4 w-4" />
            Photographer Directory
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Find a Real Estate Photographer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse real estate photographers in your market. Great listing photos 
            are the first step to a great listing video.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by name or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12" />
          </div>
          {allSpecialties.length > 0 && (
            <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="h-12 px-4 rounded-lg border border-border bg-card text-foreground text-sm">
              <option value="">All Specialties</option>
              {allSpecialties.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              {photographers.length === 0 ? "Be the first photographer listed" : "No photographers match your search"}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {photographers.length === 0
                ? "Our directory is brand new. Join for free and get discovered by realtors in your market."
                : "Try a different search term or remove the specialty filter."}
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 mt-2">
              <Link href="/directory/join"><UserPlus className="mr-2 h-4 w-4" />Join the Directory — Free</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} photographer{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (<PhotographerCard key={p.id} p={p} />))}
            </div>
          </>
        )}

        <div className="bg-card rounded-2xl border border-border p-8 sm:p-10 text-center space-y-5 mt-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Are You a Real Estate Photographer?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join our directory for free and get discovered by realtors looking for photographers in your market.
            Plus, earn 20% commission when your agents order listing videos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-accent hover:bg-accent/90 px-8 py-6 text-lg font-bold">
              <Link href="/directory/join"><UserPlus className="mr-2 h-5 w-5" />Join for Free</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6 text-lg">
              <Link href="/partners">Referral Program (20%)</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Real Estate Photo 2 Video. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/resources/photography-guide" className="hover:text-foreground transition-colors">Free Guide</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
