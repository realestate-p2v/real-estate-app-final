import Link from "next/link";
import { Building2 } from "lucide-react";
import { PortalThemeProvider } from "@/components/portal-theme-provider";
import { PortalNav } from "@/components/portal-nav";
import { PortalLensyWrapper } from "@/components/portal-lensy-wrapper";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
        <PortalNav />

        {/* Page content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <Link href="/" className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-base font-bold">
                    <span className="text-cyan-500 dark:text-cyan-400">P2V</span>
                    <span className="text-gray-400 dark:text-white/70">.homes</span>
                  </span>
                </Link>
                <p className="text-sm text-gray-400 dark:text-white/40 leading-relaxed">
                  Browse real estate listings powered by professional video and AI marketing tools.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
                  Explore
                </h4>
                <div className="flex flex-col gap-2">
                  <Link href="/listings" className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors">
                    Browse Listings
                  </Link>
                  <Link href="/search" className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors">
                    Search
                  </Link>
                  <Link href="/join" className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors">
                    For Agents
                  </Link>
                </div>
              </div>

              {/* Powered by */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
                  Platform
                </h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://realestatephoto2video.com"
                    className="text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                  >
                    Powered by Realestatephoto2video.com
                  </a>
                  <a
                    href="https://realestatephoto2video.com/lens"
                    className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                  >
                    P2V Lens AI Tools
                  </a>
                  <a
                    href="https://realestatephoto2video.com/order"
                    className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                  >
                    Order a Listing Video
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-gray-300 dark:text-white/30">
                © {new Date().getFullYear()} P2V Homes. All rights reserved.
              </p>
              <a
                href="https://realestatephoto2video.com"
                className="text-xs text-cyan-400/60 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
              >
                Powered by Realestatephoto2video.com
              </a>
            </div>
          </div>
        </footer>
      </div>
      <PortalLensyWrapper />
    </PortalThemeProvider>
  );
}
