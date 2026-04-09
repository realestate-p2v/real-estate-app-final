import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

/** Fetch a remote image and embed it into the PDF doc. Returns null on failure. */
async function embedRemoteImage(pdfDoc: InstanceType<typeof PDFDocument>, url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (contentType.includes("png") || url.toLowerCase().endsWith(".png")) {
      return await pdfDoc.embedPng(bytes);
    }
    // Default to JPEG for jpg, jpeg, webp, or unknown
    return await pdfDoc.embedJpg(bytes);
  } catch {
    console.warn("Failed to embed image:", url);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      const { data: usage } = await supabase
        .from("lens_usage")
        .select("is_subscriber")
        .eq("user_id", user.id)
        .single();
      if (!usage?.is_subscriber) {
        return NextResponse.json({ error: "Subscription required" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { reportType, reportTitle, clientName, sections, agent, accentColor } = body;

    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 612;
    const PAGE_H = 792;
    const MARGIN = 56;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // Colors
    const COLOR_DARK = rgb(0.12, 0.12, 0.15);
    const COLOR_TEXT = rgb(0.15, 0.15, 0.2);
    const COLOR_ACCENT = accentColor ? hexToRgb(accentColor) : hexToRgb("#0e7490");
    const COLOR_SUBTITLE = rgb(0.45, 0.47, 0.53);
    const COLOR_LIGHT_BG = rgb(0.96, 0.97, 0.98);
    const COLOR_WHITE = rgb(1, 1, 1);
    const COLOR_DIVIDER = rgb(0.88, 0.9, 0.92);
    const COLOR_FOOTER_BG = rgb(0.96, 0.97, 0.98);
    const COLOR_FOOTER_TEXT = rgb(0.6, 0.62, 0.66);

    // ── Embed agent images (run concurrently) ──
    const [headshotImage, logoImage] = await Promise.all([
      agent?.saved_headshot_url ? embedRemoteImage(pdfDoc, agent.saved_headshot_url) : null,
      agent?.saved_logo_url ? embedRemoteImage(pdfDoc, agent.saved_logo_url) : null,
    ]);

    // ══════════════════════════════════════════════
    // COVER PAGE — Light mode (ink-friendly)
    // ══════════════════════════════════════════════
    const cover = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // White background (default, no fill needed)
    // Top accent bar
    cover.drawRectangle({
      x: 0,
      y: PAGE_H - 6,
      width: PAGE_W,
      height: 6,
      color: COLOR_ACCENT,
    });

    // Logo — top right
    if (logoImage) {
      const logoDims = logoImage.scale(1);
      const maxLogoH = 40;
      const maxLogoW = 140;
      const logoScale = Math.min(maxLogoH / logoDims.height, maxLogoW / logoDims.width, 1);
      const lw = logoDims.width * logoScale;
      const lh = logoDims.height * logoScale;
      cover.drawImage(logoImage, {
        x: PAGE_W - MARGIN - lw,
        y: PAGE_H - 28 - lh,
        width: lw,
        height: lh,
      });
    }

    // Report type badge
    const badgeLabel = (reportType === "seller" ? "SELLER'S GUIDE" : "BUYER'S GUIDE").toUpperCase();
    const badgeW = helveticaBold.widthOfTextAtSize(badgeLabel, 10) + 24;
    cover.drawRectangle({
      x: MARGIN,
      y: PAGE_H - 80,
      width: badgeW,
      height: 24,
      color: COLOR_ACCENT,
    });
    cover.drawText(badgeLabel, {
      x: MARGIN + 12,
      y: PAGE_H - 72,
      size: 10,
      font: helveticaBold,
      color: COLOR_WHITE,
    });

    // Title
    const titleLines = wrapText(reportTitle || "Your Personalized Real Estate Guide", 38);
    let titleY = PAGE_H - 130;
    for (const line of titleLines) {
      cover.drawText(line, {
        x: MARGIN,
        y: titleY,
        size: 28,
        font: helveticaBold,
        color: COLOR_DARK,
      });
      titleY -= 36;
    }

    // Client name
    cover.drawText(`Prepared for: ${clientName || ""}`, {
      x: MARGIN,
      y: titleY - 16,
      size: 14,
      font: helvetica,
      color: COLOR_SUBTITLE,
    });

    // Divider
    cover.drawRectangle({
      x: MARGIN,
      y: titleY - 48,
      width: CONTENT_W,
      height: 1,
      color: COLOR_DIVIDER,
    });

    // Agent info block — with headshot
    let agentY = titleY - 80;
    const agentTextX = headshotImage ? MARGIN + 72 : MARGIN;

    // Draw headshot circle area
    if (headshotImage) {
      const hsDims = headshotImage.scale(1);
      const hsSize = 60;
      const hsScale = Math.min(hsSize / hsDims.width, hsSize / hsDims.height);
      cover.drawImage(headshotImage, {
        x: MARGIN,
        y: agentY - 44,
        width: hsDims.width * hsScale,
        height: hsDims.height * hsScale,
      });
    }

    if (agent?.saved_agent_name) {
      cover.drawText(agent.saved_agent_name, {
        x: agentTextX,
        y: agentY,
        size: 16,
        font: helveticaBold,
        color: COLOR_DARK,
      });
      agentY -= 22;
    }
    if (agent?.saved_company) {
      cover.drawText(agent.saved_company, {
        x: agentTextX,
        y: agentY,
        size: 12,
        font: helvetica,
        color: COLOR_SUBTITLE,
      });
      agentY -= 18;
    }
    if (agent?.saved_phone) {
      cover.drawText(agent.saved_phone, {
        x: agentTextX,
        y: agentY,
        size: 11,
        font: helvetica,
        color: COLOR_SUBTITLE,
      });
      agentY -= 16;
    }
    if (agent?.saved_email) {
      cover.drawText(agent.saved_email, {
        x: agentTextX,
        y: agentY,
        size: 11,
        font: helvetica,
        color: COLOR_SUBTITLE,
      });
      agentY -= 16;
    }
    if (agent?.saved_website) {
      cover.drawText(agent.saved_website, {
        x: agentTextX,
        y: agentY,
        size: 11,
        font: helvetica,
        color: COLOR_ACCENT,
      });
    }

    // Bottom accent bar
    cover.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: 5,
      color: COLOR_ACCENT,
    });

    // ══════════════════════════════════════════════
    // CONTENT PAGES
    // ══════════════════════════════════════════════
    for (const section of sections) {
      if (!section.content?.trim()) continue;

      let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      // Top accent line
      page.drawRectangle({
        x: 0,
        y: PAGE_H - 4,
        width: PAGE_W,
        height: 4,
        color: COLOR_ACCENT,
      });

      // Section title — light pill background
      const titleText = section.title.toUpperCase();
      page.drawRectangle({
        x: MARGIN,
        y: y - 28,
        width: CONTENT_W,
        height: 32,
        color: COLOR_LIGHT_BG,
      });
      page.drawText(titleText, {
        x: MARGIN + 14,
        y: y - 18,
        size: 12,
        font: helveticaBold,
        color: COLOR_ACCENT,
      });
      y -= 52;

      // Content paragraphs
      const paragraphs = section.content
        .split(/\n+/)
        .filter((p: string) => p.trim());

      for (const para of paragraphs) {
        const lines = wrapText(para.trim(), 82);

        for (const line of lines) {
          if (y < MARGIN + 60) {
            // Footer on current page
            page.drawRectangle({
              x: 0,
              y: 0,
              width: PAGE_W,
              height: 28,
              color: COLOR_FOOTER_BG,
            });
            page.drawText(agent?.saved_agent_name || "", {
              x: MARGIN,
              y: 9,
              size: 8,
              font: helvetica,
              color: COLOR_FOOTER_TEXT,
            });
            page.drawText(agent?.saved_company || "", {
              x: PAGE_W / 2 - 40,
              y: 9,
              size: 8,
              font: helvetica,
              color: COLOR_FOOTER_TEXT,
            });

            // New page
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawRectangle({
              x: 0,
              y: PAGE_H - 4,
              width: PAGE_W,
              height: 4,
              color: COLOR_ACCENT,
            });
            y = PAGE_H - MARGIN;
          }

          page.drawText(line, {
            x: MARGIN,
            y,
            size: 10.5,
            font: helvetica,
            color: COLOR_TEXT,
            lineHeight: 15,
          });
          y -= 16;
        }
        y -= 8; // paragraph gap
      }

      // Footer
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: 28,
        color: COLOR_FOOTER_BG,
      });
      page.drawText(agent?.saved_agent_name || "", {
        x: MARGIN,
        y: 9,
        size: 8,
        font: helvetica,
        color: COLOR_FOOTER_TEXT,
      });
      page.drawText(agent?.saved_company || "", {
        x: PAGE_W / 2 - 40,
        y: 9,
        size: 8,
        font: helvetica,
        color: COLOR_FOOTER_TEXT,
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}-guide.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
