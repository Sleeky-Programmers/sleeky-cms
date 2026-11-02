import { MongoServerError, type Collection } from "mongodb";
import { db } from "../db";
import { renderArticleHtml } from "../insights/render";
import type { RichTextDoc } from "../insights/rich-text";
import { isRecord, withDefaults, type Field, type PageValues } from "./fields";
import { getPageDefinition, PAGES, type PageDefinition } from "./registry";
import { validatePage } from "./validate";

type Person = { id: string; name: string };

/** Only edited pages are stored; the rest use their default text. */
type PageDoc = {
  _id: string;
  values: PageValues;
  updatedAt: Date;
  updatedBy: Person;
};

/** Version of a page that has never been edited. */
export const DEFAULT_VERSION = "default";

export type PageState = {
  key: string;
  values: PageValues;
  /** Guards against overwriting someone else's save. */
  version: string;
  customised: boolean;
  updatedAt: string | null;
  updatedBy: Person | null;
};

export class PageError extends Error {
  constructor(
    readonly code: "not-found" | "invalid" | "conflict",
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const pages = (): Collection<PageDoc> => db().collection<PageDoc>("page");

function stateOf(definition: PageDefinition, doc: PageDoc | null): PageState {
  return {
    key: definition.key,
    values: withDefaults(definition.fields, doc?.values, definition.defaults),
    version: doc ? String(doc.updatedAt.getTime()) : DEFAULT_VERSION,
    customised: Boolean(doc),
    updatedAt: doc?.updatedAt.toISOString() ?? null,
    updatedBy: doc?.updatedBy ?? null,
  };
}

function definitionOrThrow(key: string) {
  const definition = getPageDefinition(key);
  if (!definition) throw new PageError("not-found", "This page doesn't exist.");
  return definition;
}

export async function getPage(key: string): Promise<PageState | null> {
  const definition = getPageDefinition(key);
  if (!definition) return null;
  return stateOf(definition, await pages().findOne({ _id: key }));
}

export type PageSummary = Pick<PageDefinition, "key" | "title" | "group" | "description" | "websitePath"> & {
  customised: boolean;
  updatedAt: string | null;
  updatedBy: Person | null;
};

export async function listPages(): Promise<PageSummary[]> {
  // Only the service name is needed from the saved content (services can be renamed).
  const docs = await pages().find({}, { projection: { updatedAt: 1, updatedBy: 1, "values.listing.name": 1 } }).toArray();
  const byKey = new Map(docs.map((doc) => [doc._id, doc]));
  return PAGES.map(({ key, title, group, description, websitePath }) => {
    const doc = byKey.get(key);
    const listing = doc?.values?.listing;
    const savedName = isRecord(listing) && typeof listing.name === "string" && listing.name.trim() ? listing.name : null;
    return {
      key,
      title: savedName ?? title,
      group,
      description,
      websitePath,
      customised: Boolean(doc),
      updatedAt: doc?.updatedAt.toISOString() ?? null,
      updatedBy: doc?.updatedBy ?? null,
    };
  });
}

/**
 * Saves a page's content (it goes live straight away). Refused if someone else
 * saved after `version` was loaded.
 */
export async function savePage(key: string, input: unknown, version: string, actor: Person): Promise<PageState> {
  const definition = definitionOrThrow(key);
  const result = validatePage(definition.fields, input);
  if (!result.ok) throw new PageError("invalid", "Check the highlighted fields.", result.errors);

  const collection = pages();
  const existing = await collection.findOne({ _id: key });
  const currentVersion = existing ? String(existing.updatedAt.getTime()) : DEFAULT_VERSION;
  if (version !== currentVersion) throw conflict(existing);

  const now = new Date();
  const updatedAt = existing && now.getTime() <= existing.updatedAt.getTime() ? new Date(existing.updatedAt.getTime() + 1) : now;

  try {
    if (!existing) {
      const doc: PageDoc = { _id: key, values: result.values, updatedAt, updatedBy: actor };
      await collection.insertOne(doc);
      return stateOf(definition, doc);
    }
    const updated = await collection.findOneAndUpdate(
      { _id: key, updatedAt: existing.updatedAt },
      { $set: { values: result.values, updatedAt, updatedBy: actor } },
      { returnDocument: "after" },
    );
    if (!updated) throw conflict(await collection.findOne({ _id: key }));
    return stateOf(definition, updated);
  } catch (error) {
    // Two first saves at once: the second insert hits the existing key.
    if (error instanceof MongoServerError && error.code === 11000) throw conflict(await collection.findOne({ _id: key }));
    throw error;
  }
}

/** Puts a page back to its original website text. */
export async function resetPage(key: string, version: string): Promise<PageState> {
  const definition = definitionOrThrow(key);
  const collection = pages();
  if (version === DEFAULT_VERSION) {
    // Already original on screen; but if someone has saved since, don't pretend it's reset.
    const existing = await collection.findOne({ _id: key });
    if (existing) throw conflict(existing);
    return stateOf(definition, null);
  }
  const result = await collection.deleteOne({ _id: key, updatedAt: new Date(Number(version)) });
  if (result.deletedCount === 0) {
    const existing = await collection.findOne({ _id: key });
    if (existing) throw conflict(existing);
  }
  return stateOf(definition, null);
}

function conflict(doc: PageDoc | null) {
  return new PageError(
    "conflict",
    doc
      ? `${doc.updatedBy.name} saved changes to this page after you opened it. Copy anything you need, then reload to see their version.`
      : "This page was reset after you opened it. Reload to see the current text.",
  );
}

// ---------- Public (the website) ----------

/** Replaces rich-text documents with { html } so the website gets ready-to-render content. */
function renderForWebsite(fields: Field[], values: PageValues): PageValues {
  const output: PageValues = {};
  for (const field of fields) {
    const value = values[field.key];
    if (field.type === "richText") {
      output[field.key] = { html: renderArticleHtml(value as RichTextDoc) };
    } else if (field.type === "group") {
      output[field.key] = renderForWebsite(field.fields, isRecord(value) ? value : {});
    } else if (field.type === "list") {
      output[field.key] = (Array.isArray(value) ? value : []).map((item) => renderForWebsite(field.fields, isRecord(item) ? item : {}));
    } else {
      output[field.key] = value;
    }
  }
  return output;
}

export async function getPublicPage(key: string) {
  const page = await getPage(key);
  const definition = getPageDefinition(key);
  if (!page || !definition) return null;
  return { key, updatedAt: page.updatedAt, content: renderForWebsite(definition.fields, page.values) };
}

export async function listPublicPages() {
  return (await listPages()).map(({ key, title, group, websitePath, updatedAt }) => ({ key, title, group, websitePath: websitePath ?? null, updatedAt }));
}
