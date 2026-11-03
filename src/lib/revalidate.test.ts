import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The website ping: headers, and failures that must be reported rather than
// silently counted as success (e.g. Vercel's login page on a protected preview).

const settings: Record<string, string | undefined> = {};
vi.mock("./env", () => ({ env: () => settings }));

const { refreshWebsite } = await import("./revalidate");

describe("refreshWebsite", () => {
  const fetchMock = vi.fn();
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    Object.assign(settings, {
      WEBSITE_REVALIDATE_URL: "https://site.example/api/revalidate",
      REVALIDATE_SECRET: "a-shared-secret-of-some-length",
      WEBSITE_PROTECTION_BYPASS: undefined,
    });
  });
  afterEach(() => {
    fetchMock.mockReset();
    errorLog.mockClear();
    vi.unstubAllGlobals();
  });

  it("does nothing until it's set up", async () => {
    settings.WEBSITE_REVALIDATE_URL = undefined;
    await refreshWebsite(["home"], "pages");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the type, slugs and secret, without following redirects", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await refreshWebsite(["home"], "pages");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://site.example/api/revalidate");
    expect(init).toMatchObject({ method: "POST", redirect: "manual", body: JSON.stringify({ type: "pages", slugs: ["home"] }) });
    expect(init.headers).toMatchObject({ Authorization: "Bearer a-shared-secret-of-some-length" });
    expect(init.headers).not.toHaveProperty("x-vercel-protection-bypass");
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("adds Vercel's protection bypass header when set", async () => {
    settings.WEBSITE_PROTECTION_BYPASS = "bypass-secret";
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await refreshWebsite(["votely"], "case-studies");
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "x-vercel-protection-bypass": "bypass-secret" });
  });

  it("reports a ping stopped by Vercel's login instead of treating it as success", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://vercel.com/sso-api?url=x" } }));
    await refreshWebsite(["home"], "pages");
    expect(errorLog).toHaveBeenCalledWith(expect.stringMatching(/302.*WEBSITE_PROTECTION_BYPASS/));
  });

  it("explains a wrong secret or address", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 })).mockResolvedValueOnce(new Response("", { status: 404 }));
    await refreshWebsite(["home"], "pages");
    await refreshWebsite(["home"], "pages");
    expect(errorLog.mock.calls.map((call) => call[0])).toEqual([
      expect.stringMatching(/401.*REVALIDATE_SECRET/),
      expect.stringMatching(/404.*WEBSITE_REVALIDATE_URL/),
    ]);
  });
});
