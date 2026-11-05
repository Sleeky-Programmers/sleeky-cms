import { describe, expect, it } from "vitest";
import { renderArticleHtml } from "./render";
import { docText, readingMinutes, wordCount, type RichTextDoc } from "./rich-text";
import { isSafeLink, sanitizeDoc } from "./sanitize";
import { SLUG_PATTERN, slugify } from "./slug";

const OWN = "https://res.cloudinary.com/sleeky/image/upload/v1/sleeky-cms/insights/a.jpg";
const options = { isAllowedImage: (src: string) => src === OWN };

const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: unknown[]) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });

describe("slugify", () => {
  it.each([
    ["Why your website needs a CMS?", "why-your-website-needs-a-cms"],
    ["  Lagos & Abuja: 2026 guide ", "lagos-and-abuja-2026-guide"],
    ["Café déjà vu", "cafe-deja-vu"],
    ["---", ""],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
    if (expected) expect(expected).toMatch(SLUG_PATTERN);
  });

  it("caps the length without leaving a trailing hyphen", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});

describe("isSafeLink", () => {
  it.each(["https://sleekyprogrammers.com", "http://example.com/a?b=c", "mailto:hi@x.com", "tel:+2349160952000", "/insights/x", "#section"])(
    "allows %s",
    (href) => expect(isSafeLink(href)).toBe(true),
  );
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>", "//evil.com", "vbscript:x", 42])(
    "rejects %s",
    (href) => expect(isSafeLink(href)).toBe(false),
  );
});

describe("sanitizeDoc", () => {
  it("keeps supported content and marks", () => {
    const input = doc(
      { type: "heading", attrs: { level: 3 }, content: [text("Title")] },
      p(text("Bold", [{ type: "bold" }]), text(" and a "), text("link", [{ type: "link", attrs: { href: "https://x.com", onclick: "evil()" } }])),
      { type: "bulletList", content: [{ type: "listItem", content: [p(text("One"))] }] },
      { type: "image", attrs: { src: OWN, alt: "A chart", onerror: "evil()" } },
    );
    expect(sanitizeDoc(input, options)).toEqual(
      doc(
        { type: "heading", attrs: { level: 3 }, content: [text("Title")] },
        p(text("Bold", [{ type: "bold" }]), text(" and a "), text("link", [{ type: "link", attrs: { href: "https://x.com" } }])),
        { type: "bulletList", content: [{ type: "listItem", content: [p(text("One"))] }] },
        { type: "image", attrs: { src: OWN, alt: "A chart", title: null } },
      ),
    );
  });

  it("drops unknown nodes, unsafe links and outside images", () => {
    const input = doc(
      { type: "script", content: [text("alert(1)")] },
      { type: "iframe", attrs: { src: "https://evil.com" } },
      p(text("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "fontColor" }])),
      { type: "image", attrs: { src: "https://evil.com/tracker.gif" } },
      { type: "heading", attrs: { level: 1 }, content: [text("Too big")] },
    );
    expect(sanitizeDoc(input, options)).toEqual(
      doc(p(text("click")), { type: "heading", attrs: { level: 2 }, content: [text("Too big")] }),
    );
  });

  it("drops the editor's trailing empty lines", () => {
    expect(sanitizeDoc(doc(p(text("Hi")), { type: "paragraph" }, { type: "paragraph" }), options)).toEqual(doc(p(text("Hi"))));
  });

  it("returns an empty document for garbage", () => {
    for (const input of [null, "x", 42, { type: "paragraph" }, { type: "doc", content: "nope" }]) {
      expect(sanitizeDoc(input, options)).toEqual(doc({ type: "paragraph" }));
    }
  });

  it("stops at absurd nesting", () => {
    let node: Record<string, unknown> = p(text("deep"));
    for (let i = 0; i < 50; i++) node = { type: "blockquote", content: [node] };
    const result = sanitizeDoc(doc(node), options);
    expect(JSON.stringify(result)).not.toContain("deep");
  });
});

describe("renderArticleHtml", () => {
  it("renders the body to HTML on the server", () => {
    const html = renderArticleHtml(
      sanitizeDoc(
        doc(
          { type: "heading", attrs: { level: 2 }, content: [text("Why it matters")] },
          p(text("Read "), text("this", [{ type: "link", attrs: { href: "https://x.com" } }]), text(".")),
          { type: "image", attrs: { src: OWN, alt: "Chart" } },
        ),
        options,
      ),
    );
    expect(html).toContain("<h2>Why it matters</h2>");
    expect(html).toContain('<a rel="noopener noreferrer" href="https://x.com">this</a>');
    expect(html).toContain(`<img src="${OWN}" alt="Chart">`);
  });

  it("escapes text instead of rendering it as HTML", () => {
    const html = renderArticleHtml(sanitizeDoc(doc(p(text("<script>alert(1)</script>"))), options));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("word counts", () => {
  const body = doc(p(text("one two three")), { type: "heading", attrs: { level: 2 }, content: [text("four")] }) as RichTextDoc;

  it("counts words across blocks", () => {
    expect(docText(body)).toBe("one two three\nfour\n");
    expect(wordCount(body)).toBe(4);
  });

  it("estimates at least a minute of reading", () => {
    expect(readingMinutes(body)).toBe(1);
    expect(readingMinutes(doc(p(text("word ".repeat(1000)))) as RichTextDoc)).toBe(5);
  });
});
