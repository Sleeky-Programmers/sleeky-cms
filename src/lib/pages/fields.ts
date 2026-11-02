// Field definitions for editable website pages. Client-safe (plain data only):
// the page editor renders forms from these, and the server validates with them.

type Base = {
  key: string;
  label: string;
  hint?: string;
  /** Must not be left empty. */
  required?: boolean;
  /** Can be empty in a draft but is checked before publishing (labelled instead of "optional"). */
  neededToPublish?: boolean;
};

export type TextField = Base & {
  type: "text";
  max: number;
  placeholder?: string;
  /** Extra checks for contact details. */
  format?: "email" | "url" | "tel" | "whatsapp";
};

export type TextAreaField = Base & { type: "textarea"; max: number; rows?: number };

/**
 * A display heading. Each line break is a line on the website; wrap words in
 * *asterisks* to show them in green, e.g. "Software\nthat *grows*\nyour business."
 */
export type HeadingField = Base & { type: "heading"; max: number };

/** A list of short texts (tool names, marquee items, client names). */
export type StringListField = Base & { type: "stringList"; itemLabel: string; itemMax: number; min?: number; max: number };

/** A list of entries, each with its own fields (FAQs, steps, team members). */
export type ListField = Base & {
  type: "list";
  itemLabel: string;
  /** Field shown as each entry's title in the editor. */
  titleKey?: string;
  fields: Field[];
  min?: number;
  max: number;
};

/** A titled set of fields, e.g. one section of a page. */
export type GroupField = Base & { type: "group"; fields: Field[] };

/** An image uploaded to Cloudinary, with its description. */
export type ImageField = Base & { type: "image" };

/** Formatted text (headings, lists, links), edited with the article editor. */
export type RichTextField = Base & { type: "richText" };

export type Option = { value: string; label: string };

/** One choice from a fixed set. The first option is the default. */
export type SelectField = Base & { type: "select"; options: Option[] };

/** Any number of choices from a fixed set (shown as checkboxes). */
export type ChoicesField = Base & { type: "choices"; options: Option[]; max?: number };

export type Field =
  | TextField
  | TextAreaField
  | HeadingField
  | StringListField
  | ListField
  | GroupField
  | ImageField
  | RichTextField
  | SelectField
  | ChoicesField;

export type PageValues = Record<string, unknown>;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Fills in anything missing from saved content using the defaults, so pages
 * keep working when new fields are added later. Saved lists are kept as they are.
 */
export function withDefaults(fields: Field[], saved: unknown, defaults: PageValues): PageValues {
  const source = isRecord(saved) ? saved : {};
  const result: PageValues = {};
  for (const field of fields) {
    const value = source[field.key];
    const fallback = defaults[field.key];
    if (field.type === "group") {
      result[field.key] = withDefaults(field.fields, value, isRecord(fallback) ? fallback : {});
    } else if (field.type === "list") {
      const items = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
      result[field.key] = items.map((item) => withDefaults(field.fields, item, {}));
    } else {
      result[field.key] = value === undefined ? fallback ?? emptyValue(field) : value;
    }
  }
  return result;
}

export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "stringList":
    case "list":
    case "choices":
      return [];
    case "select":
      return field.options[0]?.value ?? "";
    case "group":
      return Object.fromEntries(field.fields.map((child) => [child.key, emptyValue(child)]));
    case "image":
      return null;
    case "richText":
      return { type: "doc", content: [{ type: "paragraph" }] };
    default:
      return "";
  }
}

/** A blank entry for a list, used when an editor adds one. */
export const emptyItem = (field: ListField): PageValues =>
  Object.fromEntries(field.fields.map((child) => [child.key, emptyValue(child)]));
