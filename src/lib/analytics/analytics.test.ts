import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const settings: Record<string, string | undefined> = {};
vi.mock("../env", () => ({ env: () => settings }));

const { AnalyticsError, analyticsConfig, parseServiceAccount, runReport, toReport } = await import("./google");
const { buildDashboard, dateRanges, dayKey, FORM_STEPS, isComplete } = await import("./reports");

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const keyFile = {
  type: "service_account",
  client_email: "cms-analytics@sleeky.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

/** A GA4 response: dimension values and metric values as strings, as the API sends them. */
const gaRows = (dimensions: string[], metrics: string[], rows: [string[], number[]][]) => ({
  dimensionHeaders: dimensions.map((name) => ({ name })),
  metricHeaders: metrics.map((name) => ({ name })),
  rows: rows.map(([dims, values]) => ({ dimensionValues: dims.map((value) => ({ value })), metricValues: values.map((value) => ({ value: String(value) })) })),
});

describe("settings", () => {
  beforeEach(() => {
    settings.GA4_PROPERTY_ID = "123456789";
    settings.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify(keyFile);
  });

  it("is 'not configured' until both settings are present", () => {
    settings.GOOGLE_SERVICE_ACCOUNT_JSON = undefined;
    expect(() => analyticsConfig()).toThrow(expect.objectContaining({ code: "not-configured" }));
  });

  it("explains when the G-… measurement ID is used instead of the property ID", () => {
    settings.GA4_PROPERTY_ID = "G-ZE8VEQX7MV";
    expect(() => analyticsConfig()).toThrow(/measurement ID \(G-ZE8VEQX7MV\).*numeric Property ID/);
  });

  it("accepts the key file as JSON or base64, with escaped line breaks", () => {
    const oneLine = JSON.stringify({ ...keyFile, private_key: keyFile.private_key.replace(/\n/g, "\\n") });
    expect(parseServiceAccount(oneLine).private_key).toBe(keyFile.private_key);
    expect(parseServiceAccount(Buffer.from(JSON.stringify(keyFile)).toString("base64")).client_email).toBe(keyFile.client_email);
    expect(() => parseServiceAccount("{not json")).toThrow(AnalyticsError);
    expect(() => parseServiceAccount(JSON.stringify({ client_email: "x" }))).toThrow(/missing client_email or private_key/);
  });
});

describe("Google sign-in and reports", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("signs a valid token request with the service account key, then runs the report", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    global.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      calls.push({ url: String(input), init });
      if (String(input).includes("oauth2.googleapis.com")) return json({ access_token: "token-1", expires_in: 3600 });
      return json(gaRows(["country"], ["activeUsers"], [[["Nigeria"], [42]]]));
    }) as unknown as typeof fetch;

    const config = { propertyId: "123456789", account: parseServiceAccount(JSON.stringify({ ...keyFile, client_email: "signer@test.iam" })) };
    const report = await runReport(config, { metrics: [{ name: "activeUsers" }], dimensions: [{ name: "country" }] });
    expect(report.rows).toEqual([{ dimensions: ["Nigeria"], metrics: [42] }]);

    // The JWT is signed with the private key and asks only for read access.
    const assertion = new URLSearchParams(calls[0].init.body as URLSearchParams).get("assertion")!;
    const [header, claims, signature] = assertion.split(".");
    expect(createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, signature, "base64url")).toBe(true);
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toMatchObject({
      iss: "signer@test.iam",
      scope: "https://www.googleapis.com/auth/analytics.readonly",
    });
    expect(calls[1].url).toBe("https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport");
    expect((calls[1].init.headers as Record<string, string>).Authorization).toBe("Bearer token-1");
  });

  it("explains missing access and unregistered custom dimensions", async () => {
    const config = { propertyId: "123", account: parseServiceAccount(JSON.stringify({ ...keyFile, client_email: "errors@test.iam" })) };
    const respond = (status: number, message: string) =>
      (global.fetch = vi.fn(async (input: string | URL | Request) =>
        String(input).includes("oauth2") ? json({ access_token: "t", expires_in: 3600 }) : json({ error: { message } }, status),
      ) as unknown as typeof fetch);

    respond(403, "User does not have sufficient permissions for this property.");
    await expect(runReport(config, { metrics: [{ name: "sessions" }] })).rejects.toMatchObject({ code: "no-access", message: expect.stringContaining("errors@test.iam") });

    respond(400, "Field customEvent:location is not a valid dimension.");
    await expect(runReport(config, { metrics: [{ name: "eventCount" }] })).rejects.toMatchObject({ code: "unknown-dimension" });
  });

  it("turns string values into numbers", () => {
    expect(toReport(gaRows(["date"], ["activeUsers"], [[["20261105"], [7]]])).rows[0]).toEqual({ dimensions: ["20261105"], metrics: [7] });
    expect(toReport({}).rows).toEqual([]);
  });
});

describe("the dashboard", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("uses this period and the one before", () => {
    expect(dateRanges("7d")).toEqual({
      current: { startDate: "6daysAgo", endDate: "today" },
      previous: { startDate: "13daysAgo", endDate: "7daysAgo" },
    });
  });

  it("builds every section from the reports, and keeps going when custom dimensions are missing", async () => {
    const today = dayKey(new Date());
    global.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      if (String(input).includes("oauth2")) return json({ access_token: "t", expires_in: 3600 });
      const body = JSON.parse(String(init.body));
      const dims: string[] = (body.dimensions ?? []).map((d: { name: string }) => d.name);
      const metrics: string[] = body.metrics.map((m: { name: string }) => m.name);
      const event = body.dimensionFilter?.filter?.stringFilter?.value;
      if (dims.some((name) => name.startsWith("customEvent:")) && !dims.includes("customEvent:step_name")) {
        return json({ error: { message: `Field ${dims.find((n) => n.startsWith("customEvent:"))} is not a valid dimension.` } }, 400);
      }
      if (body.dateRanges.length === 2 && event === "generate_lead") {
        return json(gaRows(["dateRange"], metrics, [[["date_range_0"], [3]], [["date_range_1"], [1]]]));
      }
      if (body.dateRanges.length === 2) {
        return json(gaRows(["dateRange"], metrics, [[["date_range_0"], [120, 90, 150, 400, 95.5, 0.62]], [["date_range_1"], [100, 80, 130, 380, 80, 0.6]]]));
      }
      if (dims[0] === "date") return json(gaRows(dims, metrics, [[[today], event === "generate_lead" ? [2] : [17]]]));
      if (dims[0] === "customEvent:step_name") return json(gaRows(dims, metrics, [[["Services"], [40]], [["Contact"], [9]], [["Your project"], [25]]]));
      if (event === "generate_lead") return json(gaRows([], metrics, [[[], [6]]]));
      if (dims[0] === "pagePath") return json(gaRows(dims, metrics, [[["/", "Home"], [300, 110]]]));
      return json(gaRows(dims, metrics, [[["Organic Search"], [80]]]));
    }) as unknown as typeof fetch;

    const config = { propertyId: "123", account: parseServiceAccount(JSON.stringify({ ...keyFile, client_email: "dashboard@test.iam" })) };
    const dashboard = await buildDashboard(config, "7d");

    expect(dashboard.totals).toEqual({
      ok: true,
      data: {
        current: { visitors: 120, newVisitors: 90, sessions: 150, pageViews: 400, averageSessionSeconds: 95.5, engagementRate: 0.62, briefs: 3 },
        previous: { visitors: 100, newVisitors: 80, sessions: 130, pageViews: 380, averageSessionSeconds: 80, engagementRate: 0.6, briefs: 1 },
      },
    });
    // Every day of the period is present, including ones with no data.
    expect(dashboard.trend.ok && dashboard.trend.data).toHaveLength(7);
    expect(dashboard.trend.ok && dashboard.trend.data.at(-1)).toMatchObject({ visitors: 17, briefs: 2 });
    // Form steps in the form's order, then briefs sent.
    expect(dashboard.funnel.ok && dashboard.funnel.data).toEqual([
      ...FORM_STEPS.map((step) => ({ step, people: { Services: 40, "Your project": 25, Timeline: 0, Contact: 9 }[step] })),
      { step: "Brief sent", people: 6 },
    ]);
    expect(dashboard.pages.ok && dashboard.pages.data[0]).toEqual({ path: "/", title: "Home", views: 300, visitors: 110 });
    // Reports that need the custom dimensions say so instead of failing the page.
    expect(dashboard.buttons).toEqual({ ok: false, needsDimensions: true, message: expect.stringContaining("custom dimensions") });
    expect(dashboard.scroll.ok).toBe(false);
    // Missing custom dimensions don't stop the dashboard being kept; other failures do.
    expect(isComplete(dashboard)).toBe(true);
    expect(isComplete({ ...dashboard, pages: { ok: false, message: "Network error" } })).toBe(false);
  });
});
