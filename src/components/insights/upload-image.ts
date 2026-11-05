"use client";

import { createContext } from "react";
import { getUploadTicket } from "@/app/(cms)/upload-actions";
import type { ImageArea } from "@/lib/images";
import { isOutdatedPage } from "@/lib/outdated-page";

export type UploadedImage = { publicId: string; url: string; width: number; height: number };

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPT_ATTRIBUTE = ACCEPTED.join(",");

/** Which Cloudinary folder uploads go to. Each editor sets it; Insights is the default. */
export const ImageAreaContext = createContext<ImageArea>("insights");

/** Uploads straight from the browser to Cloudinary using a short-lived signature from the CMS. */
export async function uploadImage(file: File, area: ImageArea): Promise<UploadedImage> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Use a JPG, PNG, WebP, GIF or AVIF image.");
  if (file.size > MAX_BYTES) throw new Error("That image is over 10 MB. Use a smaller version.");

  let ticket: Awaited<ReturnType<typeof getUploadTicket>>;
  try {
    ticket = await getUploadTicket(area);
  } catch (error) {
    throw new Error(isOutdatedPage(error) ? "The CMS was updated while this page was open. Save your work, then reload the page to upload images." : "Couldn't start the upload. Try again.");
  }
  if (!ticket.ok) throw new Error(ticket.message);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", ticket.apiKey);
  body.append("timestamp", String(ticket.timestamp));
  body.append("signature", ticket.signature);
  body.append("folder", ticket.folder);
  body.append("allowed_formats", ticket.allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${ticket.cloudName}/image/upload`, { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message ? `Upload failed: ${data.error.message}` : "Upload failed. Try again.");

  return { publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height };
}
