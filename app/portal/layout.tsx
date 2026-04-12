import Link from "next/link";
import { Building2, Search, Users, Menu, X } from "lucide-react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <Building2 className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-cyan-400">P2V</span>
                <span className="text-white/70">.homes</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/listings"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Search className="h-3.5 w-3.5" />
                Browse Listings
              </Link>
              <Link
                href="/join"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Users className="h-3.5 w-3.5" />
                For Agents
              </Link>
              <Link
                href="https://realestatephoto2video.com/order"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-white transition-all"
              >
                Order a Video
              </Link>
            </div>

            {/* Mobile menu button — handled via CSS only */}
            <div className="sm:hidden flex items-center gap-2">
              <Link
                href="/listings"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                <Search className="h-5 w-5" />
              </Link>
              <Link
                href="/join"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                <Users className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold">
                  <span className="text-cyan-400">P2V</span>
                  <span className="text-white/70">.homes</span>
                </span>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed">
                Browse real estate listings powered by professional video and AI marketing tools.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Explore
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/listings" className="text-sm text-white/40 hover:text-white/80 transition-colors">
                  Browse Listings
                </Link>
                <Link href="/search" className="text-sm text-white/40 hover:text-white/80 transition-colors">
                  Search
                </Link>
                <Link href="/join" className="text-sm text-white/40 hover:text-white/80 transition-colors">
                  For Agents
                </Link>
              </div>
            </div>

            {/* Powered by */}
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Platform
              </h4>
              <div className="flex flex-col gap-2">
                <a
                  href="https://realestatephoto2video.com"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Powered by Realestatephoto2video.com
                </a>
                <a
                  href="https://realestatephoto2video.com/lens"
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  P2V Lens AI Tools
                </a>
                <a
                  href="https://realestatephoto2video.com/order"
                  className="text-sm text-white/40 hover:text-white/80 transition-colors"
                >
                  Order a Listing Video
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} P2V Homes. All rights reserved.
            </p>
            <a
              href="https://realestatephoto2video.com"
              className="text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
            >
              Powered by Realestatephoto2video.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
