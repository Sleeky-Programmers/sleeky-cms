import { MongoServerError, ObjectId, type Collection } from "mongodb";
import { z } from "zod";
import { db } from "../db";
import type { StoredImage } from "../images";
import { SLUG_MAX, SLUG_PATTERN, slugify } from "../insights/slug";
import { isRecord, withDefaults, type PageValues } from "../pages/fields";
import { validatePage } from "../pages/validate";
import { caseStudyFields, SUMMARY_MIN, THEMES, type CaseStudyTheme } from "./fields";
import { websiteCaseStudyImports } from "./website-case-studies";

export type CaseStudyStatus = "draft" | "published";
type Person = { id: string; name: string };

type CaseStudyDoc = {
  _id: ObjectId;
  slug: string;
  status: CaseStudyStatus;
  /** Order on the website (lowest first); also decides the "Next project" link. */
  position: number;
  content: PageValues;
  /** First time it went live; kept when unpublished and republished. */
  publishedAt: Date | null;
  createdAt: Date;
  createdBy: Person;
  updatedAt: Date;
  updatedBy: Person;
};

/** Everything the editor needs. `version` guards against overwriting someone else's save. */
export type CaseStudy = {
  id: string;
  version: string;
  slug: string;
  status: CaseStudyStatus;
  content: PageValues;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: Person;
};

export type CaseStudySummary = {
  id: string;
  slug: string;
  client: string;
  tags: string[];
  status: CaseStudyStatus;
  hasScreenshot: boolean;
  updatedAt: string;
  updatedBy: Person;
};

export class CaseStudyError extends Error {
  constructor(
    readonly code: "not-found" | "conflict" | "slug-taken" | "invalid" | "published",
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

let indexesReady: Promise<unknown> | undefined;

async function caseStudies(): Promise<Collection<CaseStudyDoc>> {
  const collection = db().collection<CaseStudyDoc>("case_study");
  indexesReady ??= Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true }),
    collection.createIndex({ position: 1 }),
  ]).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;
  return collection;
}

const versionOf = (doc: CaseStudyDoc) => String(doc.updatedAt.getTime());
const contentOf = (doc: Pick<CaseStudyDoc, "content">) => withDefaults(caseStudyFields, doc.content, {});

type Overview = { client: string; summary: string; tags: string[]; sector: string; liveUrl: string; theme: CaseStudyTheme };
const section = <T>(content: PageValues, key: string) => (isRecord(content[key]) ? content[key] : {}) as T;

function toCaseStudy(doc: CaseStudyDoc): CaseStudy {
  return {
    id: doc._id.toHexString(),
    version: versionOf(doc),
    slug: doc.slug,
    status: doc.status,
    content: contentOf(doc),
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy,
  };
}

function toSummary(doc: CaseStudyDoc): CaseStudySummary {
  const content = contentOf(doc);
  const overview = section<Overview>(content, "overview");
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    client: overview.client,
    tags: overview.tags,
    status: doc.status,
    hasScreenshot: Boolean(section<{ hero?: StoredImage | null }>(content, "images").hero),
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy,
  };
}

// ---------- Validation ----------

const inputSchema = z.object({
  id: z.string().optional(),
  version: z.string().optional(),
  slug: z.string().trim().toLowerCase().max(SLUG_MAX, `Use at most ${SLUG_MAX} characters.`),
  content: z.unknown(),
});

export type SaveIntent = "save" | "publish" | "unpublish";

/** Extra checks before a case study can be live. Keys are field paths, like the editor's errors. */
export function publishErrors(slug: string, content: PageValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const overview = section<Overview>(content, "overview");
  const built = section<{ headline: string; body: string }>(content, "built");
  const challenge = section<{ headline: string; body: string }>(content, "challenge");
  const quote = section<{ text: string; author: string; role: string }>(content, "quote");
  const images = section<{ hero: StoredImage | null; secondary: StoredImage | null }>(content, "images");
  const features = Array.isArray(content.features) ? (content.features as { image: StoredImage | null }[]) : [];

  if (!SLUG_PATTERN.test(slug)) errors.slug = "Use lowercase letters, numbers and single hyphens.";
  if (overview.summary.length < SUMMARY_MIN) errors["overview.summary"] = `Write a short summary (at least ${SUMMARY_MIN} characters).`;
  if (overview.tags.length === 0) errors["overview.tags"] = "Add at least one service tag.";
  if (!built.headline) errors["built.headline"] = "Add a headline.";
  if (!built.body) errors["built.body"] = "Describe what you built.";
  if (challenge.headline && !challenge.body) errors["challenge.body"] = "Describe the challenge, or clear the headline to hide this section.";
  if (challenge.body && !challenge.headline) errors["challenge.headline"] = "Add a headline, or clear the text to hide this section.";
  if (quote.text && !quote.author) errors["quote.author"] = "Say who said this.";
  if ((quote.author || quote.role) && !quote.text) errors["quote.text"] = "Add the quote, or clear the name and role to hide this section.";

  const describe = "Describe this screenshot for people who can't see it.";
  if (images.hero && !images.hero.alt) errors["images.hero.alt"] = describe;
  if (images.secondary && !images.secondary.alt) errors["images.secondary.alt"] = describe;
  features.forEach((feature, index) => {
    if (feature.image && !feature.image.alt) errors[`features.${index}.image.alt`] = describe;
  });
  return errors;
}

// ---------- Queries for the CMS ----------

export async function listCaseStudies(): Promise<CaseStudySummary[]> {
  const docs = await (await caseStudies()).find({}).sort({ position: 1 }).toArray();
  return docs.map(toSummary);
}

export async function countCaseStudies(): Promise<Record<CaseStudyStatus, number>> {
  const collection = await caseStudies();
  const [draft, published] = await Promise.all([
    collection.countDocuments({ status: "draft" }),
    collection.countDocuments({ status: "published" }),
  ]);
  return { draft, published };
}

export async function getCaseStudy(id: string): Promise<CaseStudy | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await caseStudies()).findOne({ _id: new ObjectId(id) });
  return doc ? toCaseStudy(doc) : null;
}

/** A blank case study for the "new" screen. */
export const emptyCaseStudyContent = (): PageValues => withDefaults(caseStudyFields, {}, {});

async function nextPosition(collection: Collection<CaseStudyDoc>) {
  const last = await collection.find({}, { projection: { position: 1 } }).sort({ position: -1 }).limit(1).next();
  return (last?.position ?? -1) + 1;
}

// ---------- Saving ----------

/**
 * Creates or updates a case study.
 * - "save": keeps the current status (a published case study updates live).
 * - "publish": makes it live, after the publishing checks.
 * - "unpublish": takes it off the website and back to draft.
 */
export async function saveCaseStudy(
  raw: unknown,
  intent: SaveIntent,
  actor: Person,
): Promise<{ caseStudy: CaseStudy; wentLive: boolean; slugsToRefresh: string[] }> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CaseStudyError("invalid", "Check the highlighted fields.", { slug: parsed.error.issues[0]?.message ?? "Check the web address." });
  }
  const input = parsed.data;

  const validated = validatePage(caseStudyFields, input.content);
  if (!validated.ok) throw new CaseStudyError("invalid", "Check the highlighted fields.", validated.errors);
  const content = validated.values;
  const client = section<Overview>(content, "overview").client;
  const slug = slugify(input.slug || client);
  if (!slug) throw new CaseStudyError("invalid", "Check the highlighted fields.", { slug: "Add a web address for the case study." });

  const collection = await caseStudies();
  let existing: CaseStudyDoc | null = null;
  if (input.id) {
    existing = ObjectId.isValid(input.id) ? await collection.findOne({ _id: new ObjectId(input.id) }) : null;
    if (!existing) throw new CaseStudyError("not-found", "This case study no longer exists.");
  }
  if (existing && input.version !== versionOf(existing)) {
    throw new CaseStudyError(
      "conflict",
      `${existing.updatedBy.name} saved changes to this case study after you opened it. Copy anything you need, then reload to see their version.`,
    );
  }

  const status: CaseStudyStatus = intent === "publish" ? "published" : intent === "unpublish" ? "draft" : (existing?.status ?? "draft");
  if (status === "published") {
    const errors = publishErrors(slug, content);
    if (Object.keys(errors).length) throw new CaseStudyError("invalid", "A few things need fixing before this can go live.", errors);
  }

  const now = new Date();
  // Keep the version strictly increasing even when two saves land in the same millisecond.
  const updatedAt = existing && now.getTime() <= existing.updatedAt.getTime() ? new Date(existing.updatedAt.getTime() + 1) : now;
  const publishedAt = status === "published" ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null);

  try {
    if (!existing) {
      const doc: CaseStudyDoc = {
        _id: new ObjectId(),
        slug,
        status,
        position: await nextPosition(collection),
        content,
        publishedAt,
        createdAt: now,
        createdBy: actor,
        updatedAt,
        updatedBy: actor,
      };
      await collection.insertOne(doc);
      return { caseStudy: toCaseStudy(doc), wentLive: status === "published", slugsToRefresh: status === "published" ? [slug] : [] };
    }

    // Only update if nobody saved in between (compare-and-set on updatedAt).
    const updated = await collection.findOneAndUpdate(
      { _id: existing._id, updatedAt: existing.updatedAt },
      { $set: { slug, status, content, publishedAt, updatedAt, updatedBy: actor } },
      { returnDocument: "after" },
    );
    if (!updated) throw new CaseStudyError("conflict", "Someone else saved this case study at the same moment. Reload to see their version.");

    const wasLive = existing.status === "published";
    const isLive = status === "published";
    const slugsToRefresh = wasLive || isLive ? [...new Set([existing.slug, slug])] : [];
    return { caseStudy: toCaseStudy(updated), wentLive: !wasLive && isLive, slugsToRefresh };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new CaseStudyError("slug-taken", "Check the highlighted fields.", { slug: "Another case study already uses this address." });
    }
    throw error;
  }
}

/** Deletes a draft. Published case studies must be unpublished first. */
export async function deleteCaseStudy(id: string) {
  if (!ObjectId.isValid(id)) throw new CaseStudyError("not-found", "This case study no longer exists.");
  const collection = await caseStudies();
  const result = await collection.deleteOne({ _id: new ObjectId(id), status: "draft" });
  if (result.deletedCount === 0) {
    const stillThere = await collection.countDocuments({ _id: new ObjectId(id) });
    throw stillThere
      ? new CaseStudyError("published", "Unpublish this case study before deleting it.")
      : new CaseStudyError("not-found", "This case study no longer exists.");
  }
}

/** Swaps a case study with its neighbour. Returns the live slugs whose order changed. */
export async function moveCaseStudy(id: string, direction: "up" | "down"): Promise<string[]> {
  if (!ObjectId.isValid(id)) throw new CaseStudyError("not-found", "This case study no longer exists.");
  const collection = await caseStudies();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new CaseStudyError("not-found", "This case study no longer exists.");

  const neighbour = await collection
    .find(direction === "up" ? { position: { $lt: doc.position } } : { position: { $gt: doc.position } })
    .sort({ position: direction === "up" ? -1 : 1 })
    .limit(1)
    .next();
  if (!neighbour) return [];

  await collection.bulkWrite([
    { updateOne: { filter: { _id: doc._id }, update: { $set: { position: neighbour.position } } } },
    { updateOne: { filter: { _id: neighbour._id }, update: { $set: { position: doc.position } } } },
  ]);
  return [doc, neighbour].filter((item) => item.status === "published").map((item) => item.slug);
}

/**
 * Copies the case studies currently on the website into the CMS, published and
 * in the website's order. Ones whose address is already used are skipped.
 */
export async function importWebsiteCaseStudies(actor: Person): Promise<string[]> {
  const collection = await caseStudies();
  const taken = new Set((await collection.find({}, { projection: { slug: 1 } }).toArray()).map((doc) => doc.slug));
  let position = await nextPosition(collection);
  const now = new Date();
  const docs: CaseStudyDoc[] = websiteCaseStudyImports
    .filter((study) => !taken.has(study.slug))
    .map((study) => ({
      _id: new ObjectId(),
      slug: study.slug,
      status: "published",
      position: position++,
      content: study.content,
      publishedAt: now,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    }));
  if (docs.length) await collection.insertMany(docs);
  return docs.map((doc) => doc.slug);
}

// ---------- Public queries (the website) ----------

/** Same image shape as the website's CaseStudyImage. */
type PublicImage = { src: string; alt: string; width: number; height: number };

/** Mirrors the website's CaseStudy type; empty optional sections are left out. */
export type PublicCaseStudy = {
  slug: string;
  client: string;
  tags: string[];
  summary: string;
  metaTitle: string;
  metaDescription: string;
  theme: CaseStudyTheme;
  sector?: string;
  liveUrl?: string;
  heroImage?: PublicImage;
  secondaryImage?: PublicImage;
  challenge?: { headline: string; body: string };
  built: { headline: string; body: string };
  features: { title: string; body: string; image?: PublicImage }[];
  results?: { value: string; label: string }[];
  quote?: { text: string; author: string; role: string };
  services: string[];
  publishedAt: string;
  updatedAt: string;
};

const publicImage = (image: StoredImage | null | undefined): PublicImage | undefined =>
  image ? { src: image.url, alt: image.alt, width: image.width, height: image.height } : undefined;

/** Leaves out keys whose value is undefined, so JSON matches the website's optional fields. */
const compact = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;

function toPublic(doc: CaseStudyDoc): PublicCaseStudy {
  const content = contentOf(doc);
  const overview = section<Overview>(content, "overview");
  const images = section<{ hero: StoredImage | null; secondary: StoredImage | null }>(content, "images");
  const challenge = section<{ headline: string; body: string }>(content, "challenge");
  const quote = section<{ text: string; author: string; role: string }>(content, "quote");
  const seo = section<{ title: string; description: string }>(content, "seo");
  const features = (content.features as { title: string; body: string; image: StoredImage | null }[]) ?? [];
  const results = (content.results as { value: string; label: string }[]) ?? [];
  const theme = THEMES.some((item) => item.value === overview.theme) ? overview.theme : "surface";

  return compact({
    slug: doc.slug,
    client: overview.client,
    tags: overview.tags,
    summary: overview.summary,
    metaTitle: seo.title || `${overview.client} — Case Study | Sleeky Programmers`,
    metaDescription: seo.description || overview.summary.slice(0, 155),
    theme,
    sector: overview.sector || undefined,
    liveUrl: overview.liveUrl || undefined,
    heroImage: publicImage(images.hero),
    secondaryImage: publicImage(images.secondary),
    challenge: challenge.headline && challenge.body ? { headline: challenge.headline, body: challenge.body } : undefined,
    built: section<{ headline: string; body: string }>(content, "built"),
    features: features.map((feature) => compact({ title: feature.title, body: feature.body, image: publicImage(feature.image) })),
    results: results.length ? results.map(({ value, label }) => ({ value, label })) : undefined,
    quote: quote.text ? { text: quote.text, author: quote.author, role: quote.role } : undefined,
    services: (content.services as string[]) ?? [],
    publishedAt: (doc.publishedAt ?? doc.createdAt).toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  });
}

/** A case study as the website would show it (any status), for the CMS preview. */
export async function previewCaseStudy(id: string): Promise<(PublicCaseStudy & { status: CaseStudyStatus }) | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await caseStudies()).findOne({ _id: new ObjectId(id) });
  return doc ? { ...toPublic(doc), status: doc.status } : null;
}

/** Published case studies in website order. */
export async function listPublishedCaseStudies(): Promise<PublicCaseStudy[]> {
  const docs = await (await caseStudies()).find({ status: "published" }).sort({ position: 1 }).toArray();
  return docs.map(toPublic);
}

/** One published case study, plus the next one in order (wrapping around) for the "Next project" link. */
export async function getPublishedCaseStudy(slug: string): Promise<{ caseStudy: PublicCaseStudy; next: { slug: string; client: string } | null } | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const all = await listPublishedCaseStudies();
  const index = all.findIndex((study) => study.slug === slug);
  if (index === -1) return null;
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  return { caseStudy: all[index], next: next ? { slug: next.slug, client: next.client } : null };
}
