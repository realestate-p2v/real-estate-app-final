// app/site/[handle]/about/page.tsx
import { notFound } from "next/navigation";
import { getSite, getProfile } from "../data";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function AboutPage({ params }: Props) {
  const { handle } = await params;
  const site = await getSite(handle);
  if (!site) return notFound();
  const profile = await getProfile(site.user_id);
  const primary = site.primary_color || "#334155";
  const photoUrl = site.about_photo_url || profile.headshot_url || null;

  return (
    <div style={{ padding: "64px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        {photoUrl ? (
          <img src={photoUrl} alt={profile.agent_name || ""} style={{ width: 240, height: 240, borderRadius: 16, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
        ) : null}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
            {profile.agent_name ? "About " + profile.agent_name : "About"}
          </h1>
          {profile.company ? <p style={{ fontSize: 17, color: "#666", margin: "0 0 4px", fontWeight: 600 }}>{profile.company}</p> : null}
          {profile.phone ? <p style={{ fontSize: 15, color: "#888", margin: "0 0 4px" }}>{profile.phone}</p> : null}
          {profile.email ? <p style={{ fontSize: 15, color: "#888", margin: "0 0 20px" }}>{profile.email}</p> : null}

          {site.bio ? <p style={{ fontSize: 17, color: "#333", margin: "0 0 16px", lineHeight: 1.7 }}>{site.bio}</p> : null}
          {site.about_content ? <p style={{ fontSize: 16, color: "#555", margin: "0 0 24px", lineHeight: 1.7 }}>{site.about_content}</p> : null}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {profile.phone ? (
              <a href={"tel:" + profile.phone.replace(/\D/g, "")} style={{ display: "inline-block", padding: "12px 28px", backgroundColor: primary, color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>Call {profile.phone}</a>
            ) : null}
            {profile.email ? (
              <a href={"mailto:" + profile.email} style={{ display: "inline-block", padding: "12px 28px", border: "2px solid " + primary, color: primary, borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>Email Me</a>
            ) : null}
          </div>
        </div>
      </div>

      {/* FAQ on about page too */}
      {site.faq_items.length > 0 ? (
        <div style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: "0 0 24px" }}>FAQ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {site.faq_items.map((faq, i) => (
              <div key={i} style={{ padding: "18px 22px", backgroundColor: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 6px" }}>{faq.question}</p>
                <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
