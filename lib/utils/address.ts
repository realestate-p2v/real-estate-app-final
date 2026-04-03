export function normalizeAddress(raw: string): string {
  if (!raw) return "";

  let addr = raw.trim().toLowerCase();

  // Remove unit/apt/suite suffixes for matching
  addr = addr.replace(/\s*(apt|apartment|unit|suite|ste|#)\s*\S*/gi, "");

  // Standardize abbreviations
  const replacements: [RegExp, string][] = [
    [/\bstreet\b/g, "st"],
    [/\bavenue\b/g, "ave"],
    [/\bboulevard\b/g, "blvd"],
    [/\bdrive\b/g, "dr"],
    [/\blane\b/g, "ln"],
    [/\broad\b/g, "rd"],
    [/\bcourt\b/g, "ct"],
    [/\bcircle\b/g, "cir"],
    [/\bplace\b/g, "pl"],
    [/\bterrace\b/g, "ter"],
    [/\bhighway\b/g, "hwy"],
    [/\bparkway\b/g, "pkwy"],
    [/\bnorth\b/g, "n"],
    [/\bsouth\b/g, "s"],
    [/\beast\b/g, "e"],
    [/\bwest\b/g, "w"],
    [/\bnortheast\b/g, "ne"],
    [/\bnorthwest\b/g, "nw"],
    [/\bsoutheast\b/g, "se"],
    [/\bsouthwest\b/g, "sw"],
  ];

  for (const [pattern, replacement] of replacements) {
    addr = addr.replace(pattern, replacement);
  }

  // Remove all punctuation except spaces and numbers
  addr = addr.replace(/[.,\-#]/g, "");

  // Collapse multiple spaces
  addr = addr.replace(/\s+/g, " ").trim();

  return addr;
}
