import type { PageValues } from "../pages/fields";
import type { CaseStudyTheme } from "./fields";

// The case studies currently on the website (sleeky-website: src/lib/content/data/work.ts),
// in the order it shows them. "Import from the website" copies these into the CMS once,
// so the website keeps the same projects when it switches to the CMS.

type WebsiteCaseStudy = {
  slug: string;
  client: string;
  tags: string[];
  summary: string;
  metaTitle: string;
  metaDescription: string;
  theme: CaseStudyTheme;
  liveUrl?: string;
  built: { headline: string; body: string };
  features: { title: string; body: string }[];
  services: string[];
};

const websiteCaseStudies: WebsiteCaseStudy[] = [
  {
    slug: "votely",
    client: "Votely",
    tags: ["Web app", "Product design"],
    summary:
      "A performance-voting platform that lets organisations run award and evaluation cycles — by individual or by department — with live progress and results.",
    metaTitle: "Votely — Performance Voting Platform | Sleeky Programmers",
    metaDescription:
      "How Sleeky Programmers designed and built Votely, a performance-voting platform for award and evaluation cycles with live progress and results.",
    theme: "surface",
    liveUrl: "https://app.votely.com.ng",
    built: {
      headline: "Voting cycles anyone can run, and everyone can follow.",
      body: "Members join departments, see their active voting sessions and deadlines on one dashboard, and evaluate colleagues or whole departments. Organisers track progress live and publish results when a cycle closes.",
    },
    features: [
      {
        title: "Vote by individual or department",
        body: "One switch moves an award between people and teams, with progress shown against each cycle's deadline.",
      },
      {
        title: "Members manage their own departments",
        body: "Self-service joining keeps the organisation chart current without an admin updating it by hand.",
      },
    ],
    services: ["web-apps"],
  },
  {
    slug: "straitpay",
    client: "straitPay",
    tags: ["Fintech", "Admin dashboard"],
    summary: "Admin dashboard for payments operations.",
    metaTitle: "straitPay — Payments Admin Dashboard | Sleeky Programmers",
    metaDescription: "How Sleeky Programmers built an admin dashboard for straitPay's payments operations team.",
    theme: "slate",
    built: {
      headline: "One dashboard for payments operations.",
      body: "An admin dashboard that gives straitPay's operations team a clear view of payments activity and the tools to manage it.",
    },
    features: [],
    services: ["web-apps", "api-integrations"],
  },
  {
    slug: "tiqwa-travels",
    client: "Tiqwa Travels",
    tags: ["Travel", "Website"],
    summary: "Website development for a travel brand.",
    metaTitle: "Tiqwa Travels — Travel Website | Sleeky Programmers",
    metaDescription: "How Sleeky Programmers developed the website for Tiqwa Travels, a travel brand.",
    theme: "green",
    built: {
      headline: "A website that presents the brand clearly.",
      body: "A website for Tiqwa Travels that presents its travel services clearly and makes it easy for customers to get in touch.",
    },
    features: [],
    services: ["websites"],
  },
];

/** The website's case studies as CMS content, ready to import. */
export const websiteCaseStudyImports: { slug: string; content: PageValues }[] = websiteCaseStudies.map((study) => ({
  slug: study.slug,
  content: {
    overview: {
      client: study.client,
      summary: study.summary,
      tags: [...study.tags],
      sector: "",
      liveUrl: study.liveUrl ?? "",
      theme: study.theme,
    },
    images: { hero: null, secondary: null },
    challenge: { headline: "", body: "" },
    built: { ...study.built },
    features: study.features.map((feature) => ({ ...feature, image: null })),
    results: [],
    quote: { text: "", author: "", role: "" },
    services: [...study.services],
    seo: { title: study.metaTitle, description: study.metaDescription },
  },
}));
