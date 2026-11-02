import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Case study lifecycle against a real MongoDB, in a throwaway database that is
// dropped afterwards. Skipped when no MONGODB_URI is available.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const runId = Date.now().toString(36);
process.env.MONGODB_DB = `sleeky_cms_test_${runId}`;
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";

describe.skipIf(!process.env.MONGODB_URI)("case studies (MongoDB)", () => {
  let store: typeof import("@/lib/case-studies/store");
  let database: typeof import("@/lib/db");
  const editor = { id: "u1", name: "Ada Editor" };
  const other = { id: "u2", name: "Bola Admin" };

  beforeAll(async () => {
    store = await import("@/lib/case-studies/store");
    database = await import("@/lib/db");
  });

  afterAll(async () => {
    if (!database) return;
    await database.db().dropDatabase();
    await database.mongoClient().close();
  });

  it("imports the website's case studies once, published and in order", async () => {
    expect(await store.importWebsiteCaseStudies(editor)).toEqual(["votely", "straitpay", "tiqwa-travels"]);
    expect(await store.importWebsiteCaseStudies(editor)).toEqual([]);

    const published = await store.listPublishedCaseStudies();
    expect(published.map((study) => study.slug)).toEqual(["votely", "straitpay", "tiqwa-travels"]);
    // Same shape as the website's CaseStudy: empty optional sections are left out.
    expect(published[0]).toMatchObject({ client: "Votely", theme: "surface", liveUrl: "https://app.votely.com.ng", services: ["web-apps"] });
    expect(published[0]).not.toHaveProperty("challenge");
    expect(published[0]).not.toHaveProperty("heroImage");
    expect(published[1]).not.toHaveProperty("liveUrl");

    const detail = await store.getPublishedCaseStudy("tiqwa-travels");
    expect(detail?.next).toEqual({ slug: "votely", client: "Votely" });
  });

  it("keeps drafts off the website until published, with the publishing checks", async () => {
    const content = store.emptyCaseStudyContent();
    (content.overview as Record<string, unknown>).client = "Acme Logistics";
    const { caseStudy: draft } = await store.saveCaseStudy({ slug: "", content }, "save", editor);
    expect(draft).toMatchObject({ slug: "acme-logistics", status: "draft" });
    expect(await store.getPublishedCaseStudy("acme-logistics")).toBeNull();

    await expect(store.saveCaseStudy({ ...draft, content: draft.content }, "publish", editor)).rejects.toMatchObject({
      code: "invalid",
      fieldErrors: expect.objectContaining({ "built.headline": expect.any(String) }),
    });

    const ready = {
      ...draft.content,
      overview: { ...(draft.content.overview as object), summary: "Route planning for a delivery fleet in Lagos.", tags: ["Web app"] },
      built: { headline: "Routes in minutes.", body: "A planner that assigns deliveries to drivers." },
    };
    const { caseStudy: live, slugsToRefresh, wentLive } = await store.saveCaseStudy({ ...draft, content: ready }, "publish", editor);
    expect(wentLive).toBe(true);
    expect(slugsToRefresh).toEqual(["acme-logistics"]);
    expect(live.status).toBe("published");

    // Someone still holding the draft version can't overwrite it.
    await expect(store.saveCaseStudy({ ...draft, content: ready }, "save", other)).rejects.toMatchObject({ code: "conflict" });

    // New case studies go to the end; published ones can't be deleted.
    expect((await store.listPublishedCaseStudies()).at(-1)?.slug).toBe("acme-logistics");
    await expect(store.deleteCaseStudy(live.id)).rejects.toMatchObject({ code: "published" });

    const { caseStudy: unpublished } = await store.saveCaseStudy({ ...live }, "unpublish", editor);
    await store.deleteCaseStudy(unpublished.id);
    expect(await store.getCaseStudy(unpublished.id)).toBeNull();
  });

  it("refuses an address another case study uses", async () => {
    const content = store.emptyCaseStudyContent();
    (content.overview as Record<string, unknown>).client = "Votely";
    await expect(store.saveCaseStudy({ slug: "votely", content }, "save", editor)).rejects.toMatchObject({
      code: "slug-taken",
      fieldErrors: { slug: expect.any(String) },
    });
  });

  it("reorders case studies", async () => {
    const [votely] = await store.listCaseStudies();
    expect(await store.moveCaseStudy(votely.id, "up")).toEqual([]);
    expect(await store.moveCaseStudy(votely.id, "down")).toEqual(["votely", "straitpay"]);
    expect((await store.listCaseStudies()).map((study) => study.slug)).toEqual(["straitpay", "votely", "tiqwa-travels"]);
  });
});
