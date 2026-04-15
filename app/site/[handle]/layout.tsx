// ============================================================
// FILE: app/site/[handle]/layout.tsx
// ============================================================
import { getSite, getProfile, getLocationPageCount } from "./data";

interface Props {
  params: Promise<{ handle: string }>;
  children: React.ReactNode;
}

export default async function AgentSiteLayout({ params, children }: Props) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return <>{children}</>;
  const [profile, locationCount] = await Promise.all([
    getProfile(site.user_id),
    getLocationPageCount(site.user_id),
  ]);

  const title = site.site_title || profile.agent_name || "Agent Site";
  const primary = site.primary_color || "#334155";
  const logoSrc = profile.logo_url || null;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Listings", href: "/listings" },
  ];
  if (locationCount > 0) navLinks.push({ label: "Locations", href: "/locations" });
  if (site.blog_enabled) navLinks.push({ label: "Blog", href: "/blog" });
  navLinks.push({ label: "Contact", href: "/contact" });
  if (site.calendar_enabled) navLinks.push({ label: "Calendar", href: "/calendar" });

  return (
    <>
      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={title}
              style={{ maxHeight: 36, maxWidth: 140, objectFit: "contain" }}
            />
          ) : null}
          <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{title}</span>
        </a>

        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ fontSize: 14, fontWeight: 500, color: "#555", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main>{children}</main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          padding: "40px 32px 24px",
          backgroundColor: "#fff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
              {profile.agent_name || title}
            </p>
            {profile.company && (
              <p style={{ fontSize: 14, color: "#888", margin: 0 }}>{profile.company}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {profile.phone && (
              <a href={"tel:" + profile.phone.replace(/\D/g, "")} style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>
                {profile.phone}
              </a>
            )}
            {profile.email && (
              <a href={"mailto:" + profile.email} style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>
                {profile.email}
              </a>
            )}
          </div>
        </div>
        <div
          style={{
            maxWidth: 1200,
            margin: "24px auto 0",
            paddingTop: 16,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>
            &copy; {new Date().getFullYear()} {profile.agent_name || title}. All rights reserved.
          </p>
          <a
            href="https://realestatephoto2video.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "#ccc", textDecoration: "none" }}
          >
            Powered by Realestatephoto2video.com
          </a>
        </div>
      </footer>
    </>
  );
}
