// lib/planner/self-marketing.ts
// Agent self-marketing prompt logic + brand score data fetching
// Nudges agents to market themselves, not just their listings.

export interface SelfMarketingPrompt {
  type: string;
  label: string;
  description: string;
  platforms: string[];
  captionPrompt: string;
}

// ─── Self-Marketing Content Types ───────────────────────────────────────────

export const SELF_MARKETING_TYPES: SelfMarketingPrompt[] = [
  {
    type: "about_me",
    label: "About Me post",
    description: "Personal bio — background, why real estate, what makes you different",
    platforms: ["instagram", "facebook", "linkedin"],
    captionPrompt:
      "Write a personal 'About Me' social media post for a real estate agent. Share their story — why they got into real estate, what they love about it, and what makes them different. Warm, authentic, not salesy. Include a soft CTA.",
  },
  {
    type: "client_testimonial",
    label: "Client testimonial",
    description: "Template for a client quote + agent reflection",
    platforms: ["instagram", "facebook"],
    captionPrompt:
      "Write a client testimonial social media post template. Include a placeholder for the client quote and a short reflection from the agent about what the experience meant. Grateful tone.",
  },
  {
    type: "market_update",
    label: "Market update",
    description: "Data-informed post about local trends",
    platforms: ["linkedin", "facebook"],
    captionPrompt:
      "Write a local real estate market update post. Reference current trends (inventory, pricing, buyer demand). Position the agent as a knowledgeable local expert. Professional but accessible.",
  },
  {
    type: "day_in_the_life",
    label: "Day in the life",
    description: "Behind-the-scenes style post showing daily routine",
    platforms: ["instagram"],
    captionPrompt:
      "Write a 'day in the life' Instagram post for a real estate agent. Casual, behind-the-scenes vibe. Show the hustle — showings, paperwork, client calls, coffee runs. Relatable and human.",
  },
  {
    type: "real_estate_tip",
    label: "Real estate tip",
    description: "Quick educational tip for buyers or sellers",
    platforms: ["instagram", "facebook", "linkedin"],
    captionPrompt:
      "Write a quick, actionable real estate tip post. Could be for buyers (what to look for at an open house) or sellers (how to prep for photos). Educational, concise, shareable.",
  },
  {
    type: "just_closed_reflection",
    label: "Just Closed reflection",
    description: "'What I learned from this deal' story",
    platforms: ["linkedin", "instagram"],
    captionPrompt:
      "Write a reflective post about a recently closed deal. What was unique about it? What did the agent learn? How did they help the client win? Storytelling format.",
  },
  {
    type: "community_involvement",
    label: "Community involvement",
    description: "Local events, charity, business shoutouts",
    platforms: ["facebook", "instagram"],
    captionPrompt:
      "Write a community-focused post. Could be about a local event, charity partnership, or shoutout to a local business. Shows the agent is connected to and invested in the community.",
  },
];

// ─── Nudge Logic ────────────────────────────────────────────────────────────

const NUDGE_THRESHOLD_DAYS = 14;

export interface NudgeResult {
  shouldNudge: boolean;
  daysSinceLastPersonalPost: number | null;
  suggestedTypes: SelfMarketingPrompt[];
  message: string;
}

export function checkSelfMarketingNudge(
  daysSinceLastPersonalPost: number | null
): NudgeResult {
  // Never posted personally, or been too long
  if (daysSinceLastPersonalPost === null || daysSinceLastPersonalPost > NUDGE_THRESHOLD_DAYS) {
    const neverPosted = daysSinceLastPersonalPost === null;
    return {
      shouldNudge: true,
      daysSinceLastPersonalPost,
      suggestedTypes: SELF_MARKETING_TYPES.slice(0, 5), // Top 5 options
      message: neverPosted
        ? "You haven't shared anything about yourself yet. Agents who share their story get 40% more engagement."
        : `You haven't posted about yourself in ${daysSinceLastPersonalPost} days. Agents who share their story get 40% more engagement.`,
    };
  }

  return {
    shouldNudge: false,
    daysSinceLastPersonalPost,
    suggestedTypes: [],
    message: "",
  };
}

// ─── Brand Score Data Shape ─────────────────────────────────────────────────
// The actual calculation lives in score.ts (calculateBrandScore).
// This file provides the data-fetching helper for the API route.

export interface BrandScoreData {
  hasHeadshot: boolean;
  hasLogo: boolean;
  hasCompany: boolean;
  hasBio: boolean;
  hasPublishedWebsite: boolean;
  daysSincePersonalPost: number | null;
  daysSinceMarketUpdate: number | null;
}

/**
 * Compute days since a given timestamp. Returns null if timestamp is null.
 */
export function daysSince(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const then = new Date(timestamp);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}
