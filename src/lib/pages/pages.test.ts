import { describe, expect, it } from "vitest";
import { withCaseStudyOptions, withDefaults, type Field } from "./fields";
import { PAGES, getPageDefinition } from "./registry";
import { validatePage } from "./validate";

describe("page definitions", () => {
  it("has unique keys, including the six service pages and site settings", () => {
    const keys = PAGES.map((page) => page.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((key) => key.startsWith("service-"))).toHaveLength(6);
    expect(keys).toEqual(expect.arrayContaining(["home", "about", "privacy-policy", "site"]));
  });

  // If the website's original text broke a limit, editors couldn't save the
  // page without first fixing text they never touched.
  it.each(PAGES.map((page) => [page.key, page]))("%s: the original text passes its own rules", (_key, page) => {
    const result = validatePage(page.fields, withDefaults(page.fields, undefined, page.defaults));
    expect(result.ok ? {} : result.errors).toEqual({});
  });

  it("turns service headlines into highlighted headings", () => {
    const automation = getPageDefinition("service-business-automation")!;
    expect((automation.defaults.hero as { headline: string }).headline).toBe("Give your team\nits hours *back.*");
    expect((automation.defaults.process as { heading: string }).heading).toBe("How an automation\n*project runs*");
  });
});

const fields: Field[] = [
  { type: "text", key: "title", label: "Title", max: 10, required: true },
  { type: "text", key: "email", label: "Email", max: 50, format: "email" },
  { type: "text", key: "phone", label: "Phone", max: 20, format: "tel" },
  { type: "heading", key: "heading", label: "Heading", max: 100 },
  { type: "stringList", key: "steps", label: "Steps", itemLabel: "Step", itemMax: 5, min: 2, max: 2 },
  {
    type: "group",
    key: "faqs",
    label: "FAQs",
    fields: [
      {
        type: "list",
        key: "items",
        label: "Items",
        itemLabel: "Item",
        max: 3,
        fields: [
          { type: "text", key: "q", label: "Q", max: 20, required: true },
          { type: "textarea", key: "a", label: "A", max: 20 },
        ],
      },
    ],
  },
];

const valid = {
  title: "Hello",
  email: "",
  phone: "+2349160952000",
  heading: "One\n*two*",
  steps: ["a", "b"],
  faqs: { items: [{ q: "Why?", a: "Because" }] },
};

describe("validatePage", () => {
  it("accepts valid content, trims text and drops unknown keys", () => {
    const result = validatePage(fields, { ...valid, title: "  Hello  ", extra: "<script>" });
    expect(result).toEqual({ ok: true, values: valid });
  });

  it("reports errors by field path", () => {
    const result = validatePage(fields, {
      ...valid,
      title: "",
      email: "not-an-email",
      phone: "0916 095 2000",
      heading: "1\n2\n3\n4\n5",
      steps: ["a"],
      faqs: { items: [{ q: "", a: "x".repeat(21) }] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({
        title: "This can't be empty.",
        email: "Enter a valid email address.",
        phone: "Use the international format, e.g. +2349160952000.",
        heading: "Use at most 4 lines.",
        steps: "Needs exactly 2 items.",
        "faqs.items.0.q": "This can't be empty.",
        "faqs.items.0.a": "Use at most 20 characters.",
      });
    }
  });

  it("rejects too many list entries and over-long list items", () => {
    const result = validatePage(fields, {
      ...valid,
      steps: ["toolong", "b"],
      faqs: { items: Array.from({ length: 4 }, () => ({ q: "q", a: "" })) },
    });
    expect(result.ok ? {} : result.errors).toEqual({ "steps.0": "Use at most 5 characters.", "faqs.items": "At most 3." });
  });
});

describe("case study fields", () => {
  const related: Field[] = [{ type: "group", key: "related", label: "Related", fields: [{ type: "caseStudy", key: "caseStudy", label: "Case study" }] }];

  it("accepts a web address or none, and rejects anything else", () => {
    expect(validatePage(related, { related: { caseStudy: "votely" } }).ok).toBe(true);
    expect(validatePage(related, { related: { caseStudy: "" } }).ok).toBe(true);
    expect(validatePage(related, { related: { caseStudy: "Not A Slug" } })).toEqual({
      ok: false,
      errors: { "related.caseStudy": "Choose a case study from the list." },
    });
  });

  it("fills in the choices inside groups and lists", () => {
    const options = [{ value: "votely", label: "Votely" }];
    const [group] = withCaseStudyOptions(related, options);
    expect(group.type === "group" && group.fields[0]).toMatchObject({ type: "caseStudy", options });
    // The shared definitions are left untouched.
    expect(related[0].type === "group" && related[0].fields[0]).not.toHaveProperty("options");
  });

  it("is used for every service page's related work", () => {
    for (const page of PAGES.filter((definition) => definition.key.startsWith("service-"))) {
      const group = page.fields.find((field) => field.key === "related");
      expect(group?.type === "group" && group.fields.find((field) => field.key === "caseStudy")?.type).toBe("caseStudy");
    }
  });
});

describe("withDefaults", () => {
  it("fills missing fields from the defaults but keeps saved lists as they are", () => {
    const defaults = { title: "Default", steps: ["x", "y"], faqs: { items: [{ q: "Default q", a: "" }] } };
    const merged = withDefaults(fields, { title: "Saved", faqs: { items: [] } }, defaults);
    expect(merged).toMatchObject({ title: "Saved", steps: ["x", "y"], heading: "", faqs: { items: [] } });
  });

  it("fills fields added to list entries after they were saved", () => {
    const merged = withDefaults(fields, { faqs: { items: [{ q: "Saved q" }] } }, {});
    expect((merged.faqs as { items: unknown[] }).items).toEqual([{ q: "Saved q", a: "" }]);
  });
});
