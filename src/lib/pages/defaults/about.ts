import type { Field, PageValues } from "../fields";
import { HIGHLIGHT_HINT, seoGroup } from "../shared-fields";

// About page, as on the design canvas. The address and contact details in
// "Visit the studio" come from Site settings.
export const aboutFields: Field[] = [
  seoGroup(),
  {
    type: "group",
    key: "hero",
    label: "Hero",
    fields: [
      { type: "text", key: "eyebrow", label: "Small line above the headline", max: 60, required: true },
      { type: "heading", key: "headline", label: "Headline", max: 80, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "intro", label: "Introduction", max: 320, rows: 4, required: true },
      { type: "text", key: "badge", label: "Spinning badge text", max: 60, required: true, hint: "Runs around a circle; end with a separator so it joins up." },
    ],
  },
  {
    type: "group",
    key: "studio",
    label: "Photo band",
    fields: [
      { type: "image", key: "widePhoto", label: "Wide photo (team in the studio)" },
      { type: "image", key: "detailPhoto", label: "Smaller photo (work in progress)" },
      { type: "text", key: "foundedYear", label: "Year tile", max: 10, required: true },
      { type: "text", key: "foundedCaption", label: "Year tile caption", max: 60, required: true },
    ],
  },
  {
    type: "group",
    key: "mission",
    label: "Mission",
    fields: [
      { type: "text", key: "label", label: "Label", max: 30, required: true },
      { type: "textarea", key: "text", label: "Mission", max: 240, rows: 3, required: true },
      { type: "textarea", key: "mutedText", label: "Mission, faded ending", max: 160, rows: 2, hint: "Shown in grey after the mission." },
    ],
  },
  {
    type: "group",
    key: "values",
    label: "Values",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 40, required: true, hint: HIGHLIGHT_HINT },
      {
        type: "list",
        key: "items",
        label: "Values",
        itemLabel: "Value",
        titleKey: "title",
        min: 2,
        max: 8,
        fields: [
          { type: "text", key: "title", label: "Value", max: 30, required: true },
          { type: "textarea", key: "description", label: "Description", max: 160, rows: 2, required: true },
        ],
      },
    ],
  },
  {
    type: "group",
    key: "team",
    label: "Team",
    hint: "The team section appears on the website once every member has a role.",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 40, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "intro", label: "Introduction", max: 200, rows: 2, required: true },
      {
        type: "list",
        key: "members",
        label: "Team members",
        itemLabel: "Member",
        titleKey: "name",
        max: 24,
        fields: [
          { type: "text", key: "name", label: "Name", max: 60, required: true },
          { type: "text", key: "role", label: "Role", max: 60 },
          { type: "image", key: "photo", label: "Photo" },
        ],
      },
    ],
  },
  {
    type: "group",
    key: "visit",
    label: "Visit the studio",
    hint: "Address, phone, email and opening hours come from Site settings.",
    fields: [{ type: "text", key: "label", label: "Label", max: 40, required: true }],
  },
  {
    type: "group",
    key: "closing",
    label: "Closing call to action",
    fields: [{ type: "heading", key: "heading", label: "Big heading", max: 30, required: true }],
  },
];

export const aboutDefaults: PageValues = {
  seo: {
    title: "About Sleeky Programmers — Software Company in Akoka, Lagos",
    description:
      "Sleeky Programmers is a software company in Akoka, Lagos, founded in 2023, designing and building websites, apps and automation for ambitious businesses.",
  },
  hero: {
    eyebrow: "About us · Akoka, Lagos",
    headline: "Built in Lagos.\nBuilt for\n*ambitious* business.",
    intro:
      "Sleeky Programmers is a software company founded in January 2023. We design and build websites, apps and automation with one aim: software that exceeds what its users expect, and pays for itself in the time it saves.",
    badge: "EST. 2023 · AKOKA · LAGOS · NIGERIA ·",
  },
  studio: {
    widePhoto: null,
    detailPhoto: null,
    foundedYear: "2023",
    foundedCaption: "Founded in Akoka, Lagos",
  },
  mission: {
    label: "Our mission",
    text: "To exceed user expectations by building software around how people actually behave —",
    mutedText: "and to set a new standard for software made in Nigeria.",
  },
  values: {
    heading: "What we\n*stand for*",
    items: [
      { title: "Excellence", description: "The highest quality in every part of the development process." },
      { title: "Integrity", description: "Honesty and strong principles in how we do business and build software." },
      { title: "Value", description: "Products that make a real, measurable difference for clients and their users." },
      { title: "Leadership", description: "Leading by example — innovating and setting the pace in our industry." },
    ],
  },
  team: {
    heading: "The *team*",
    intro: "Designers and engineers who care about the details your customers notice.",
    members: [{ name: "Michael Ogbuma", role: "", photo: null }],
  },
  visit: { label: "Visit the studio" },
  closing: { heading: "Work with us." },
};
