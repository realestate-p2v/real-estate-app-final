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

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const { reportType, reportTitle, clientName, sections, agent } = body;

    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 612;
    const PAGE_H = 792;
    const MARGIN = 56;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const COLOR_DARK = rgb(0.05, 0.05, 0.1);
    const COLOR_ACCENT = hexToRgb("#22d3ee"); // cyan-400
    const COLOR_GRAY = rgb(0.35, 0.35, 0.4);
    const COLOR_LIGHT = rgb(0.92, 0.95, 0.97);
    const COLOR_WHITE = rgb(1, 1, 1);

    // ── COVER PAGE ──────────────────────────────────────
    const cover = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Dark background
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: COLOR_DARK });

    // Accent bar top
    cover.drawRectangle({ x: 0, y: PAGE_H - 6, width: PAGE_W, height: 6, color: COLOR_ACCENT });

    // Report type badge
    const badgeLabel = (reportType === "seller" ? "SELLER'S GUIDE" : "BUYER'S GUIDE").toUpperCase();
    const badgeW = helveticaBold.widthOfTextAtSize(badgeLabel, 10) + 24;
    cover.drawRectangle({ x: MARGIN, y: PAGE_H - 80, width: badgeW, height: 24, color: hexToRgb("#0e7490"), borderRadius: 4 });
    cover.drawText(badgeLabel, { x: MARGIN + 12, y: PAGE_H - 72, size: 10, font: helveticaBold, color: COLOR_ACCENT });

    // Title
    const titleLines = wrapText(reportTitle || "Your Personalized Real Estate Guide", 38);
    let titleY = PAGE_H - 130;
    for (const line of titleLines) {
      cover.drawText(line, { x: MARGIN, y: titleY, size: 28, font: helveticaBold, color: COLOR_WHITE });
      titleY -= 36;
    }

    // Client name
    cover.drawText(`Prepared for: ${clientName || ""}`, {
      x: MARGIN, y: titleY - 16, size: 14, font: helvetica, color: hexToRgb("#94a3b8"),
    });

    // Divider
    cover.drawRectangle({ x: MARGIN, y: titleY - 48, width: CONTENT_W, height: 1, color: hexToRgb("#1e3a5f") });

    // Agent info block
    let agentY = titleY - 80;
    if (agent?.saved_agent_name) {
      cover.drawText(agent.saved_agent_name, { x: MARGIN, y: agentY, size: 16, font: helveticaBold, color: COLOR_WHITE });
      agentY -= 22;
    }
    if (agent?.saved_company) {
      cover.drawText(agent.saved_company, { x: MARGIN, y: agentY, size: 12, font: helvetica, color: hexToRgb("#94a3b8") });
      agentY -= 18;
    }
    if (agent?.saved_phone) {
      cover.drawText(agent.saved_phone, { x: MARGIN, y: agentY, size: 11, font: helvetica, color: hexToRgb("#94a3b8") });
      agentY -= 16;
    }
    if (agent?.saved_email) {
      cover.drawText(agent.saved_email, { x: MARGIN, y: agentY, size: 11, font: helvetica, color: hexToRgb("#94a3b8") });
      agentY -= 16;
    }
    if (agent?.saved_website) {
      cover.drawText(agent.saved_website, { x: MARGIN, y: agentY, size: 11, font: helvetica, color: COLOR_ACCENT });
    }

    // Bottom accent bar
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 5, color: COLOR_ACCENT });

    // ── CONTENT PAGES ────────────────────────────────────
    for (const section of sections) {
      if (!section.content?.trim()) continue;

      let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      // Top accent line
      page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: COLOR_ACCENT });

      // Section title background pill
      const titleText = section.title.toUpperCase();
      page.drawRectangle({ x: MARGIN, y: y - 28, width: CONTENT_W, height: 32, color: hexToRgb("#0c1a2e"), borderRadius: 6 });
      page.drawText(titleText, { x: MARGIN + 14, y: y - 18, size: 12, font: helveticaBold, color: COLOR_ACCENT });
      y -= 52;

      // Content paragraphs
      const paragraphs = section.content.split(/\n+/).filter((p: string) => p.trim());

      for (const para of paragraphs) {
        const lines = wrapText(para.trim(), 82);

        for (const line of lines) {
          if (y < MARGIN + 60) {
            // Footer on current page
            page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 28, color: hexToRgb("#0c1a2e") });
            page.drawText(agent?.saved_agent_name || "", { x: MARGIN, y: 9, size: 8, font: helvetica, color: hexToRgb("#64748b") });
            page.drawText(agent?.saved_company || "", { x: PAGE_W / 2 - 40, y: 9, size: 8, font: helvetica, color: hexToRgb("#64748b") });

            // New page
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: COLOR_ACCENT });
            y = PAGE_H - MARGIN;
          }

          page.drawText(line, { x: MARGIN, y, size: 10.5, font: helvetica, color: COLOR_DARK, lineHeight: 15 });
          y -= 16;
        }
        y -= 8; // paragraph gap
      }

      // Footer
      page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 28, color: hexToRgb("#0c1a2e") });
      page.drawText(agent?.saved_agent_name || "", { x: MARGIN, y: 9, size: 8, font: helvetica, color: hexToRgb("#64748b") });
      page.drawText(agent?.saved_company || "", { x: PAGE_W / 2 - 40, y: 9, size: 8, font: helvetica, color: hexToRgb("#64748b") });
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
