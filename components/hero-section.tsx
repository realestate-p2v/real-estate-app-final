import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="py-20 px-6 text-center bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Professional Real Estate Videos
        </h1>
        <div className="text-xl text-gray-600 mb-8 space-y-2">
          <p><strong>Step 1:</strong> Upload your photos and put them in order.</p>
          <p><strong>Step 2:</strong> Choose details like music and voiceover options.</p>
          <p><strong>Step 3:</strong> Review and submit your order.</p>
        </div>
        <Button size="lg" className="text-lg px-8">
          Get Started
        </Button>
      </div>
    </section>
  );
}
