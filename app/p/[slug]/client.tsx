"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { BookingCalendar } from "@/components/booking-calendar";

export default function PropertyWebsiteClient({
  property, agent, modules, curated, descriptions, stagings, exports: designExports, template,
}: {
  property: any;
  agent: any;
  modules: Record<string, boolean>;
  curated: Record<string, string[]>;
  descriptions: any[];
  stagings: any[];
  exports: any[];
  template: string;
}) {
  const photos = curated.photos || [];
  const agentName = agent?.saved_agent_name || "";
  const location = [property.city, property.state, property.zip].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] w-full overflow-hidden">
        {photos[0] ? (
          <img src={photos[0]} alt={property.address} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 z-10">
          <div className="max-w-5xl mx-auto">
            {property.price && (
              <p className="text-white/90 text-2xl sm:text-4xl font-bold mb-2">${property.price.toLocaleString()}</p>
            )}
            <h1 className="text-white text-3xl sm:text-5xl font-extrabold leading-tight mb-3">{property.address}</h1>
            {location && (
              <p className="text-white/80 text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />{location}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Property Details</h2>
        <p className="text-gray-600">
          {property.bedrooms && `${property.bedrooms} beds · `}
          {property.bathrooms && `${property.bathrooms} baths · `}
          {property.sqft && `${property.sqft.toLocaleString()} sqft`}
        </p>

        <div className="mt-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Schedule a Showing</h2>
          <BookingCalendar propertyId={property.id} mode="book" agentName={agentName} />
        </div>

        {agentName && <p className="mt-8 text-sm text-gray-500">Listed by {agentName}</p>}
      </div>

      <footer className="border-t border-gray-200 py-10">
        <p className="text-center text-xs text-gray-400">
          Powered by <a href="https://realestatephoto2video.com" className="underline">P2V</a>
        </p>
      </footer>
    </div>
  );
}
