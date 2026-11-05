import type { Field, PageValues } from "./fields";
import { aboutDefaults, aboutFields } from "./defaults/about";
import { homeDefaults, homeFields } from "./defaults/home";
import { privacyDefaults, privacyFields } from "./defaults/privacy";
import { serviceDefaults, serviceFields } from "./defaults/services";
import { siteDefaults, siteFields } from "./defaults/site";

export type PageGroup = "Website pages" | "Service pages" | "Site-wide";

export type PageDefinition = {
  /** Stable identifier, also used in the public API: /api/public/pages/<key> */
  key: string;
  title: string;
  group: PageGroup;
  description: string;
  /** Where the page lives on the website, for "View on website". */
  websitePath?: string;
  fields: Field[];
  defaults: PageValues;
};

// Every editable page. Each page's fields mirror the website design, and its
// defaults are the website's current text.
export const PAGES: PageDefinition[] = [
  {
    key: "home",
    title: "Homepage",
    group: "Website pages",
    description: "Hero, statement, featured work and services intros, automation showcase, process and closing call to action.",
    websitePath: "/",
    fields: homeFields,
    defaults: homeDefaults,
  },
  {
    key: "about",
    title: "About",
    group: "Website pages",
    description: "Company story, photos, mission, values, team and closing call to action.",
    websitePath: "/about",
    fields: aboutFields,
    defaults: aboutDefaults,
  },
  {
    key: "privacy-policy",
    title: "Privacy policy",
    group: "Website pages",
    description: "The privacy policy text.",
    websitePath: "/privacy-policy",
    fields: privacyFields,
    defaults: privacyDefaults,
  },
  ...serviceDefaults.map(
    ({ slug, name, defaults }): PageDefinition => ({
      key: `service-${slug}`,
      title: name,
      group: "Service pages",
      description: "Hero, problems, tools, process, related work, FAQs and closing call to action.",
      websitePath: `/services/${slug}`,
      fields: serviceFields,
      defaults,
    }),
  ),
  {
    key: "site",
    title: "Site settings",
    group: "Site-wide",
    description: "Phone, WhatsApp, email, address, opening hours, social links and footer text, used across the whole website.",
    fields: siteFields,
    defaults: siteDefaults,
  },
];

export const PAGE_GROUPS: PageGroup[] = ["Website pages", "Service pages", "Site-wide"];

export const getPageDefinition = (key: string) => PAGES.find((page) => page.key === key) ?? null;
