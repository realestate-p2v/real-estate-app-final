// app/site/layout.tsx
// Passthrough layout — no nav, no footer.
// The [handle]/layout.tsx handles all chrome.
// This file MUST exist to prevent Next.js from
// inheriting a parent layout that adds duplicate nav.

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
