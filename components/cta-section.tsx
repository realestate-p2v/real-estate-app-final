import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-primary py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-secondary/20 rounded-full p-4">
            <Zap className="h-10 w-10 text-secondary" />
          </div>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground text-balance">
          Ready to Transform Your Listings?
        </h2>
        <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
          Join hundreds of real estate professionals who have boosted their
          marketing with our video service. Order today and save!
        </p>
        <div className="mt-10">
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-7"
          >
            <Link href="/order">
              Order Now - Starting at <span className="line-through opacity-70 mx-1">$149</span> $79
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
