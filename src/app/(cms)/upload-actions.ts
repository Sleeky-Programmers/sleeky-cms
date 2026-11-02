"use server";

import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig, IMAGE_FORMATS, imageFolder, isImageArea } from "@/lib/images";
import { requireUser } from "@/lib/session";

export type UploadTicket =
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; allowedFormats: string }
  | { ok: false; message: string };

/**
 * Signs a direct browser-to-Cloudinary upload. Only signed-in users get a
 * signature, and it pins the folder (per kind of content) and allowed formats.
 */
export async function getUploadTicket(area: unknown): Promise<UploadTicket> {
  await requireUser();
  if (!isImageArea(area)) return { ok: false, message: "Unknown upload type." };
  const config = cloudinaryConfig();
  if (!config) return { ok: false, message: "Images aren't set up yet. Add the Cloudinary settings to the CMS." };

  const timestamp = Math.round(Date.now() / 1000);
  const folder = imageFolder(area);
  const allowedFormats = IMAGE_FORMATS.join(",");
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, allowed_formats: allowedFormats }, config.apiSecret);
  return { ok: true, cloudName: config.cloudName, apiKey: config.apiKey, timestamp, signature, folder, allowedFormats };
}
