"use client";

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import Image from "next/image";
import { Upload, Paintbrush, Film, CheckCircle, MoveHorizontal } from "lucide-react";

const steps = [
  {
    step: "1",
    icon: Upload,
    title: "Upload & Arrange",
    description: "Upload your listing photos, select your preferred music, arrange them in order, and place your order.",
    type: "video",
    src: "/p2v-website-her-vid.mp4",
    label: "Interface Preview"
  },
  {
    step: "2",
    icon: Paintbrush,
    title: "Photo Enhancement",
    description: "Our professional team cleans up and enhances your photos in Photoshop for the best visual quality.",
    type: "slider",
    labelBefore: "Original",
    labelAfter: "Enhanced"
  },
  {
    step: "3",
    icon: Film,
    title: "Video Production",
    description: "We bring your photos to life with a blend of smooth transitions, music, and professional editing.",
    type: "placeholder",
    iconPlaceholder: Film,
    bg: "bg-slate-900",
    label: "Editing Workflow"
  },
  {
    step: "4",
    icon: CheckCircle,
    title: "HD Delivery",
    description: "Receive your high-definition video file within 72 hours, ready for social media and presentations.",
    type: "placeholder",
    iconPlaceholder: CheckCircle,
    bg: "bg-emerald-50",
    label: "Ready for Download"
  },
];

export function ProcessSection() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  return (
    <section className="bg-background py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground font-medium">A simple, professional process from start to finish.</p>
        </div>

        {/* CONTAINER FOR ALL STEPS */}
        <div className="space-y-24 md:space-y-32">
          {steps.map((item) => (
            <div key={item.step} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* TEXT BLOCK */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-sm font-black uppercase tracking-widest text-primary/60">Step {item.step}</span>
                    <h3 className="text-2xl font-bold text-foreground mb-3 mt-1">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>

              {/* MEDIA BLOCK */}
              <div className="relative">
                {item.type === "video" && (
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-black">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src={item.src} type="video/mp4" />
                    </video>
                    <div className="absolute top-4 left-6 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{item.label}</div>
                  </div>
                )}

                {item.type === "slider" && (
                  <div 
                    ref={containerRef}
                    className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize select-none border-4 border-white"
                    onMouseMove={(e) => isDragging && handleMove(e.clientX)}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                  >
                    <div className="absolute inset-0">
                      <Image src="/images/master-long-9.jpg" alt="After" fill className="object-cover" />
                      <div className="absolute top-4 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{item.labelAfter}</div>
                    </div>
                    <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                      <Image src="/images/kitchen-6.jpg" alt="Before" fill className="object-cover" />
                      <div className="absolute top-4 left-6 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{item.labelBefore}</div>
                    </div>
                    <div className="absolute top-0 bottom-0 w-1 bg-white z-20" style={{ left: `${sliderPosition}%` }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-muted">
                        <MoveHorizontal className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                {item.type === "placeholder" && (
                  <div className={`relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white ${item.bg} flex items-center justify-center`}>
                    <div className="text-center">
                      {item.iconPlaceholder && <item.iconPlaceholder className={`h-10 w-10 mx-auto mb-4 opacity-20`} />}
                      <p className="opacity-40 font-bold uppercase tracking-widest text-[10px]">{item.label}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
