"use client";

import { useRef, useState } from "react";
import type { StoredImage } from "@/lib/images";
import { ALT_MAX } from "@/lib/insights/limits";
import { ACCEPT_ATTRIBUTE, uploadImage } from "./upload-image";

type ImageUploadFieldProps = {
    /** Unique within the page, used for element ids. */
    id: string;
    label: string;
    value: StoredImage | null;
    onChange: (image: StoredImage | null) => void;
    enabled: boolean;
    altError?: string;
    error?: string;
    optional?: boolean;
};

/** Small Cloudinary thumbnail for the editor (the full image is kept for the website). */
const thumbnail = (url: string) => url.replace("/image/upload/", "/image/upload/c_fill,w_640,h_360,f_auto,q_auto/");

/** Image picker that uploads to Cloudinary, with a description (alt text) field. */
export function ImageUploadField({ id, label, value, onChange, enabled, altError, error, optional = true }: ImageUploadFieldProps) {
    const input = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const choose = async (file: File) => {
        setUploadError("");
        setUploading(true);
        try {
            const image = await uploadImage(file);
            onChange({ ...image, alt: value?.alt ?? "" });
        } catch (failure) {
            setUploadError(failure instanceof Error ? failure.message : "Upload failed.");
        } finally {
            setUploading(false);
            if (input.current) input.current.value = "";
        }
    };

    return (
        <div>
            <p className="text-[15px] font-medium">
                {label} {optional && <span className="font-normal text-muted">(optional)</span>}
            </p>
            {!enabled ? (
                <p className="mt-2 rounded-[14px] border border-dashed border-slate px-4 py-3 text-sm text-muted">
                    Images aren&rsquo;t set up yet. Add the Cloudinary settings to enable uploads.
                </p>
            ) : value ? (
                <div className="mt-2 space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail(value.url)} alt="" className="aspect-video w-full max-w-md rounded-[14px] border border-line object-cover" />
                    <div className="flex gap-2">
                        <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="rounded-full border border-slate px-4 py-2 text-sm font-semibold transition-colors hover:border-green">
                            {uploading ? "Uploading…" : "Replace"}
                        </button>
                        <button type="button" onClick={() => onChange(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10">
                            Remove
                        </button>
                    </div>
                    <div>
                        <label htmlFor={`${id}-alt`} className="block text-sm font-medium">Describe the image</label>
                        <input
                            id={`${id}-alt`}
                            value={value.alt}
                            maxLength={ALT_MAX}
                            onChange={(event) => onChange({ ...value, alt: event.target.value })}
                            placeholder="e.g. Team reviewing a dashboard on a laptop"
                            aria-invalid={altError ? true : undefined}
                            aria-describedby={altError ? `${id}-alt-error` : `${id}-alt-hint`}
                            className="mt-1.5 w-full rounded-xl border border-slate bg-surface px-3 py-2 text-[15px] text-white placeholder:text-faint focus:border-green focus:outline-none aria-[invalid=true]:border-danger"
                        />
                        {altError ? (
                            <p id={`${id}-alt-error`} className="mt-1.5 text-sm font-medium text-danger">{altError}</p>
                        ) : (
                            <p id={`${id}-alt-hint`} className="mt-1.5 text-sm text-muted">Read aloud by screen readers and used by search engines.</p>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => input.current?.click()}
                    disabled={uploading}
                    className="mt-2 flex aspect-video w-full max-w-md items-center justify-center rounded-[14px] border border-dashed border-slate text-sm font-semibold text-soft transition-colors hover:border-green hover:text-white"
                >
                    {uploading ? "Uploading…" : `Upload ${label.toLowerCase()}`}
                </button>
            )}
            {(uploadError || error) && <p role="alert" className="mt-2 text-sm font-medium text-danger">{uploadError || error}</p>}
            <input
                ref={input}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void choose(file);
                }}
            />
        </div>
    );
}

/** The article cover image. */
export function CoverImageField(props: Omit<ImageUploadFieldProps, "id" | "label">) {
    return <ImageUploadField id="cover" label="Cover image" {...props} />;
}
