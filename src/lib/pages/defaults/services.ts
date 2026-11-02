import type { Field, PageValues } from "../fields";
import { HIGHLIGHT_HINT, stepsList } from "../shared-fields";
import { websiteServices, type WebsiteService } from "./website-services";

// Service page template (design canvas: /services/business-automation).
// The same fields for all six services; each starts with its website copy.
export const serviceFields: Field[] = [
  {
    type: "group",
    key: "seo",
    label: "Search results",
    hint: "How the page appears on Google and when shared.",
    fields: [
      { type: "text", key: "title", label: "Page title", max: 60, required: true, hint: "At most 60 characters." },
      { type: "textarea", key: "description", label: "Description", max: 155, rows: 3, required: true, hint: "At most 155 characters." },
    ],
  },
  {
    type: "group",
    key: "listing",
    label: "Name and summary",
    hint: "Used in the services list on the homepage and in \"Other services\".",
    fields: [
      { type: "text", key: "name", label: "Service name", max: 40, required: true },
      { type: "textarea", key: "summary", label: "One-line summary", max: 160, rows: 2, required: true },
    ],
  },
  {
    type: "group",
    key: "hero",
    label: "Hero",
    fields: [
      { type: "heading", key: "headline", label: "Headline", max: 80, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "intro", label: "Introduction", max: 320, rows: 4, required: true },
      { type: "text", key: "ctaLabel", label: "Main button", max: 40, required: true },
      { type: "textarea", key: "whatsappMessage", label: "WhatsApp message", max: 200, rows: 2, required: true, hint: "Pre-filled when someone taps \"Ask on WhatsApp\"." },
    ],
  },
  {
    type: "group",
    key: "flow",
    label: "Flow diagram",
    fields: [
      { type: "text", key: "title", label: "Title", max: 40, required: true },
      { type: "stringList", key: "steps", label: "Steps", itemLabel: "Step", itemMax: 16, min: 5, max: 5, hint: "Exactly five short steps (about 14 characters each) so they fit the boxes." },
      { type: "text", key: "note", label: "Note", max: 24, required: true },
    ],
  },
  {
    type: "group",
    key: "problems",
    label: "Sound familiar?",
    fields: [
      { type: "textarea", key: "intro", label: "Introduction", max: 160, rows: 2, required: true },
      {
        type: "list",
        key: "items",
        label: "Problems",
        itemLabel: "Problem",
        titleKey: "title",
        min: 3,
        max: 9,
        fields: [
          { type: "text", key: "title", label: "Problem", max: 50, required: true },
          { type: "textarea", key: "description", label: "Description", max: 200, rows: 2, required: true },
        ],
      },
    ],
  },
  {
    type: "group",
    key: "tools",
    label: "Tools",
    fields: [
      { type: "text", key: "heading", label: "Heading", max: 80, required: true },
      { type: "textarea", key: "body", label: "Text", max: 240, rows: 3, required: true },
      { type: "stringList", key: "items", label: "Tools", itemLabel: "Tool", itemMax: 30, min: 1, max: 16 },
      { type: "text", key: "extra", label: "Last item (dashed)", max: 40, required: true },
    ],
  },
  {
    type: "group",
    key: "process",
    label: "How the project runs",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 60, required: true, hint: HIGHLIGHT_HINT },
      stepsList("steps", "Steps", { min: 4, max: 4 }),
    ],
  },
  {
    type: "group",
    key: "related",
    label: "Related work",
    hint: "Leave the case study empty to hide this section.",
    fields: [
      { type: "text", key: "caseStudy", label: "Case study", max: 80, hint: "The case study's address, e.g. votely or tiqwa-travels." },
      { type: "textarea", key: "blurb", label: "Short description", max: 200, rows: 2 },
    ],
  },
  {
    type: "group",
    key: "faqs",
    label: "FAQs",
    fields: [
      { type: "text", key: "heading", label: "Heading", max: 60, required: true },
      {
        type: "list",
        key: "items",
        label: "Questions",
        itemLabel: "Question",
        titleKey: "question",
        min: 1,
        max: 12,
        fields: [
          { type: "text", key: "question", label: "Question", max: 120, required: true },
          { type: "textarea", key: "answer", label: "Answer", max: 600, rows: 4, required: true },
        ],
      },
    ],
  },
  {
    type: "group",
    key: "closing",
    label: "Closing call to action",
    fields: [{ type: "heading", key: "heading", label: "Big heading", max: 40, required: true, hint: "New lines start new lines on the website." }],
  },
];

function toPageValues(service: WebsiteService): PageValues {
  return {
    seo: { title: service.metaTitle, description: service.metaDescription },
    listing: { name: service.name, summary: service.summary },
    hero: {
      headline: `${service.headline.lines.join("\n")} *${service.headline.accent}*`,
      intro: service.intro,
      ctaLabel: service.ctaLabel,
      whatsappMessage: service.whatsappMessage,
    },
    flow: { title: service.flow.title, steps: [...service.flow.steps], note: service.flow.note },
    problems: { intro: service.problems.intro, items: service.problems.items.map((item) => ({ ...item })) },
    tools: { heading: service.tools.heading, body: service.tools.body, items: [...service.tools.items], extra: service.tools.extra },
    process: {
      heading: `${service.process.lead}\n*${service.process.accent}*`,
      steps: service.process.steps.map((step) => ({ ...step })),
    },
    related: { caseStudy: service.relatedWork?.slug ?? "", blurb: service.relatedWork?.blurb ?? "" },
    faqs: { heading: service.faqHeading, items: service.faqs.map((faq) => ({ ...faq })) },
    closing: { heading: service.ctaHeading.join("\n") },
  };
}

export const serviceDefaults = websiteServices.map((service) => ({
  slug: service.slug,
  name: service.name,
  defaults: toPageValues(service),
}));
