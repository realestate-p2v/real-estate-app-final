"use client";

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    brokerage: "RE/MAX Coastal",
    city: "Miami, FL",
    quote: "I uploaded 12 photos and had a professional video in my inbox the next morning. My sellers were blown away.",
  },
  {
    name: "Marcus Williams",
    brokerage: "Keller Williams",
    city: "Dallas, TX",
    quote: "At $79 this is a no-brainer. I used to pay $500 for a videographer and wait a week. Now I get it in 12 hours.",
  },
  {
    name: "Jennifer Park",
    brokerage: "Coldwell Banker",
    city: "Phoenix, AZ",
    quote: "The camera movement controls let me direct exactly what I wanted. The final video looked like a professional production.",
  },
  {
    name: "David Rodriguez",
    brokerage: "Century 21",
    city: "Atlanta, GA",
    quote: "I've sent 3 orders this month. The quality is consistent and my listings are getting more engagement than ever.",
  },
  {
    name: "Lisa Thompson",
    brokerage: "Compass",
    city: "Denver, CO",
    quote: "The photo editing add-on saved me hours. Upload, pick my music, and done. This is how real estate marketing should work.",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">What Agents Are Saying</h2>
        <p className="text-center text-muted-foreground mb-10">Join hundreds of agents using video to sell faster</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <div key={i} className="bg-card rounded-2xl border p-6 space-y-4">
              <div className="text-amber-400 text-lg">⭐⭐⭐⭐⭐</div>
              <p className="text-muted-foreground italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="pt-2 border-t">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.brokerage} &middot; {t.city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
