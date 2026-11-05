import type { Field, PageValues } from "../fields";
import { HIGHLIGHT_HINT, seoGroup, stepsList } from "../shared-fields";

// Homepage, section by section as on the design canvas.
export const homeFields: Field[] = [
  seoGroup(),
  {
    type: "group",
    key: "hero",
    label: "Hero",
    fields: [
      { type: "text", key: "eyebrow", label: "Small line above the headline", max: 80, required: true },
      { type: "heading", key: "headline", label: "Headline", max: 80, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "intro", label: "Introduction", max: 240, rows: 3, required: true },
      { type: "text", key: "ctaLabel", label: "Main button", max: 40, required: true },
    ],
  },
  {
    type: "stringList",
    key: "marquee",
    label: "Scrolling services strip",
    itemLabel: "Item",
    itemMax: 30,
    min: 3,
    max: 10,
  },
  {
    type: "group",
    key: "statement",
    label: "Statement",
    fields: [
      { type: "textarea", key: "text", label: "Statement", max: 220, rows: 2, required: true },
      { type: "textarea", key: "mutedText", label: "Statement, faded ending", max: 160, rows: 2, hint: "Shown in grey after the statement." },
      { type: "text", key: "clientsLabel", label: "Clients label", max: 30, required: true },
      { type: "stringList", key: "clients", label: "Client names", itemLabel: "Client", itemMax: 40, max: 12 },
    ],
  },
  {
    type: "group",
    key: "work",
    label: "Featured work",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 40, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "description", label: "Description", max: 200, rows: 2, required: true },
    ],
  },
  {
    type: "group",
    key: "services",
    label: "What we build",
    hint: "Each service's name and one-line summary are edited on its own service page.",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 40, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "description", label: "Description", max: 200, rows: 2, required: true },
    ],
  },
  {
    type: "group",
    key: "automation",
    label: "Automation showcase",
    fields: [
      { type: "text", key: "eyebrow", label: "Small line above the heading", max: 40, required: true },
      { type: "heading", key: "heading", label: "Heading", max: 80, required: true, hint: HIGHLIGHT_HINT },
      { type: "textarea", key: "body", label: "Text", max: 320, rows: 4, required: true },
      { type: "text", key: "buttonLabel", label: "Button", max: 40, required: true },
      {
        type: "list",
        key: "steps",
        label: "Automation steps",
        itemLabel: "Step",
        titleKey: "title",
        min: 4,
        max: 4,
        fields: [
          { type: "text", key: "title", label: "Title", max: 50, required: true },
          { type: "text", key: "detail", label: "Detail", max: 80, required: true },
          { type: "text", key: "time", label: "Time", max: 6, required: true, placeholder: "2s" },
        ],
      },
    ],
  },
  {
    type: "group",
    key: "process",
    label: "How we work",
    hint: "Also shown on the About page.",
    fields: [
      { type: "heading", key: "heading", label: "Heading", max: 40, required: true, hint: HIGHLIGHT_HINT },
      stepsList("steps", "Steps", { min: 4, max: 4 }),
    ],
  },
  {
    type: "group",
    key: "closing",
    label: "Closing call to action",
    fields: [
      { type: "text", key: "eyebrow", label: "Small line above", max: 60, required: true },
      { type: "heading", key: "heading", label: "Big heading", max: 30, required: true },
    ],
  },
];

export const homeDefaults: PageValues = {
  seo: {
    title: "Sleeky Programmers | Websites, Apps & Automation in Lagos",
    description:
      "Sleeky Programmers builds premium websites, web and mobile apps, and business automation for ambitious businesses in Lagos, Nigeria and beyond.",
  },
  hero: {
    eyebrow: "Websites · Apps · Automation — Lagos, Nigeria",
    headline: "Software\nthat *grows*\nyour business.",
    intro: "Clean, reliable websites, apps and automation for businesses in Nigeria and beyond — built to look exceptional and run themselves.",
    ctaLabel: "Start a project",
  },
  marquee: ["Websites", "Web apps", "Mobile apps", "Business automation", "API integrations", "Branding"],
  statement: {
    text: "We design and engineer digital products for ambitious businesses —",
    mutedText: "then automate the busywork that slows them down.",
    clientsLabel: "Trusted by",
    clients: ["Votely", "Tiqwa Travels", "straitPay", "OneFarm", "Nexterra", "Tyda"],
  },
  work: {
    heading: "Featured\n*work*",
    description: "Products we've shipped for teams across Nigeria — from voting platforms to fintech dashboards.",
  },
  services: {
    heading: "What we\n*build*",
    description: "Hover a service. Each one opens its own page — built to rank on Google for what clients search.",
  },
  automation: {
    eyebrow: "Automation, live",
    heading: "This website runs on what we sell.",
    body: "Start a project and watch our own automation take over: your brief lands in our CRM, then opens in WhatsApp ready for you to send, or alerts our team on WhatsApp straight away, and you get a confirmation — in seconds, with nobody copying and pasting.",
    buttonLabel: "Try it — start a project",
    steps: [
      { title: "Project brief submitted", detail: "Number checked, any file stored securely", time: "0s" },
      { title: "Contact and deal created in Zoho CRM", detail: "Brief and file saved to the lead", time: "1s" },
      { title: "WhatsApp chat or team alert", detail: "Your brief typed out for you, or our team pinged instantly", time: "2s" },
      { title: "Branded confirmation sent", detail: "By email: “We’ll be in touch within 24 hours”", time: "3s" },
    ],
  },
  process: {
    heading: "How we\n*work*",
    steps: [
      { title: "Discover", description: "We map your goals, users and the manual work worth removing." },
      { title: "Design", description: "Clickable designs you approve before any code is written." },
      { title: "Build", description: "Weekly demos, clear milestones, a shared progress board." },
      { title: "Launch & grow", description: "Go-live, training, monthly analytics and ongoing support." },
    ],
  },
  closing: {
    eyebrow: "Have a project in mind?",
    heading: "Let’s talk.",
  },
};
