"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import PhotoOptimizer from "./PhotoOptimizer";

export default function PhotoOptimizerPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) setUser(authUser);
      } catch (err) {
        console.error("Auth error:", err);
      }
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-white/60 text-sm">Sign in to access Photo Optimizer</p>
        </div>
      </div>
    );
  }

  return <PhotoOptimizer userId={user.id} />;
}
