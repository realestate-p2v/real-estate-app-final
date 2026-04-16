// ============================================================
// FILE: app/site/[handle]/contact/page.tsx
// ============================================================
import { notFound } from "next/navigation";
import { getSite, getProfile } from "../data";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return {};
  const profile = await getProfile(site.user_id);
  const agent = profile.agent_name || site.site_title || "Agent";
  const title = `Contact ${agent} | ${site.site_title || agent}`;
  const description = `Get in touch with ${agent}${profile.company ? " at " + profile.company : ""} for your real estate needs.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ContactPage({ params }: Props) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return notFound();
  const profile = await getProfile(site.user_id);
  const primary = site.primary_color || "#334155";

  return (
    <div style={{ padding: "64px 24px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", margin: "0 0 8px", textAlign: "center" }}>Get in Touch</h1>
      <p style={{ fontSize: 16, color: "#777", margin: "0 0 48px", textAlign: "center" }}>
        {profile.agent_name ? "Reach out to " + profile.agent_name : "We'd love to hear from you"}
      </p>

      <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 240px" }}>
          {profile.headshot_url ? (
            <img src={profile.headshot_url} alt={profile.agent_name || ""} style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
          ) : null}
          {profile.agent_name ? <p style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{profile.agent_name}</p> : null}
          {profile.company ? <p style={{ fontSize: 14, color: "#888", margin: "0 0 16px" }}>{profile.company}</p> : null}
          {profile.phone ? (
            <p style={{ margin: "0 0 8px" }}>
              <a href={"tel:" + profile.phone.replace(/\D/g, "")} style={{ fontSize: 15, color: primary, textDecoration: "none", fontWeight: 600 }}>{profile.phone}</a>
            </p>
          ) : null}
          {profile.email ? (
            <p style={{ margin: 0 }}>
              <a href={"mailto:" + profile.email} style={{ fontSize: 15, color: primary, textDecoration: "none" }}>{profile.email}</a>
            </p>
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <form action="https://realestatephoto2video.com/api/websites/contact" method="POST">
            <input type="hidden" name="handle" value={handle} />
            <input type="hidden" name="agent_email" value={profile.email || ""} />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 6 }}>Name</label>
              <input name="name" required style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 6 }}>Email</label>
              <input name="email" type="email" required style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 6 }}>Phone</label>
              <input name="phone" type="tel" style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 6 }}>Message</label>
              <textarea name="message" required rows={5} style={{ width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <button type="submit" style={{ padding: "14px 36px", backgroundColor: primary, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
