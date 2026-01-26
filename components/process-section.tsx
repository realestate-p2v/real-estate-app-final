import { Upload, Paintbrush, Film, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "1",
    title: "Upload & Arrange",
    description:
      "Upload your listing photos, select your preferred music, arrange them in order, and place your order.",
  },
  {
    icon: Paintbrush,
    step: "2",
    title: "Photo Enhancement",
    description:
      "Our professional team cleans up and enhances your photos in Photoshop for the best visual quality.",
  },
  {
    icon: Film,
    step: "3",
    title: "Video Production",
    description:
      "We bring your photos to life with smooth transitions, music, and professional editing.",
  },
  {
    icon: CheckCircle,
    step: "4",
    title: "HD Delivery",
    description:
      "Receive your high-definition video file within 72 hours, ready for social media and presentations.",
  },
];

export function ProcessSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and hassle-free process to get your video
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-border" />
              )}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-4xl font-bold text-secondary">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
