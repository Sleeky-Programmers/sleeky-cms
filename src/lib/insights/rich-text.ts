import type { Extensions, JSONContent } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";

// The article body schema, shared by the editor (browser) and HTML rendering
// (server), so what editors see is exactly what the website gets.
export const richTextExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    codeBlock: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer", target: null },
    },
  }),
  Image.configure({ inline: false, allowBase64: false }),
];

export type RichTextDoc = JSONContent & { type: "doc" };

export const emptyDoc = (): RichTextDoc => ({ type: "doc", content: [{ type: "paragraph" }] });

/** Plain text of a document (for empty checks, word counts and search). */
export function docText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const inner = (node.content ?? []).map(docText).join("");
  // Text blocks end with a line break; containers (doc, lists, quotes) just join their blocks.
  return node.type === "paragraph" || node.type === "heading" ? `${inner}\n` : inner;
}

export function wordCount(doc: JSONContent | undefined): number {
  return docText(doc).split(/\s+/).filter(Boolean).length;
}

/** Minutes to read at ~200 words per minute, at least 1. */
export function readingMinutes(doc: JSONContent | undefined): number {
  return Math.max(1, Math.round(wordCount(doc) / 200));
}
