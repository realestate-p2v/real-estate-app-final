"use client";

import Link from "next/link";
import { Building2, Search, Users, Sun, Moon } from "lucide-react";
import { useTheme } from "./portal-theme-provider";

export function PortalNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-cyan-500 dark:text-cyan-400">P2V</span>
              <span className="text-gray-400 dark:text-white/70">.homes</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/listings"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              Browse Listings
            </Link>
            <Link
              href="/join"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
            >
              <Users className="h-3.5 w-3.5" />
              For Agents
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all ml-1"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>

            <Link
              href="https://realestatephoto2video.com/order"
              className="ml-2 px-4 py-2 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-white transition-all"
            >
              Order a Video
            </Link>
          </div>

          {/* Mobile */}
          <div className="sm:hidden flex items-center gap-1">
            <Link
              href="/listings"
              className="p-2 rounded-lg text-gray-400 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/join"
              className="p-2 rounded-lg text-gray-400 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
            >
              <Users className="h-5 w-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
