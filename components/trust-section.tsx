import React from 'react';

export function TrustSection() {
  return (
    <section className="py-16 bg-white border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Trusted by Real Estate Professionals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">Fast Delivery</h3>
            <p className="text-gray-600">HD videos delivered to your inbox within 72 hours.</p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">High Quality</h3>
            <p className="text-gray-600">Professional editing and crystal clear resolution.</p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">24/7 Support</h3>
            <p className="text-gray-600">We are always available via WhatsApp for any questions.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
