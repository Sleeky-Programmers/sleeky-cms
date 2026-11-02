import { describe, expect, it } from "vitest";
import { withDefaults } from "../pages/fields";
import { validatePage } from "../pages/validate";
import { caseStudyFields } from "./fields";
import { publishErrors } from "./store";
import { websiteCaseStudyImports } from "./website-case-studies";

const votely = websiteCaseStudyImports.find((study) => study.slug === "votely")!;
const image = (alt: string) => ({ publicId: "x", url: "https://res.cloudinary.com/demo/image/upload/x.png", width: 10, height: 10, alt });

describe("website case studies", () => {
  // They're imported as published, so they must pass the same checks as anything published in the CMS.
  it.each(websiteCaseStudyImports.map((study) => [study.slug, study]))("%s passes validation and the publishing checks", (_slug, study) => {
    const result = validatePage(caseStudyFields, study.content);
    expect(result.ok ? {} : result.errors).toEqual({});
    expect(publishErrors(study.slug, study.content)).toEqual({});
  });

  it("matches the website's order and addresses", () => {
    expect(websiteCaseStudyImports.map((study) => study.slug)).toEqual(["votely", "straitpay", "tiqwa-travels"]);
  });
});

describe("publishErrors", () => {
  const blank = withDefaults(caseStudyFields, { overview: { client: "Acme" } }, {});

  it("lists what a case study needs before it goes live", () => {
    expect(publishErrors("Bad Slug", blank)).toEqual({
      slug: expect.any(String),
      "overview.summary": expect.any(String),
      "overview.tags": expect.any(String),
      "built.headline": expect.any(String),
      "built.body": expect.any(String),
    });
  });

  it("asks for complete optional sections and image descriptions", () => {
    const content = {
      ...votely.content,
      challenge: { headline: "Half a section", body: "" },
      quote: { text: "", author: "Ada", role: "CEO" },
      images: { hero: image(""), secondary: image("Dashboard") },
      features: [{ title: "One", body: "Two", image: image("") }],
    };
    expect(publishErrors("votely", content)).toEqual({
      "challenge.body": expect.any(String),
      "quote.text": expect.any(String),
      "images.hero.alt": expect.any(String),
      "features.0.image.alt": expect.any(String),
    });
  });
});

describe("choice fields", () => {
  it("accepts known options and keeps them in option order", () => {
    const result = validatePage(caseStudyFields, { ...votely.content, services: ["web-apps", "websites"] });
    expect(result.ok && result.values.services).toEqual(["websites", "web-apps"]);
  });

  it("rejects unknown options", () => {
    const content = { ...votely.content, overview: { ...(votely.content.overview as object), theme: "purple" }, services: ["nope"] };
    const result = validatePage(caseStudyFields, content);
    expect(result.ok ? {} : result.errors).toEqual({ "overview.theme": "Choose one of the options.", "services.0": "Choose from the options." });
  });
});
