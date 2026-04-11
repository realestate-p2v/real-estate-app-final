import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { public_id, resource_type } = await req.json();

    if (!public_id) {
      return NextResponse.json({ success: false, error: "Missing public_id" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: "Cloudinary not configured" }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const type = resource_type || "image";

    const signatureString = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${type}/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id,
          api_key: apiKey,
          timestamp,
          signature,
        }),
      }
    );

    const result = await res.json();

    return NextResponse.json({
      success: result.result === "ok" || result.result === "not found",
      result: result.result,
    });
  } catch (err: any) {
    console.error("Cloudinary delete error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
