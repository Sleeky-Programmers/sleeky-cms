import { MongoServerError, ObjectId, type Collection } from "mongodb";
import { z } from "zod";
import { db } from "../db";
import { isOwnImageUrl, type StoredImage } from "../images";
import { ALT_MAX, CATEGORY_MAX, EXCERPT_MAX, EXCERPT_MIN, META_DESCRIPTION_MAX, TITLE_MAX } from "./limits";
import { renderArticleHtml } from "./render";
import { docText, readingMinutes, type RichTextDoc } from "./rich-text";
import { sanitizeDoc } from "./sanitize";
import { SLUG_MAX, SLUG_PATTERN, slugify } from "./slug";

export type ArticleStatus = "draft" | "published";
type Person = { id: string; name: string };

type ArticleDoc = {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  author: Person;
  coverImage: StoredImage | null;
  body: RichTextDoc;
  status: ArticleStatus;
  /** First time the article went live; kept when it's unpublished and republished. */
  publishedAt: Date | null;
  createdAt: Date;
  createdBy: Person;
  updatedAt: Date;
  updatedBy: Person;
};

/** Everything the editor needs. `version` guards against overwriting someone else's save. */
export type Article = {
  id: string;
  version: string;
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  author: Person;
  coverImage: StoredImage | null;
  body: RichTextDoc;
  status: ArticleStatus;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: Person;
};

export type ArticleSummary = Pick<Article, "id" | "title" | "slug" | "category" | "author" | "status" | "publishedAt" | "updatedAt" | "updatedBy">;

export class ArticleError extends Error {
  constructor(
    readonly code: "not-found" | "conflict" | "slug-taken" | "invalid" | "published",
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

let indexesReady: Promise<unknown> | undefined;

async function articles(): Promise<Collection<ArticleDoc>> {
  const collection = db().collection<ArticleDoc>("insight");
  indexesReady ??= Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true }),
    collection.createIndex({ status: 1, publishedAt: -1 }),
    collection.createIndex({ updatedAt: -1 }),
  ]).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;
  return collection;
}

const versionOf = (doc: ArticleDoc) => String(doc.updatedAt.getTime());

function toArticle(doc: ArticleDoc): Article {
  return {
    id: doc._id.toHexString(),
    version: versionOf(doc),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    metaDescription: doc.metaDescription,
    category: doc.category,
    author: doc.author,
    coverImage: doc.coverImage,
    body: doc.body,
    status: doc.status,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy,
  };
}

function toSummary(doc: ArticleDoc): ArticleSummary {
  const { id, title, slug, category, author, status, publishedAt, updatedAt, updatedBy } = toArticle(doc);
  return { id, title, slug, category, author, status, publishedAt, updatedAt, updatedBy };
}

// ---------- Input validation ----------

const storedImageSchema = z.object({
  publicId: z.string().min(1).max(300),
  url: z.string().refine(isOwnImageUrl, "Images must be uploaded through the CMS."),
  width: z.number().int().positive().max(20_000),
  height: z.number().int().positive().max(20_000),
  alt: z.string().trim().max(ALT_MAX, `Use at most ${ALT_MAX} characters.`),
});

export const articleInputSchema = z.object({
  id: z.string().optional(),
  version: z.string().optional(),
  title: z.string().trim().min(1, "Give the article a title.").max(TITLE_MAX, `Use at most ${TITLE_MAX} characters.`),
  slug: z.string().trim().toLowerCase().max(SLUG_MAX, `Use at most ${SLUG_MAX} characters.`),
  excerpt: z.string().trim().max(EXCERPT_MAX, `Use at most ${EXCERPT_MAX} characters.`),
  metaDescription: z.string().trim().max(META_DESCRIPTION_MAX, `Use at most ${META_DESCRIPTION_MAX} characters.`),
  category: z.string().trim().max(CATEGORY_MAX, `Use at most ${CATEGORY_MAX} characters.`),
  authorId: z.string().min(1, "Choose an author."),
  coverImage: storedImageSchema.nullable(),
  body: z.unknown(),
});

export type ArticleInput = z.input<typeof articleInputSchema>;
export type SaveIntent = "save" | "publish" | "unpublish";

/** Extra checks before an article can be live on the website. */
function publishErrors(input: { slug: string; excerpt: string; category: string; coverImage: StoredImage | null; body: RichTextDoc }) {
  const errors: Record<string, string> = {};
  if (!SLUG_PATTERN.test(input.slug)) errors.slug = "Use lowercase letters, numbers and single hyphens.";
  if (input.excerpt.length < EXCERPT_MIN) errors.excerpt = `Write a short summary (at least ${EXCERPT_MIN} characters).`;
  if (!input.category) errors.category = "Choose a category.";
  if (input.coverImage && !input.coverImage.alt) errors.coverAlt = "Describe the cover image for people who can't see it.";
  if (docText(input.body).trim().length < 50) errors.body = "Write the article before publishing.";
  return errors;
}

// ---------- Queries for the CMS ----------

export async function listArticles(filter: { status?: ArticleStatus } = {}): Promise<ArticleSummary[]> {
  const collection = await articles();
  const docs = await collection
    .find(filter.status ? { status: filter.status } : {}, { projection: { body: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(toSummary);
}

export async function countArticles(): Promise<Record<ArticleStatus, number>> {
  const collection = await articles();
  const [draft, published] = await Promise.all([
    collection.countDocuments({ status: "draft" }),
    collection.countDocuments({ status: "published" }),
  ]);
  return { draft, published };
}

export async function getArticle(id: string): Promise<Article | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await articles()).findOne({ _id: new ObjectId(id) });
  return doc ? toArticle(doc) : null;
}

/** Categories already used, plus the defaults, for the category picker. */
export async function listCategories(defaults: string[]): Promise<string[]> {
  const used = (await (await articles()).distinct("category")) as string[];
  return [...new Set([...defaults, ...used.filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}

// ---------- Saving ----------

/**
 * Creates or updates an article.
 * - "save": keeps the current status (a published article updates live).
 * - "publish": makes it live, after the publishing checks.
 * - "unpublish": takes it off the website and back to draft.
 */
export async function saveArticle(
  raw: unknown,
  intent: SaveIntent,
  actor: Person,
  resolveAuthor: (id: string) => Promise<Person | null>,
): Promise<{ article: Article; wentLive: boolean; slugsToRefresh: string[] }> {
  const parsed = articleInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      const key = path === "coverImage.alt" ? "coverAlt" : String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    throw new ArticleError("invalid", "Check the highlighted fields.", fieldErrors);
  }
  const input = parsed.data;

  const author = await resolveAuthor(input.authorId);
  if (!author) throw new ArticleError("invalid", "Check the highlighted fields.", { authorId: "Choose an author from the team." });

  const body = sanitizeDoc(input.body, { isAllowedImage: isOwnImageUrl });
  const slug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (!slug) throw new ArticleError("invalid", "Check the highlighted fields.", { slug: "Add a web address for the article." });

  const collection = await articles();
  let existing: ArticleDoc | null = null;
  if (input.id) {
    existing = ObjectId.isValid(input.id) ? await collection.findOne({ _id: new ObjectId(input.id) }) : null;
    if (!existing) throw new ArticleError("not-found", "This article no longer exists.");
  }
  if (existing && input.version !== versionOf(existing)) {
    throw new ArticleError(
      "conflict",
      `${existing.updatedBy.name} saved changes to this article after you opened it. Copy anything you need, then reload to see their version.`,
    );
  }

  const status: ArticleStatus = intent === "publish" ? "published" : intent === "unpublish" ? "draft" : (existing?.status ?? "draft");
  const fields = {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    metaDescription: input.metaDescription,
    category: input.category,
    author,
    coverImage: input.coverImage,
    body,
  };

  if (status === "published") {
    const errors = publishErrors(fields);
    if (Object.keys(errors).length) {
      throw new ArticleError("invalid", "A few things need fixing before this can go live.", errors);
    }
  }

  const now = new Date();
  // Keep the version strictly increasing even when two saves land in the same millisecond.
  const updatedAt = existing && now.getTime() <= existing.updatedAt.getTime() ? new Date(existing.updatedAt.getTime() + 1) : now;
  const publishedAt = status === "published" ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null);

  try {
    if (!existing) {
      const doc: ArticleDoc = {
        _id: new ObjectId(),
        ...fields,
        status,
        publishedAt,
        createdAt: now,
        createdBy: actor,
        updatedAt,
        updatedBy: actor,
      };
      await collection.insertOne(doc);
      return { article: toArticle(doc), wentLive: status === "published", slugsToRefresh: status === "published" ? [slug] : [] };
    }

    // Only update if nobody saved in between (compare-and-set on updatedAt).
    const updated = await collection.findOneAndUpdate(
      { _id: existing._id, updatedAt: existing.updatedAt },
      { $set: { ...fields, status, publishedAt, updatedAt, updatedBy: actor } },
      { returnDocument: "after" },
    );
    if (!updated) {
      throw new ArticleError("conflict", "Someone else saved this article at the same moment. Reload to see their version.");
    }

    // The website needs refreshing whenever something live changed or was taken down.
    const wasLive = existing.status === "published";
    const isLive = status === "published";
    const slugsToRefresh = wasLive || isLive ? [...new Set([existing.slug, slug])] : [];
    return { article: toArticle(updated), wentLive: !wasLive && isLive, slugsToRefresh };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new ArticleError("slug-taken", "Check the highlighted fields.", { slug: "Another article already uses this address." });
    }
    throw error;
  }
}

/** Deletes a draft. Published articles must be unpublished first, so nothing disappears from the website by accident. */
export async function deleteArticle(id: string) {
  if (!ObjectId.isValid(id)) throw new ArticleError("not-found", "This article no longer exists.");
  const collection = await articles();
  const result = await collection.deleteOne({ _id: new ObjectId(id), status: "draft" });
  if (result.deletedCount === 0) {
    const stillThere = await collection.countDocuments({ _id: new ObjectId(id) });
    throw stillThere
      ? new ArticleError("published", "Unpublish this article before deleting it.")
      : new ArticleError("not-found", "This article no longer exists.");
  }
}

// ---------- Public queries (the website) ----------

export type PublicArticleSummary = {
  slug: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  coverImage: StoredImage | null;
};

export type PublicArticle = PublicArticleSummary & { html: string };

function toPublicSummary(doc: ArticleDoc): PublicArticleSummary {
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    metaDescription: doc.metaDescription || doc.excerpt.slice(0, META_DESCRIPTION_MAX),
    category: doc.category,
    author: doc.author.name,
    publishedAt: (doc.publishedAt ?? doc.createdAt).toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    readingMinutes: readingMinutes(doc.body),
    coverImage: doc.coverImage,
  };
}

export async function listPublishedArticles(): Promise<PublicArticleSummary[]> {
  const docs = await (await articles()).find({ status: "published" }).sort({ publishedAt: -1 }).toArray();
  return docs.map(toPublicSummary);
}

export async function getPublishedArticle(slug: string): Promise<PublicArticle | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const doc = await (await articles()).findOne({ slug, status: "published" });
  return doc ? { ...toPublicSummary(doc), html: renderArticleHtml(doc.body) } : null;
}

/** Full article rendered for the CMS preview (any status). */
export async function previewArticle(id: string): Promise<(PublicArticle & { status: ArticleStatus }) | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await articles()).findOne({ _id: new ObjectId(id) });
  return doc ? { ...toPublicSummary(doc), html: renderArticleHtml(doc.body), status: doc.status } : null;
}
