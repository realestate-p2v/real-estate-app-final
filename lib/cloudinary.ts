import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadImage(
  base64Data: string,
  folder: string = "orders"
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: `photo2video/${folder}`,
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function uploadMultipleImages(
  images: string[],
  folder: string = "orders"
): Promise<CloudinaryUploadResult[]> {
  const uploadPromises = images.map((image) => uploadImage(image, folder));
  return Promise.all(uploadPromises);
}

export function getOptimizedUrl(publicId: string, width?: number): string {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" },
      ...(width ? [{ width, crop: "scale" }] : []),
    ],
  });
}
