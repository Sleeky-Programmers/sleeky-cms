import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Article lifecycle against a real MongoDB, in a throwaway database that is
// dropped afterwards. Skipped when no MONGODB_URI is available.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const runId = Date.now().toString(36);
process.env.MONGODB_DB = `sleeky_cms_test_${runId}`;
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";
// Fake Cloudinary account so image URLs can be checked without a real one.
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "key";
process.env.CLOUDINARY_API_SECRET = "secret";

const IMAGE = "https://res.cloudinary.com/test-cloud/image/upload/v1/sleeky-cms/insights/cover.jpg";

describe.skipIf(!process.env.MONGODB_URI)("articles (MongoDB)", () => {
  let articles: typeof import("@/lib/insights/articles");
  let database: typeof import("@/lib/db");

  const editor = { id: "u1", name: "Ada Editor" };
  const other = { id: "u2", name: "Bola Admin" };
  const team = new Map([editor, other].map((person) => [person.id, person]));
  const resolveAuthor = async (id: string) => team.get(id) ?? null;

  const body = (words: string) => ({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Introduction" }] },
      { type: "paragraph", content: [{ type: "text", text: words }] },
      { type: "image", attrs: { src: IMAGE, alt: "Cover" } },
      { type: "image", attrs: { src: "https://evil.example.com/x.gif", alt: "tracker" } },
    ],
  });

  const input = (overrides: Record<string, unknown> = {}) => ({
    title: "Why every Lagos business needs automation",
    slug: "",
    excerpt: "",
    metaDescription: "",
    category: "",
    authorId: editor.id,
    coverImage: null,
    body: { type: "doc", content: [{ type: "paragraph" }] },
    ...overrides,
  });

  beforeAll(async () => {
    articles = await import("@/lib/insights/articles");
    database = await import("@/lib/db");
  });

  afterAll(async () => {
    if (!database) return;
    await database.db().dropDatabase();
    await database.mongoClient().close();
  });

  let id = "";
  let version = "";

  it("saves a draft with just a title and makes an address from it", async () => {
    const { article, slugsToRefresh } = await articles.saveArticle(input(), "save", editor, resolveAuthor);
    expect(article).toMatchObject({ status: "draft", slug: "why-every-lagos-business-needs-automation", publishedAt: null });
    expect(slugsToRefresh).toEqual([]);
    ({ id, version } = article);
    expect(await articles.listPublishedArticles()).toEqual([]);
  });

  it("won't publish until the article is complete", async () => {
    await expect(articles.saveArticle(input({ id, version }), "publish", editor, resolveAuthor)).rejects.toMatchObject({
      code: "invalid",
      fieldErrors: {
        excerpt: expect.any(String),
        category: expect.any(String),
        body: expect.any(String),
      },
    });
  });

  it("publishes a complete article, stripping outside images", async () => {
    const { article, wentLive, slugsToRefresh } = await articles.saveArticle(
      input({
        id,
        version,
        excerpt: "How small teams in Lagos save hours every week by automating invoicing and follow-ups.",
        category: "Automation",
        authorId: other.id,
        coverImage: { publicId: "sleeky-cms/insights/cover", url: IMAGE, width: 1600, height: 900, alt: "Team at work" },
        body: body("word ".repeat(400)),
      }),
      "publish",
      editor,
      resolveAuthor,
    );
    expect(wentLive).toBe(true);
    expect(slugsToRefresh).toEqual(["why-every-lagos-business-needs-automation"]);
    expect(article).toMatchObject({ status: "published", author: other, updatedBy: editor });
    expect(article.publishedAt).not.toBeNull();
    expect(JSON.stringify(article.body)).not.toContain("evil.example.com");
    version = article.version;

    const [listed] = await articles.listPublishedArticles();
    expect(listed).toMatchObject({ slug: article.slug, author: "Bola Admin", category: "Automation", readingMinutes: 2 });
    expect(listed.metaDescription).toBe(listed.excerpt.slice(0, 155));

    const full = await articles.getPublishedArticle(article.slug);
    expect(full?.html).toContain("<h2>Introduction</h2>");
    expect(full?.html).toContain(IMAGE);
    expect(full?.html).not.toContain("evil.example.com");
  });

  it("refuses a save based on an out-of-date copy", async () => {
    await expect(
      articles.saveArticle(input({ id, version: "1", excerpt: "x".repeat(30), category: "Automation", body: body("a ".repeat(100)) }), "save", other, resolveAuthor),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("updating a live article refreshes both the old and new address", async () => {
    const current = (await articles.getArticle(id))!;
    const { article, slugsToRefresh } = await articles.saveArticle(
      { ...current, authorId: current.author.id, slug: "automation-for-lagos-businesses" },
      "save",
      editor,
      resolveAuthor,
    );
    expect(article.status).toBe("published");
    expect(slugsToRefresh.sort()).toEqual(["automation-for-lagos-businesses", "why-every-lagos-business-needs-automation"]);
    expect(await articles.getPublishedArticle("why-every-lagos-business-needs-automation")).toBeNull();
    version = article.version;
  });

  it("won't delete a published article; unpublishing takes it off the website", async () => {
    await expect(articles.deleteArticle(id)).rejects.toMatchObject({ code: "published" });

    const current = (await articles.getArticle(id))!;
    const { article, slugsToRefresh } = await articles.saveArticle({ ...current, authorId: current.author.id }, "unpublish", editor, resolveAuthor);
    expect(article.status).toBe("draft");
    expect(article.publishedAt).not.toBeNull(); // first publish date is kept
    expect(slugsToRefresh).toEqual(["automation-for-lagos-businesses"]);
    expect(await articles.listPublishedArticles()).toEqual([]);

    await articles.deleteArticle(id);
    expect(await articles.getArticle(id)).toBeNull();
  });

  it("keeps addresses unique and only accepts team members as authors", async () => {
    await articles.saveArticle(input({ title: "Same title" }), "save", editor, resolveAuthor);
    await expect(articles.saveArticle(input({ title: "Same title" }), "save", editor, resolveAuthor)).rejects.toMatchObject({
      code: "slug-taken",
      fieldErrors: { slug: expect.any(String) },
    });
    await expect(articles.saveArticle(input({ title: "Other", authorId: "ghost" }), "save", editor, resolveAuthor)).rejects.toMatchObject({
      fieldErrors: { authorId: expect.any(String) },
    });
  });

  it("rejects cover images that weren't uploaded through the CMS", async () => {
    await expect(
      articles.saveArticle(
        input({ title: "Cover test", coverImage: { publicId: "x", url: "https://evil.example.com/x.jpg", width: 10, height: 10, alt: "x" } }),
        "save",
        editor,
        resolveAuthor,
      ),
    ).rejects.toMatchObject({ code: "invalid", fieldErrors: { coverImage: expect.any(String) } });
  });
});
