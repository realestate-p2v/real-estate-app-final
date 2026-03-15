"use client";

import { useMemo } from "react";

interface BlogContentProps {
  content: string;
}

// Simple but solid markdown-to-HTML converter
// Handles: headers, bold, italic, links, images, lists, blockquotes, code, hr
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities (but preserve markdown syntax)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Re-enable blockquotes (we just escaped >)
  html = html.replace(/^&gt;\s?(.*)$/gm, "<blockquote>$1</blockquote>");
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");

  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<figure><img src="${src}" alt="${alt}" loading="lazy" />${alt ? `<figcaption>${alt}</figcaption>` : ""}</figure>`;
  });

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Headers (must come before bold processing)
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Unordered lists
  html = html.replace(/^(\s*)[-*]\s+(.+)$/gm, "$1<li>$2</li>");
  
  // Ordered lists
  html = html.replace(/^(\s*)\d+\.\s+(.+)$/gm, "$1<oli>$2</oli>");

  // Wrap consecutive <li> in <ul> and <oli> in <ol>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    return "<ol>" + match.replace(/<\/?oli>/g, (tag) => tag.replace("oli", "li")) + "</ol>";
  });

  // Paragraphs: wrap remaining text lines
  const lines = html.split("\n");
  const result: string[] = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isBlock = /^<(h[1-4]|ul|ol|li|blockquote|figure|hr|pre|div)/.test(line) || 
                    /<\/(ul|ol|blockquote|figure)>$/.test(line);

    if (!line) {
      if (inParagraph) {
        result.push("</p>");
        inParagraph = false;
      }
      continue;
    }

    if (isBlock) {
      if (inParagraph) {
        result.push("</p>");
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push("<p>");
        inParagraph = true;
      }
      result.push(line);
    }
  }
  if (inParagraph) result.push("</p>");

  return result.join("\n");
}

export function BlogContent({ content }: BlogContentProps) {
  const html = useMemo(() => markdownToHtml(content), [content]);

  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        // CSS for the blog content
      }}
    />
  );
}

// Add this CSS to your global stylesheet (globals.css):
// Or we inline it via a style tag
export function BlogContentStyles() {
  return (
    <style jsx global>{`
      .blog-content {
        font-size: 1.125rem;
        line-height: 1.8;
        color: hsl(var(--foreground));
      }

      .blog-content h1 {
        font-size: 2.25rem;
        font-weight: 800;
        margin: 2.5rem 0 1rem;
        line-height: 1.2;
        color: hsl(var(--foreground));
      }

      .blog-content h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 2.5rem 0 1rem;
        line-height: 1.3;
        color: hsl(var(--foreground));
        padding-bottom: 0.5rem;
        border-bottom: 2px solid hsl(var(--border));
      }

      .blog-content h3 {
        font-size: 1.375rem;
        font-weight: 600;
        margin: 2rem 0 0.75rem;
        line-height: 1.4;
        color: hsl(var(--foreground));
      }

      .blog-content h4 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 1.5rem 0 0.5rem;
        color: hsl(var(--foreground));
      }

      .blog-content p {
        margin-bottom: 1.25rem;
      }

      .blog-content strong {
        font-weight: 700;
        color: hsl(var(--foreground));
      }

      .blog-content em {
        font-style: italic;
      }

      .blog-content a {
        color: hsl(var(--accent));
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: opacity 0.2s;
      }

      .blog-content a:hover {
        opacity: 0.8;
      }

      .blog-content ul {
        list-style: disc;
        margin: 1rem 0 1.5rem 1.5rem;
        padding: 0;
      }

      .blog-content ol {
        list-style: decimal;
        margin: 1rem 0 1.5rem 1.5rem;
        padding: 0;
      }

      .blog-content li {
        margin-bottom: 0.5rem;
        padding-left: 0.25rem;
      }

      .blog-content blockquote {
        border-left: 4px solid hsl(var(--accent));
        padding: 1rem 1.5rem;
        margin: 1.5rem 0;
        background: hsl(var(--muted) / 0.5);
        border-radius: 0 0.75rem 0.75rem 0;
        font-style: italic;
        color: hsl(var(--muted-foreground));
      }

      .blog-content code {
        background: hsl(var(--muted));
        padding: 0.2rem 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.9em;
        font-family: ui-monospace, monospace;
      }

      .blog-content hr {
        border: none;
        border-top: 2px solid hsl(var(--border));
        margin: 2.5rem 0;
      }

      .blog-content figure {
        margin: 2rem 0;
        border-radius: 1rem;
        overflow: hidden;
      }

      .blog-content figure img {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 1rem;
      }

      .blog-content figure figcaption {
        text-align: center;
        font-size: 0.875rem;
        color: hsl(var(--muted-foreground));
        margin-top: 0.75rem;
        font-style: italic;
      }

      /* Make sure images from Pexels with credit links look good */
      .blog-content figure + p em {
        display: block;
        text-align: center;
        font-size: 0.8rem;
        color: hsl(var(--muted-foreground));
        margin-top: -1rem;
        margin-bottom: 1.5rem;
      }
    `}</style>
  );
}
