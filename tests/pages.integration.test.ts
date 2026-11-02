import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Page content lifecycle against a real MongoDB, in a throwaway database that
// is dropped afterwards. Skipped when no MONGODB_URI is available.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const runId = Date.now().toString(36);
process.env.MONGODB_DB = `sleeky_cms_test_${runId}`;
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";

describe.skipIf(!process.env.MONGODB_URI)("pages (MongoDB)", () => {
  let store: typeof import("@/lib/pages/store");
  let database: typeof import("@/lib/db");
  const editor = { id: "u1", name: "Ada Editor" };
  const other = { id: "u2", name: "Bola Admin" };

  beforeAll(async () => {
    store = await import("@/lib/pages/store");
    database = await import("@/lib/db");
  });

  afterAll(async () => {
    if (!database) return;
    await database.db().dropDatabase();
    await database.mongoClient().close();
  });

  it("starts every page with the website's original text", async () => {
    const home = await store.getPage("home");
    expect(home).toMatchObject({ customised: false, version: store.DEFAULT_VERSION, updatedBy: null });
    expect((home!.values.hero as { headline: string }).headline).toBe("Software\nthat *grows*\nyour business.");
    expect(await store.getPage("does-not-exist")).toBeNull();
  });

  it("saves edits, refuses stale saves, and resets to the original", async () => {
    const original = (await store.getPage("home"))!;
    const hero = { ...(original.values.hero as Record<string, string>), intro: "  New introduction for the homepage.  " };

    const saved = await store.savePage("home", { ...original.values, hero }, original.version, editor);
    expect(saved.customised).toBe(true);
    expect(saved.updatedBy).toEqual(editor);
    expect((saved.values.hero as { intro: string }).intro).toBe("New introduction for the homepage.");

    // Someone still holding the original version can't overwrite it.
    await expect(store.savePage("home", original.values, original.version, other)).rejects.toMatchObject({ code: "conflict" });

    const listed = (await store.listPages()).find((page) => page.key === "home");
    expect(listed).toMatchObject({ customised: true, updatedBy: editor, title: "Homepage" });

    // A renamed service shows its new name in the list.
    const branding = (await store.getPage("service-branding"))!;
    const listing = { ...(branding.values.listing as Record<string, string>), name: "Brand Identity" };
    await store.savePage("service-branding", { ...branding.values, listing }, branding.version, editor);
    expect((await store.listPages()).find((page) => page.key === "service-branding")?.title).toBe("Brand Identity");

    await expect(store.resetPage("home", original.version)).rejects.toMatchObject({ code: "conflict" });
    const reset = await store.resetPage("home", saved.version);
    expect(reset).toMatchObject({ customised: false, version: store.DEFAULT_VERSION });
    expect((reset.values.hero as { intro: string }).intro).toBe((original.values.hero as { intro: string }).intro);
  });

  it("rejects invalid content with field errors", async () => {
    const site = (await store.getPage("site"))!;
    const contact = { ...(site.values.contact as Record<string, string>), email: "nope", whatsappNumber: "+234 916" };
    await expect(store.savePage("site", { ...site.values, contact }, site.version, editor)).rejects.toMatchObject({
      code: "invalid",
      fieldErrors: { "contact.email": expect.any(String), "contact.whatsappNumber": expect.any(String) },
    });
  });

  it("serves pages to the website with rich text as HTML", async () => {
    const privacy = await store.getPublicPage("privacy-policy");
    expect(privacy?.content.intro).toBeTypeOf("string");
    expect((privacy?.content.body as { html: string }).html).toContain("<h2>Who we are</h2>");

    const service = await store.getPublicPage("service-websites");
    expect(service?.content.listing).toEqual({ name: "Websites", summary: expect.any(String) });

    const index = await store.listPublicPages();
    expect(index.map((page) => page.key)).toContain("service-branding");
  });
});
