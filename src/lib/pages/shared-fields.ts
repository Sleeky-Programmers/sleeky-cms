import type { Field } from "./fields";

// Fields reused across several pages.

export const HIGHLIGHT_HINT = "New lines start new lines on the website. Wrap words in *asterisks* to show them in green.";

export const seoGroup = (defaults?: { titleHint?: string }): Field => ({
  type: "group",
  key: "seo",
  label: "Search results",
  hint: "How the page appears on Google and when shared.",
  fields: [
    { type: "text", key: "title", label: "Page title", max: 60, required: true, hint: defaults?.titleHint ?? "At most 60 characters." },
    { type: "textarea", key: "description", label: "Description", max: 155, rows: 3, required: true, hint: "At most 155 characters." },
  ],
});

export const stepsList = (key: string, label: string, count: { min: number; max: number }): Field => ({
  type: "list",
  key,
  label,
  itemLabel: "Step",
  titleKey: "title",
  min: count.min,
  max: count.max,
  fields: [
    { type: "text", key: "title", label: "Title", max: 40, required: true },
    { type: "textarea", key: "description", label: "Description", max: 160, rows: 2, required: true },
  ],
});
