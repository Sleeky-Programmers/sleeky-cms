import { env } from "./env";

/** An image stored in Cloudinary, as saved on an article. */
export type StoredImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
};

export const IMAGE_FOLDER = "sleeky-cms/insights";
export const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env();
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
}

/** True for delivery URLs from this account's Cloudinary folder; anything else is rejected on save. */
export function isOwnImageUrl(url: string): boolean {
  const config = cloudinaryConfig();
  if (!config) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.startsWith(`/${config.cloudName}/image/upload/`)
    );
  } catch {
    return false;
  }
}
