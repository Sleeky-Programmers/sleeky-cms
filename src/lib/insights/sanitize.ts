import type { JSONContent } from "@tiptap/core";
import type { RichTextDoc } from "./rich-text";

/**
 * Rebuilds an article body from untrusted JSON, keeping only the node types,
 * marks and attributes the editor supports. Server Actions can be called
 * directly, so the editor's own rules can't be relied on: this is what stops
 * scripts, outside images or unexpected HTML from reaching the website.
 */

type Options = {
  /** Decides whether an image URL may be used (our own Cloudinary account). */
  isAllowedImage: (src: string) => boolean;
};

const MAX_DEPTH = 12;
const MAX_NODES = 20_000;

const BLOCKS_WITH_CONTENT = new Set(["doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote"]);
const LEAF_BLOCKS = new Set(["hardBreak", "horizontalRule"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

export function isSafeLink(href: unknown): href is string {
  if (typeof href !== "string" || href.length > 2000) return false;
  const value = href.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  try {
    return ["http:", "https:", "mailto:", "tel:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

function cleanMarks(marks: unknown): JSONContent["marks"] {
  if (!Array.isArray(marks)) return undefined;
  const result: NonNullable<JSONContent["marks"]> = [];
  for (const mark of marks) {
    if (!mark || typeof mark !== "object") continue;
    const type = (mark as { type?: unknown }).type;
    if (typeof type === "string" && SIMPLE_MARKS.has(type)) {
      result.push({ type });
    } else if (type === "link") {
      const href = (mark as { attrs?: { href?: unknown } }).attrs?.href;
      if (isSafeLink(href)) result.push({ type: "link", attrs: { href: href.trim() } });
    }
  }
  return result.length ? result : undefined;
}

export function sanitizeDoc(input: unknown, options: Options): RichTextDoc {
  let count = 0;

  const visit = (node: unknown, depth: number): JSONContent | null => {
    if (!node || typeof node !== "object" || depth > MAX_DEPTH || ++count > MAX_NODES) return null;
    const { type, attrs, content, text, marks } = node as JSONContent;

    if (type === "text") {
      const value = cleanText(text, 100_000);
      if (!value) return null;
      const cleanedMarks = cleanMarks(marks);
      return cleanedMarks ? { type, text: value, marks: cleanedMarks } : { type, text: value };
    }

    if (type === "image") {
      const src = attrs?.src;
      if (typeof src !== "string" || !options.isAllowedImage(src)) return null;
      return { type, attrs: { src, alt: cleanText(attrs?.alt, 300), title: null } };
    }

    if (LEAF_BLOCKS.has(type ?? "")) return { type };

    if (!BLOCKS_WITH_CONTENT.has(type ?? "")) return null;

    const children = Array.isArray(content)
      ? content.map((child) => visit(child, depth + 1)).filter((child): child is JSONContent => child !== null)
      : [];
    const result: JSONContent = { type };
    if (children.length) result.content = children;

    if (type === "heading") {
      result.attrs = { level: attrs?.level === 3 ? 3 : 2 };
    } else if (type === "orderedList") {
      const start = Number(attrs?.start);
      result.attrs = { start: Number.isInteger(start) && start > 0 && start < 10_000 ? start : 1 };
    }

    // Lists and list items must not be empty, or the editor schema rejects the document.
    if ((type === "bulletList" || type === "orderedList" || type === "listItem" || type === "blockquote") && !children.length) {
      return null;
    }
    return result;
  };

  const root = visit(input, 0);
  if (!root || root.type !== "doc" || !root.content?.length) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }
  // The editor keeps an empty line at the end to type into; don't publish it.
  while (root.content.length > 1 && root.content.at(-1)?.type === "paragraph" && !root.content.at(-1)?.content) {
    root.content.pop();
  }
  return root as RichTextDoc;
}
