export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  originalPriceInCents: number;
  features: string[];
  photoLimit: string;
  deliveryTime: string;
  revisions: number;
  popular?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "test-product",
    name: "Test Product",
    description: "For testing with 1 photo",
    priceInCents: 100,
    originalPriceInCents: 100,
    photoLimit: "1 photo only",
    deliveryTime: "72-hour delivery",
    revisions: 1,
    features: [
      "HD 1080p video output",
      "Single photo video",
      "72-hour delivery",
      "1 revision included",
    ],
  },
  {
    id: "standard-video",
    name: "Standard",
    description: "Perfect for smaller listings",
    priceInCents: 9900,
    originalPriceInCents: 14900,
    photoLimit: "Up to 12 photos",
    deliveryTime: "72-hour delivery",
    revisions: 1,
    features: [
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "72-hour delivery",
      "1 revision included",
    ],
  },
  {
    id: "premium-video",
    name: "Premium",
    description: "Most popular choice for agents",
    priceInCents: 14900,
    originalPriceInCents: 19900,
    photoLimit: "13-25 photos",
    deliveryTime: "72-hour delivery",
    revisions: 2,
    popular: true,
    features: [
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "Custom transitions",
      "72-hour delivery",
      "2 revisions included",
    ],
  },
  {
    id: "professional-video",
    name: "Professional",
    description: "For luxury and large properties",
    priceInCents: 19900,
    originalPriceInCents: 24900,
    photoLimit: "26-35 photos",
    deliveryTime: "48-hour priority",
    revisions: 3,
    features: [
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement (perspective/shadows)",
      "Background music selection",
      "Custom transitions",
      "Intro/outro branding",
      "48-hour priority delivery",
      "3 revisions included",
    ],
  },
  {
    id: "agency-pack",
    name: "Agency Pack",
    description: "5 videos bundle - Save 20%",
    priceInCents: 49900,
    originalPriceInCents: 62500,
    photoLimit: "5 videos (up to 25 photos each)",
    deliveryTime: "72-hour delivery per video",
    revisions: 2,
    features: [
      "5 Premium videos included",
      "HD 1080p video output",
      "Manual Photoshop enhancement",
      "AI video enhancement",
      "Background music selection",
      "Custom transitions",
      "2 revisions per video",
      "Save 20% vs individual orders",
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
