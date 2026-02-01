import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="py-20 px-6 text-center bg-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Professional Real Estate Videos
        </h1>
        
        {/* Your requested 3 steps text */}
        <p className="text-xl text-gray-600 mb-8">
          Step 1: Upload your photos and put them in order. Step 2: Choose details like music and voiceover options. Step 3: Review and submit your order.
        </p>

        {/* Green button linking to the order page */}
        <Link href="/order" passHref>
          <Button size="lg" className="text-lg px-8 bg-green-600 hover:bg-green-700 text-white">
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}
