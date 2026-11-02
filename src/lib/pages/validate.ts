import { z } from "zod";
import { isOwnImageUrl, storedImageSchema } from "../images";
import { docText } from "../insights/rich-text";
import { sanitizeDoc } from "../insights/sanitize";
import type { Field, PageValues } from "./fields";

const MAX_HEADING_LINES = 4;

const FORMATS = {
  email: { test: (value: string) => z.email().safeParse(value).success, message: "Enter a valid email address." },
  url: {
    test: (value: string) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    message: "Enter a full web address starting with https://",
  },
  tel: { test: (value: string) => /^\+[1-9]\d{6,14}$/.test(value), message: "Use the international format, e.g. +2349160952000." },
  whatsapp: { test: (value: string) => /^[1-9]\d{6,14}$/.test(value), message: "Digits only, with the country code, e.g. 2349160952000." },
};

const tooLong = (max: number) => `Use at most ${max} characters.`;

function textSchema(field: Extract<Field, { type: "text" | "textarea" | "heading" }>) {
  let schema = z.string().trim().max(field.max, tooLong(field.max));
  if (field.type === "heading") {
    schema = schema.refine((value) => value.split("\n").length <= MAX_HEADING_LINES, `Use at most ${MAX_HEADING_LINES} lines.`);
  }
  if (field.type === "text" && field.format) {
    const format = FORMATS[field.format];
    schema = schema.refine((value) => value === "" || format.test(value), format.message);
  }
  return field.required ? schema.refine((value) => value.length > 0, "This can't be empty.") : schema;
}

function schemaFor(field: Field): z.ZodType {
  switch (field.type) {
    case "text":
    case "textarea":
    case "heading":
      return textSchema(field);
    case "stringList": {
      const items = z.array(z.string().trim().min(1, "Fill in or remove this item.").max(field.itemMax, tooLong(field.itemMax)));
      const min = field.min ?? 0;
      return items
        .min(min, min === field.max ? `Needs exactly ${min} items.` : `Add at least ${min}.`)
        .max(field.max, min === field.max ? `Needs exactly ${min} items.` : `At most ${field.max}.`);
    }
    case "list": {
      const min = field.min ?? 0;
      return z
        .array(objectSchema(field.fields))
        .min(min, min === field.max ? `Needs exactly ${min}.` : `Add at least ${min}.`)
        .max(field.max, min === field.max ? `Needs exactly ${min}.` : `At most ${field.max}.`);
    }
    case "group":
      return objectSchema(field.fields);
    case "image":
      return storedImageSchema.nullable();
    case "richText":
      return z.unknown().transform((value, context) => {
        const doc = sanitizeDoc(value, { isAllowedImage: isOwnImageUrl });
        if (field.required && !docText(doc).trim()) {
          context.addIssue({ code: "custom", message: "This can't be empty." });
          return z.NEVER;
        }
        return doc;
      });
  }
}

function objectSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((field) => [field.key, schemaFor(field)])));
}

export type PageValidation = { ok: true; values: PageValues } | { ok: false; errors: Record<string, string> };

/**
 * Validates submitted page content against its field definitions. Unknown keys
 * are dropped, text is trimmed and rich text is cleaned. Errors are keyed by
 * field path, e.g. "faqs.items.2.answer".
 */
export function validatePage(fields: Field[], input: unknown): PageValidation {
  const parsed = objectSchema(fields).safeParse(input);
  if (parsed.success) return { ok: true, values: parsed.data as PageValues };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".") || "form";
    errors[path] ??= issue.message;
  }
  return { ok: false, errors };
}
