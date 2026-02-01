import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative py-20 px-6 text-center bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          Professional Real Estate Videos
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Step 1: Upload your photos and put them in order. Step 2: Choose details like music and voiceover options. Step 3: Review and submit your order.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
            Create Your Video
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            View Samples
          </Button>
        </div>
      </div>
      
      {/* Subtle background element for visual polish */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
    </section>
  );
}
