import { generateHTML } from "@tiptap/html/server";
import { richTextExtensions, type RichTextDoc } from "./rich-text";

/**
 * Article body as HTML for the website and the CMS preview. The document is
 * already sanitized on save; rendering only through the editor schema adds a
 * second guarantee that nothing outside it can appear in the output.
 */
export function renderArticleHtml(doc: RichTextDoc): string {
  return generateHTML(doc, richTextExtensions);
}
