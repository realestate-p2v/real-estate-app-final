"use client";

import dynamic from "next/dynamic";

const LensyPortal = dynamic(() => import("@/components/lensy-portal"), { ssr: false });

export function PortalLensyWrapper() {
  return <LensyPortal mode="portal" />;
}
