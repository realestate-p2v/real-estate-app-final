// lib/planner/lifecycle.ts
// Listing Lifecycle Campaign Generator
// Auto-generates a marketing campaign when a property is created or status changes.
// Campaigns are inserted into marketing_schedule linked to an auto-created marketing_plan.

export interface CampaignStep {
  dayOffset: number;
  platform: string;
  contentType: string;
  title: string;
  captionPrompt: string;
}

// ─── Active Listing Campaign (8 steps over 30 days) ─────────────────────────

const ACTIVE_LISTING_CAMPAIGN: CampaignStep[] = [
  {
    dayOffset: 0,
    platform: "instagram",
    contentType: "new_listing",
    title: "Coming Soon teaser",
    captionPrompt: "Write a teaser post hinting at a new listing about to hit the market. Build curiosity without giving away the address. Use emojis sparingly.",
  },
  {
    dayOffset: 2,
    platform: "facebook",
    contentType: "video_share",
    title: "Full video tour",
    captionPrompt: "Write a Facebook post sharing the full video walkthrough of this listing. Highlight top 3 features. Include a call to action for showings.",
  },
  {
    dayOffset: 4,
    platform: "instagram",
    contentType: "new_listing",
    title: "Photo carousel (best 5-8)",
    captionPrompt: "Write an Instagram carousel post showcasing the best photos of this listing. Mention key rooms and features visible in the photos.",
  },
  {
    dayOffset: 7,
    platform: "instagram",
    contentType: "staging_reveal",
    title: "Staging before/after",
    captionPrompt: "Write a post revealing the virtual staging transformation. Focus on the dramatic difference and how buyers can envision the space.",
  },
  {
    dayOffset: 10,
    platform: "facebook",
    contentType: "neighborhood",
    title: "Neighborhood spotlight",
    captionPrompt: "Write a neighborhood spotlight post highlighting what makes this listing's location special — schools, parks, restaurants, commute, vibe.",
  },
  {
    dayOffset: 14,
    platform: "instagram",
    contentType: "open_house",
    title: "Open House promo",
    captionPrompt: "Write an Open House announcement post with date, time, and why buyers should visit in person. Create urgency.",
  },
  {
    dayOffset: 21,
    platform: "linkedin",
    contentType: "market_update",
    title: "Market context post",
    captionPrompt: "Write a professional LinkedIn post about this listing in the context of current market conditions. Position yourself as a knowledgeable local expert.",
  },
  {
    dayOffset: 30,
    platform: "instagram",
    contentType: "new_listing",
    title: "Still available refresh",
    captionPrompt: "Write a refreshed post for a listing that's been on market 30 days. New angle — maybe a feature not yet highlighted, or a seasonal appeal.",
  },
];

// ─── Sold Campaign (4 steps) ────────────────────────────────────────────────

const SOLD_CAMPAIGN: CampaignStep[] = [
  {
    dayOffset: 0,
    platform: "instagram",
    contentType: "just_sold",
    title: "Just Sold announcement",
    captionPrompt: "Write a Just Sold celebration post. Express gratitude to the buyer and seller. Keep it professional but warm.",
  },
  {
    dayOffset: 1,
    platform: "facebook",
    contentType: "just_sold",
    title: "Facebook celebration",
    captionPrompt: "Write a Facebook Just Sold post. Slightly longer format. Thank the clients, mention the journey, include a CTA for anyone thinking of selling.",
  },
  {
    dayOffset: 2,
    platform: "linkedin",
    contentType: "just_sold",
    title: "Professional win",
    captionPrompt: "Write a professional LinkedIn post about closing this deal. Focus on what you learned, any challenges overcome, and your market expertise.",
  },
  {
    dayOffset: 7,
    platform: "blog",
    contentType: "market_update",
    title: "Sale case study blog",
    captionPrompt: "Write a blog post using this sale as a case study. Cover pricing strategy, days on market, marketing approach, and what it says about the local market.",
  },
];

// ─── Price Reduced Campaign (3 steps) ───────────────────────────────────────

const PRICE_REDUCED_CAMPAIGN: CampaignStep[] = [
  {
    dayOffset: 0,
    platform: "instagram",
    contentType: "price_reduced",
    title: "Price reduction alert",
    captionPrompt: "Write a price reduction post. Frame it as an opportunity, not desperation. Mention the new price and the value proposition.",
  },
  {
    dayOffset: 1,
    platform: "facebook",
    contentType: "price_reduced",
    title: "Value + opportunity post",
    captionPrompt: "Write a Facebook post about the price adjustment. Highlight the value at the new price point. Include what buyers get for the money.",
  },
  {
    dayOffset: 3,
    platform: "instagram",
    contentType: "new_listing",
    title: "Feature highlight at new price",
    captionPrompt: "Write a feature-focused post that doesn't mention price reduction. Just highlight a great feature of the home and let the new price speak for itself.",
  },
];

// ─── Public API ─────────────────────────────────────────────────────────────

export function getCampaignForStatus(status: string): CampaignStep[] | null {
  switch (status) {
    case "active":
    case "coming_soon":
    case "new":
      return ACTIVE_LISTING_CAMPAIGN;
    case "sold":
    case "closed":
      return SOLD_CAMPAIGN;
    case "price_reduced":
    case "price_change":
      return PRICE_REDUCED_CAMPAIGN;
    default:
      return null;
  }
}

export function getCampaignName(status: string, address: string): string {
  switch (status) {
    case "active":
    case "coming_soon":
    case "new":
      return `New Listing — ${address}`;
    case "sold":
    case "closed":
      return `Just Sold — ${address}`;
    case "price_reduced":
    case "price_change":
      return `Price Reduced — ${address}`;
    default:
      return `Campaign — ${address}`;
  }
}

export function generateScheduleDates(
  startDate: Date,
  campaign: CampaignStep[]
): { step: CampaignStep; scheduledDate: string }[] {
  return campaign.map((step) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + step.dayOffset);
    const scheduledDate = d.toISOString().split("T")[0];
    return { step, scheduledDate };
  });
}
