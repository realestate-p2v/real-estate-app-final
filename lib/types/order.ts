export interface OrderPhoto {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  order: number;
}

export interface OrderCustomAudio {
  public_id: string;
  secure_url: string;
  filename: string;
}

export interface OrderBranding {
  type: "unbranded" | "basic" | "custom";
  logoUrl?: string;
  agentName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface Order {
  id?: string;
  orderId: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  
  // Customer info
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Photos
  photos: OrderPhoto[];
  photoCount: number;
  
  // Options
  musicSelection: string;
  customAudio?: OrderCustomAudio;
  branding: OrderBranding;
  voiceover: boolean;
  voiceoverScript?: string;
  voiceoverVoice?: string;
  specialInstructions?: string;
  includeEditedPhotos: boolean;
  
  // Pricing
  basePrice: number;
  brandingFee: number;
  voiceoverFee: number;
  editedPhotosFee: number;
  totalPrice: number;
  
  // Payment
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  
  // Delivery
  deliveryDate?: Date;
  videoUrl?: string;
}

export interface CreateOrderInput {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  photos: Array<{
    base64: string;
    order: number;
  }>;
  musicSelection: string;
  customAudioBase64?: string;
  customAudioFilename?: string;
  branding: OrderBranding;
  voiceover: boolean;
  voiceoverScript?: string;
  specialInstructions?: string;
}
