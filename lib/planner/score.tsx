// lib/planner/score.ts
// Content Score Engine — calculates per-property marketing completeness
// Items that don't apply are excluded from the denominator, never penalized.

export interface ScoreItem {
  key: string;
  label: string;
  points: number;
  earned: boolean;
  excluded: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export interface ContentScore {
  propertyId: string;
  propertyAddress: string;
  earned: number;
  possible: number;
  percentage: number;
  grade: string;
  items: ScoreItem[];
}

export interface BrandScore {
  earned: number;
  possible: number;
  percentage: number;
  grade: string;
  items: ScoreItem[];
}

interface PropertyData {
  id: string;
  address: string;
  status: string;
  photos: unknown[] | null;
  optimized_photos: unknown[] | null;
  website_published?: boolean;
}

interface PropertyAssets {
  hasOrder: boolean;
  hasVideoDelivery: boolean;
  hasRemix: boolean;
  hasDescription: boolean;
  hasFlyer: boolean;
  hasOptimizedPhotos: boolean;
  hasSocialShare: boolean;
  hasStaging: boolean;
  hasDroneAnnotation: boolean;
  hasWebsite: boolean;
  hasBlogPost: boolean;
  hasJustSoldGraphic: boolean;
  hasPriceReducedGraphic: boolean;
  photoCount: number;
  hasAgentWebsite: boolean;
  hasAerialPhotos: boolean;
  roomsAppearEmpty: boolean;
}

function getGrade(percentage: number): string {
  if (percentage >= 95) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 30) return "D";
  return "F";
}

export function calculateContentScore(
  property: PropertyData,
  assets: PropertyAssets
): ContentScore {
  const items: ScoreItem[] = [];

  // Professional photos — always included
  items.push({
    key: "professional_photos",
    label: "Professional photos",
    points: 10,
    earned: (property.photos && property.photos.length > 0) || assets.hasOrder,
    excluded: false,
    actionLabel: "Order photos",
    actionHref: "/order",
  });

  // Listing video — always included
  items.push({
    key: "listing_video",
    label: "Listing video",
    points: 15,
    earned: assets.hasVideoDelivery,
    excluded: false,
    actionLabel: "Order video",
    actionHref: "/order",
  });

  // Video remix — only if has video
  items.push({
    key: "video_remix",
    label: "Video remix",
    points: 10,
    earned: assets.hasRemix,
    excluded: !assets.hasVideoDelivery,
    actionLabel: "Create remix",
    actionHref: "/dashboard/lens/design-studio",
  });

  // Listing description — always
  items.push({
    key: "listing_description",
    label: "Listing description",
    points: 10,
    earned: assets.hasDescription,
    excluded: false,
    actionLabel: "Write description",
    actionHref: "/dashboard/lens/description-writer",
  });

  // Marketing graphic — always
  items.push({
    key: "marketing_graphic",
    label: "Marketing graphic",
    points: 10,
    earned: assets.hasFlyer,
    excluded: false,
    actionLabel: "Create graphic",
    actionHref: "/dashboard/lens/design-studio",
  });

  // Optimized photos — always
  items.push({
    key: "optimized_photos",
    label: "Optimized photos",
    points: 5,
    earned: assets.hasOptimizedPhotos,
    excluded: false,
    actionLabel: "Optimize photos",
    actionHref: "/dashboard/lens/photo-coach",
  });

  // Shared on social — always
  items.push({
    key: "social_share",
    label: "Shared on social media",
    points: 10,
    earned: assets.hasSocialShare,
    excluded: false,
    actionLabel: "Share now",
    actionHref: "/dashboard/planner",
  });

  // Virtual staging — only if rooms appear empty (heuristic: <15 photos or flagged)
  items.push({
    key: "virtual_staging",
    label: "Virtual staging",
    points: 10,
    earned: assets.hasStaging,
    excluded: !assets.roomsAppearEmpty,
    actionLabel: "Stage rooms",
    actionHref: "/dashboard/lens/virtual-staging",
  });

  // Drone annotation — only if aerial photos exist
  items.push({
    key: "drone_annotation",
    label: "Drone photo annotation",
    points: 5,
    earned: assets.hasDroneAnnotation,
    excluded: !assets.hasAerialPhotos,
    actionLabel: "Annotate drone",
    actionHref: "/dashboard/lens/design-studio",
  });

  // On agent website — only if agent has published website
  items.push({
    key: "on_website",
    label: "Listed on agent website",
    points: 10,
    earned: assets.hasWebsite,
    excluded: !assets.hasAgentWebsite,
    actionLabel: "Add to website",
    actionHref: "/dashboard/website",
  });

  // Blog post — only if agent has blog
  items.push({
    key: "blog_post",
    label: "Blog post about listing",
    points: 5,
    earned: assets.hasBlogPost,
    excluded: !assets.hasAgentWebsite,
    actionLabel: "Write blog post",
    actionHref: "/dashboard/blog",
  });

  // Just Sold graphic — only if status is sold
  items.push({
    key: "just_sold_graphic",
    label: "Just Sold graphic",
    points: 5,
    earned: assets.hasJustSoldGraphic,
    excluded: property.status !== "sold",
    actionLabel: "Create graphic",
    actionHref: "/dashboard/lens/design-studio",
  });

  // Price Reduced graphic — only if status is price_reduced
  items.push({
    key: "price_reduced_graphic",
    label: "Price Reduced graphic",
    points: 5,
    earned: assets.hasPriceReducedGraphic,
    excluded: property.status !== "price_reduced",
    actionLabel: "Create graphic",
    actionHref: "/dashboard/lens/design-studio",
  });

  const activeItems = items.filter((i) => !i.excluded);
  const earned = activeItems.filter((i) => i.earned).reduce((sum, i) => sum + i.points, 0);
  const possible = activeItems.reduce((sum, i) => sum + i.points, 0);
  const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  return {
    propertyId: property.id,
    propertyAddress: property.address,
    earned,
    possible,
    percentage,
    grade: getGrade(percentage),
    items,
  };
}

export function calculateBrandScore(data: {
  hasHeadshot: boolean;
  hasLogo: boolean;
  hasCompany: boolean;
  hasBio: boolean;
  hasPublishedWebsite: boolean;
  daysSincePersonalPost: number | null;
  daysSinceMarketUpdate: number | null;
}): BrandScore {
  const items: ScoreItem[] = [];

  items.push({
    key: "profile_headshot",
    label: "Profile headshot uploaded",
    points: 10,
    earned: data.hasHeadshot,
    excluded: false,
    actionLabel: "Upload headshot",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_logo",
    label: "Logo uploaded",
    points: 10,
    earned: data.hasLogo,
    excluded: false,
    actionLabel: "Upload logo",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_company",
    label: "Company name set",
    points: 5,
    earned: data.hasCompany,
    excluded: false,
    actionLabel: "Add company",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "bio_written",
    label: "Bio written",
    points: 10,
    earned: data.hasBio,
    excluded: false,
    actionLabel: "Write bio",
    actionHref: "/dashboard/planner",
  });

  items.push({
    key: "published_website",
    label: "Agent website published",
    points: 15,
    earned: data.hasPublishedWebsite,
    excluded: false,
    actionLabel: "Build website",
    actionHref: "/dashboard/website",
  });

  items.push({
    key: "recent_personal_post",
    label: "Personal post in last 14 days",
    points: 25,
    earned: data.daysSincePersonalPost !== null && data.daysSincePersonalPost <= 14,
    excluded: false,
    actionLabel: "Write one now",
    actionHref: "/dashboard/planner",
  });

  items.push({
    key: "recent_market_update",
    label: "Market update in last 30 days",
    points: 25,
    earned: data.daysSinceMarketUpdate !== null && data.daysSinceMarketUpdate <= 30,
    excluded: false,
    actionLabel: "Generate one",
    actionHref: "/dashboard/planner",
  });

  const earned = items.filter((i) => i.earned).reduce((sum, i) => sum + i.points, 0);
  const possible = items.reduce((sum, i) => sum + i.points, 0);
  const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  return {
    earned,
    possible,
    percentage,
    grade: getGrade(percentage),
    items,
  };
}
