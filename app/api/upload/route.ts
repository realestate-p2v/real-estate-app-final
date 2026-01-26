import { NextResponse } from "next/server";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(request: Request) {
  try {
    const { image, folder } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { success: false, error: "Cloudinary not configured" },
        { status: 500 }
      );
    }

    // Generate signature for upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `photo2video/${folder || "orders"}`;
    
    // Create signature string
    const signatureString = `folder=${folderPath}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await generateSHA1(signatureString);

    // Upload using Cloudinary REST API
    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folderPath);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[v0] Cloudinary upload failed:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to upload to Cloudinary" },
        { status: 500 }
      );
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    console.error("[v0] Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Generate SHA1 hash for Cloudinary signature
async function generateSHA1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
