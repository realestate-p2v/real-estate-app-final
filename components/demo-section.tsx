import Image from "next/image";
import { Images, ArrowRight, Play } from "lucide-react";

const listingPhotos = [
  {
    src: "/images/drone-1.jpg",
    alt: "Exterior drone view at sunset",
  },
  {
    src: "/images/front-door-2.jpg",
    alt: "Entry foyer with stairway",
  },
  {
    src: "/images/library-3.jpg",
    alt: "Library with built-in bookshelves",
  },
  {
    src: "/images/tv-room-4.jpg",
    alt: "Living room with fireplace",
  },
  {
    src: "/images/dining-5.jpg",
    alt: "Formal dining room",
  },
  {
    src: "/images/kitchen-6.jpg",
    alt: "Kitchen with island",
  },
  {
    src: "/images/dining-7.jpg",
    alt: "Breakfast nook",
  },
  {
    src: "/images/stairway-8.jpg",
    alt: "Stairway",
  },
  {
    src: "/images/master-long-9.jpg",
    alt: "Master bedroom",
  },
];

export function DemoSection() {
  return (
    <section id="demo" className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            See the Transformation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From a collection of listing photos to a professional walkthrough video
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-center">
          {/* Photos Side */}
          <div className="w-full">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Images className="h-6 w-6 text-primary" />
                <span className="font-semibold text-foreground">Your Listing Photos</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {listingPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                  >
                    <Image
                      src={photo.src || "/placeholder.svg"}
                      alt={photo.alt}
                      width={200}
                      height={150}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Upload your photos in any order
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="bg-secondary rounded-full p-3 md:p-4">
              <ArrowRight className="h-6 w-6 md:h-8 md:w-8 text-secondary-foreground rotate-90 md:rotate-0" />
            </div>
          </div>

          {/* Video Side */}
          <div className="w-full">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Play className="h-6 w-6 text-accent" />
                <span className="font-semibold text-foreground">Your HD Walkthrough Video</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-foreground/5">
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/3jdoPBu7hVo?si=ZQxY9Ow2nF_n6k2q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Professional HD video delivered in 72 hours
              </p>
            </div>
          </div>
        </div>

      </div>

       <div className="mt-12 flex flex-col items-center gap-6">
          {/* HIGH CONVERSION GREEN BUTTON */}
          <Button
            asChild
            size="lg"
            className="group bg-[#22c55e] hover:bg-[#16a34a] text-white text-xl md:text-2xl px-12 py-10 md:py-12 rounded-2xl shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:shadow-[0_20px_50px_rgba(34,197,94,0.5)] transition-all duration-300 hover:-translate-y-1 active:scale-95 w-full md:w-auto font-black italic"
          >
            <Link href="/order" className="flex items-center justify-center gap-3">
              GET STARTED NOW — <span className="line-through opacity-60 font-normal">$149</span> $79
              <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>

          {/* Muted Desaturated Icons */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-6">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5 text-[#FFDADA]" />
              100% Satisfaction
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <Clock className="h-5 w-5 text-[#FFDADA]" />
              Fast 72h Delivery
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-5 w-5 text-[#FFDADA]" />
              Secure Checkout
            </div>
          </div>
        </div>

        <p className="mt-8 text-primary-foreground/50 text-sm">
          No subscription required. One-time payment per listing.
        </p>
    </section>
  );
}
