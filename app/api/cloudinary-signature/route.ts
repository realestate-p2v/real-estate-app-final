import { NextResponse } from "next/server";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const API_KEY = process.env.CLOUDINARY_API_KEY;

// Generate SHA1 hash for Cloudinary signature
async function generateSHA1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    if (!CLOUD_NAME || !API_SECRET || !API_KEY) {
      return NextResponse.json(
        { success: false, error: "Cloudinary not configured" },
        { status: 500 }
      );
    }

    const { folder } = await request.json();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = folder || "photo2video/orders";

    // Create signature string (params must be in alphabetical order)
    const signatureString = `folder=${folderPath}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSHA1(signatureString);

    return NextResponse.json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        folder: folderPath,
      },
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
