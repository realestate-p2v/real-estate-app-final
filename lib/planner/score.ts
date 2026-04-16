// lib/planner/score.ts
// Content Score Engine — calculates per-property marketing completeness
// Brand Score — based on profile completion (8 items)

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

  items.push({
    key: "professional_photos",
    label: "Professional photos",
    points: 10,
    earned: (property.photos && property.photos.length > 0) || assets.hasOrder,
    excluded: false,
    actionLabel: "Order photos",
    actionHref: "/order",
  });

  items.push({
    key: "listing_video",
    label: "Listing video",
    points: 15,
    earned: assets.hasVideoDelivery,
    excluded: false,
    actionLabel: "Order video",
    actionHref: "/order",
  });

  items.push({
    key: "video_remix",
    label: "Video remix",
    points: 10,
    earned: assets.hasRemix,
    excluded: !assets.hasVideoDelivery,
    actionLabel: "Create remix",
    actionHref: "/dashboard/lens/design-studio",
  });

  items.push({
    key: "listing_description",
    label: "Listing description",
    points: 10,
    earned: assets.hasDescription,
    excluded: false,
    actionLabel: "Write description",
    actionHref: "/dashboard/lens/description-writer",
  });

  items.push({
    key: "marketing_graphic",
    label: "Marketing graphic",
    points: 10,
    earned: assets.hasFlyer,
    excluded: false,
    actionLabel: "Create graphic",
    actionHref: "/dashboard/lens/design-studio",
  });

  items.push({
    key: "optimized_photos",
    label: "Optimized photos",
    points: 5,
    earned: assets.hasOptimizedPhotos,
    excluded: false,
    actionLabel: "Optimize photos",
    actionHref: "/dashboard/lens/photo-coach",
  });

  items.push({
    key: "social_share",
    label: "Shared on social media",
    points: 10,
    earned: assets.hasSocialShare,
    excluded: false,
    actionLabel: "Share now",
    actionHref: "/dashboard/planner",
  });

  items.push({
    key: "virtual_staging",
    label: "Virtual staging",
    points: 10,
    earned: assets.hasStaging,
    excluded: !assets.roomsAppearEmpty,
    actionLabel: "Stage rooms",
    actionHref: "/dashboard/lens/virtual-staging",
  });

  items.push({
    key: "drone_annotation",
    label: "Drone photo annotation",
    points: 5,
    earned: assets.hasDroneAnnotation,
    excluded: !assets.hasAerialPhotos,
    actionLabel: "Annotate drone",
    actionHref: "/dashboard/lens/design-studio",
  });

  items.push({
    key: "on_website",
    label: "Listed on agent website",
    points: 10,
    earned: assets.hasWebsite,
    excluded: !assets.hasAgentWebsite,
    actionLabel: "Add to website",
    actionHref: "/dashboard/website",
  });

  items.push({
    key: "blog_post",
    label: "Blog post about listing",
    points: 5,
    earned: assets.hasBlogPost,
    excluded: !assets.hasAgentWebsite,
    actionLabel: "Write blog post",
    actionHref: "/dashboard/blog",
  });

  items.push({
    key: "just_sold_graphic",
    label: "Just Sold graphic",
    points: 5,
    earned: assets.hasJustSoldGraphic,
    excluded: property.status !== "sold",
    actionLabel: "Create graphic",
    actionHref: "/dashboard/lens/design-studio",
  });

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

// Brand Score — based on 8 profile fields in lens_usage
// Grading: 0=F, 1=C-, 2=C, 3=C+, 4=B-, 5=B, 6=B+, 7=A, 8=A+ ⭐
export function calculateBrandScore(data: {
  hasName: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasCompany: boolean;
  hasHeadshot: boolean;
  hasLogo: boolean;
  hasWebsite: boolean;
  hasLocation: boolean;
}): BrandScore {
  const items: ScoreItem[] = [];

  items.push({
    key: "profile_name",
    label: "Agent name",
    points: 1,
    earned: data.hasName,
    excluded: false,
    actionLabel: "Add name",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_phone",
    label: "Phone number",
    points: 1,
    earned: data.hasPhone,
    excluded: false,
    actionLabel: "Add phone",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_email",
    label: "Email address",
    points: 1,
    earned: data.hasEmail,
    excluded: false,
    actionLabel: "Add email",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_company",
    label: "Company name",
    points: 1,
    earned: data.hasCompany,
    excluded: false,
    actionLabel: "Add company",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_headshot",
    label: "Profile headshot",
    points: 1,
    earned: data.hasHeadshot,
    excluded: false,
    actionLabel: "Upload headshot",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_logo",
    label: "Company logo",
    points: 1,
    earned: data.hasLogo,
    excluded: false,
    actionLabel: "Upload logo",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_website",
    label: "Website URL",
    points: 1,
    earned: data.hasWebsite,
    excluded: false,
    actionLabel: "Add website",
    actionHref: "/dashboard/settings",
  });

  items.push({
    key: "profile_location",
    label: "Market location",
    points: 1,
    earned: data.hasLocation,
    excluded: false,
    actionLabel: "Add location",
    actionHref: "/dashboard/settings",
  });

  const completedCount = items.filter((i) => i.earned).length;
  const earned = completedCount;
  const possible = 8;
  const percentage = Math.round((earned / possible) * 100);

  const gradeMap: Record<number, string> = {
    0: "F",
    1: "C-",
    2: "C",
    3: "C+",
    4: "B-",
    5: "B",
    6: "B+",
    7: "A",
    8: "A+",
  };

  return {
    earned,
    possible,
    percentage,
    grade: completedCount === 8 ? "A+ ⭐" : gradeMap[completedCount] || "F",
    items,
  };
}
