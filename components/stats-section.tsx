import { TrendingUp, Eye, Clock, DollarSign } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "403%",
    label: "More Inquiries",
    description: "Video listings get 4x more buyer inquiries",
  },
  {
    icon: Eye,
    value: "85%",
    label: "More Views",
    description: "Buyers watch videos before scheduling tours",
  },
  {
    icon: Clock,
    value: "72hrs",
    label: "Fast Delivery",
    description: "Your video delivered in 3 business days",
  },
  {
    icon: DollarSign,
    value: "10x",
    label: "ROI",
    description: "Video marketing outperforms static images",
  },
];

export function StatsSection() {
  return (
    <section className="bg-gradient-to-r from-primary via-primary/95 to-primary py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground text-center mb-10">
          Why Video Wins in Real Estate
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors"
            >
              <stat.icon className="h-8 w-8 text-secondary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-primary-foreground mb-2">
                {stat.label}
              </div>
              <p className="text-xs text-primary-foreground/70 leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
