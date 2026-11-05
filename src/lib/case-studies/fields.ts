import type { Field } from "../pages/fields";
import { websiteServices } from "../pages/defaults/website-services";

// The case study template on the website (/work/<slug>), section by section.

export const THEMES = [
  { value: "surface", label: "Dark" },
  { value: "slate", label: "Slate" },
  { value: "green", label: "Green" },
] as const;

export type CaseStudyTheme = (typeof THEMES)[number]["value"];

const HIDE_HINT = "Leave empty to hide this section.";

export const caseStudyFields: Field[] = [
  {
    type: "group",
    key: "overview",
    label: "Overview",
    hint: "The top of the case study, and its card on the homepage and Work page.",
    fields: [
      { type: "text", key: "client", label: "Client name", max: 40, required: true, hint: "Shown as the case study's big heading." },
      { type: "textarea", key: "summary", label: "Summary", max: 300, rows: 3, neededToPublish: true, hint: "One or two sentences under the client's name." },
      {
        type: "stringList",
        key: "tags",
        label: "Services",
        itemLabel: "Tag",
        itemMax: 24,
        max: 4,
        neededToPublish: true,
        hint: "Short labels such as Web app or Product design. At least one is needed to publish.",
      },
      { type: "text", key: "sector", label: "Sector", max: 40, placeholder: "e.g. Fintech" },
      { type: "text", key: "liveUrl", label: "Live website", max: 200, format: "url", placeholder: "https://" },
      {
        type: "select",
        key: "theme",
        label: "Card colour",
        options: THEMES.map((theme) => ({ ...theme })),
        hint: "Colour of the project's card on the homepage and Work page.",
      },
    ],
  },
  {
    type: "group",
    key: "images",
    label: "Screenshots",
    hint: "Until a screenshot is added, the website shows a placeholder in its place.",
    fields: [
      { type: "image", key: "hero", label: "Main screenshot" },
      { type: "image", key: "secondary", label: "Second screenshot (homepage card)" },
    ],
  },
  {
    type: "group",
    key: "challenge",
    label: "The challenge",
    hint: HIDE_HINT,
    fields: [
      { type: "text", key: "headline", label: "Headline", max: 100 },
      { type: "textarea", key: "body", label: "Text", max: 600, rows: 4 },
    ],
  },
  {
    type: "group",
    key: "built",
    label: "What we built",
    fields: [
      { type: "text", key: "headline", label: "Headline", max: 100, neededToPublish: true },
      { type: "textarea", key: "body", label: "Text", max: 600, rows: 4, neededToPublish: true },
    ],
  },
  {
    type: "list",
    key: "features",
    label: "Features",
    hint: "Highlights of the project, each with a screenshot. Leave empty to hide this section.",
    itemLabel: "Feature",
    titleKey: "title",
    max: 6,
    fields: [
      { type: "text", key: "title", label: "Title", max: 60, required: true },
      { type: "textarea", key: "body", label: "Text", max: 300, rows: 3, required: true },
      { type: "image", key: "image", label: "Screenshot" },
    ],
  },
  {
    type: "list",
    key: "results",
    label: "Results",
    hint: "Numbers that show the impact, e.g. “3×” and “faster month-end close”. Leave empty to hide.",
    itemLabel: "Result",
    titleKey: "value",
    max: 4,
    fields: [
      { type: "text", key: "value", label: "Number", max: 12, required: true, placeholder: "e.g. 40%" },
      { type: "text", key: "label", label: "What it measures", max: 60, required: true },
    ],
  },
  {
    type: "group",
    key: "quote",
    label: "Client quote",
    hint: HIDE_HINT,
    fields: [
      { type: "textarea", key: "text", label: "Quote", max: 400, rows: 3 },
      { type: "text", key: "author", label: "Name", max: 60 },
      { type: "text", key: "role", label: "Role", max: 60, placeholder: "e.g. CEO, Votely" },
    ],
  },
  {
    type: "choices",
    key: "services",
    label: "Related services",
    hint: "The service pages this project relates to.",
    options: websiteServices.map((service) => ({ value: service.slug, label: service.name })),
  },
  {
    type: "group",
    key: "seo",
    label: "Search results",
    hint: "How the case study appears on Google and when shared. Leave empty to use the client name and summary.",
    fields: [
      { type: "text", key: "title", label: "Page title", max: 60, hint: "At most 60 characters." },
      { type: "textarea", key: "description", label: "Description", max: 155, rows: 3, hint: "At most 155 characters." },
    ],
  },
];

export const SUMMARY_MIN = 20;
