import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Star, Shield } from "lucide-react";

const plans = [
  {
    id: "standard-video",
    name: "Standard",
    photos: "Up to 12 photos",
    originalPrice: 149,
    salePrice: 79,
    savings: 70,
    features: [
      "Up to 12 Photos",
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "72-hour delivery",
      "1 revision included",
    ],
    popular: false,
  },
  {
    id: "premium-video",
    name: "Premium",
    photos: "13-25 photos",
    originalPrice: 199,
    salePrice: 129,
    savings: 70,
    features: [
      "Up to 25 Photos",
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "72-hour delivery",
      "1 revision included",
    ],
    popular: true,
  },
  {
    id: "professional-video",
    name: "Professional",
    photos: "26-35 photos",
    originalPrice: 249,
    salePrice: 179,
    savings: 70,
    features: [
      "Up to 35 Photos",
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "Priority delivery",
      "2 revisions included",
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Simple, Transparent Pricing
          </h2>
            <span className="text-[#b95d5d] font-black">FEBRUARY SALE!</span>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the package that fits your listing. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 shadow-lg border-2 ${
                plan.popular
                  ? "border-secondary scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground mt-1">{plan.photos}</p>

                <div className="mt-6">
                  <span className="text-lg text-muted-foreground line-through">
                    ${plan.originalPrice}
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">
                      ${plan.salePrice}
                    </span>
                  </div>
                  <span className="inline-block mt-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                    Save ${plan.savings}
                  </span>
                </div>

                <ul className="mt-8 space-y-4 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-secondary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full mt-8 py-6 text-lg ${
                    plan.popular
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  <Link href="/order">Order Now</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Agency Pack */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-lg border-2 border-primary">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Agency Pack</h3>
                <p className="text-muted-foreground mt-1">5 videos bundle - Save 20%</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-secondary" />
                    5 Premium videos (up to 25 photos each)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-secondary" />
                    All Premium features included
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-right">
                <span className="text-lg text-muted-foreground line-through">$625</span>
                <div className="text-4xl font-bold text-foreground">$499</div>
                <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
                  <Link href="/order">Get Agency Pack</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>100% Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-secondary" />
            <span>No Hidden Fees</span>
          </div>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          Need more than 35 photos?{" "}
          <a
            href="tel:+18455366954"
            className="text-primary font-semibold hover:underline"
          >
            Call us at 1 (845) 536-6954
          </a>
        </p>
      </div>
    </section>
  );
}
