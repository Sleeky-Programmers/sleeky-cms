import { AnalyticsError, analyticsConfig, runRealtimeReport, runReport, type AnalyticsConfig, type Report, type ReportRequest } from "./google";

// Builds the Analytics page from GA4 reports. Results are kept for a few minutes
// so moving around the CMS doesn't spend Google's API quota.

export const RANGES = { "7d": 7, "28d": 28, "90d": 90 } as const;
export type RangeKey = keyof typeof RANGES;
export const isRange = (value: unknown): value is RangeKey => typeof value === "string" && value in RANGES;

/**
 * Event parameters the website sends that GA4 only reports on once they're
 * registered as custom dimensions (Admin → Custom definitions). Data is only
 * collected from the moment each one is registered.
 */
export const CUSTOM_DIMENSIONS = [
  { parameter: "location", name: "Click location", description: "Section of the page a button or link was in (hero, footer, nav…)" },
  { parameter: "label", name: "Button label", description: "Text of the clicked button or link" },
  { parameter: "link_type", name: "Link type", description: "whatsapp, phone, email, internal, external or button" },
  { parameter: "step_name", name: "Form step", description: "Start a project form step" },
  { parameter: "percent", name: "Scroll depth", description: "25, 50, 75 or 90 percent of the page" },
] as const;

/** Form steps in order (sleeky-website: src/components/forms/briefOptions.ts). */
export const FORM_STEPS = ["Services", "Your project", "Timeline", "Contact"];

export type Section<T> = { ok: true; data: T } | { ok: false; message: string; needsDimensions?: boolean };

export type Totals = {
  visitors: number;
  newVisitors: number;
  sessions: number;
  pageViews: number;
  averageSessionSeconds: number;
  engagementRate: number;
  briefs: number;
};

export type Dashboard = {
  range: RangeKey;
  fetchedAt: string;
  totals: Section<{ current: Totals; previous: Totals }>;
  trend: Section<{ date: string; visitors: number; briefs: number }[]>;
  pages: Section<{ path: string; title: string; views: number; visitors: number }[]>;
  channels: Section<{ name: string; sessions: number }[]>;
  sources: Section<{ name: string; sessions: number }[]>;
  devices: Section<{ name: string; visitors: number }[]>;
  countries: Section<{ name: string; visitors: number }[]>;
  events: Section<{ name: string; count: number }[]>;
  contactClicks: Section<{ type: string; location: string; count: number }[]>;
  buttons: Section<{ label: string; location: string; count: number }[]>;
  funnel: Section<{ step: string; people: number }[]>;
  scroll: Section<{ path: string; depth: Record<string, number> }[]>;
};

export type Realtime = { fetchedAt: string; visitors: number; pages: { name: string; visitors: number }[]; countries: { name: string; visitors: number }[] };

// ---------- Date ranges ----------

/** GA4 relative dates: the last N days including today, and the N days before. */
export function dateRanges(range: RangeKey) {
  const days = RANGES[range];
  return {
    current: { startDate: `${days - 1}daysAgo`, endDate: "today" },
    previous: { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` },
  };
}

// ---------- Small helpers ----------

const metric = (name: string) => ({ name });
const dimension = (name: string) => ({ name });
const byMetricDesc = (name: string) => ({ metric: { metricName: name }, desc: true });
const eventIs = (...names: string[]) =>
  names.length === 1
    ? { filter: { fieldName: "eventName", stringFilter: { value: names[0] } } }
    : { filter: { fieldName: "eventName", inListFilter: { values: names } } };

/** With two date ranges, GA adds a "dateRange" dimension (date_range_0 = first range). */
function splitByDateRange(report: Report) {
  const index = report.dimensionHeaders.indexOf("dateRange");
  const pick = (key: string) => report.rows.find((row) => (index === -1 ? key === "date_range_0" : row.dimensions[index] === key));
  return { current: pick("date_range_0"), previous: pick("date_range_1") };
}

/** GA reports days in the property's time zone (Lagos for Sleeky; GA4_TIME_ZONE to change). */
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.GA4_TIME_ZONE || "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });
export const dayKey = (date: Date) => dayFormat.format(date).replace(/-/g, "");

/** "20261105" → "2026-11-05" */
const isoDate = (value: string) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

async function section<T>(load: () => Promise<T>): Promise<Section<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      if (error.code === "unknown-dimension") {
        return { ok: false, needsDimensions: true, message: "Needs the custom dimensions registered in Google Analytics (see Setup)." };
      }
      // Problems with the connection itself apply to the whole page.
      if (["not-configured", "bad-property", "bad-key", "no-access"].includes(error.code)) throw error;
      return { ok: false, message: error.message };
    }
    console.error("Analytics report failed", error);
    return { ok: false, message: "This report couldn't be loaded." };
  }
}

// ---------- The dashboard ----------

export async function buildDashboard(config: AnalyticsConfig, range: RangeKey): Promise<Dashboard> {
  const { current, previous } = dateRanges(range);
  const report = (body: ReportRequest) => runReport(config, { dateRanges: [current], ...body });
  const limit = (count: number) => ({ limit: count });

  const [totals, trend, pages, channels, sources, devices, countries, events, contactClicks, buttons, funnel, scroll] = await Promise.all([
    section(async () => {
      const [main, briefs] = await Promise.all([
        runReport(config, {
          dateRanges: [current, previous],
          metrics: ["activeUsers", "newUsers", "sessions", "screenPageViews", "averageSessionDuration", "engagementRate"].map(metric),
        }),
        runReport(config, { dateRanges: [current, previous], metrics: [metric("eventCount")], dimensionFilter: eventIs("generate_lead") }),
      ]);
      const mainRows = splitByDateRange(main);
      const briefRows = splitByDateRange(briefs);
      const totalsFrom = (values: number[] | undefined, briefCount: number | undefined): Totals => ({
        visitors: values?.[0] ?? 0,
        newVisitors: values?.[1] ?? 0,
        sessions: values?.[2] ?? 0,
        pageViews: values?.[3] ?? 0,
        averageSessionSeconds: values?.[4] ?? 0,
        engagementRate: values?.[5] ?? 0,
        briefs: briefCount ?? 0,
      });
      return {
        current: totalsFrom(mainRows.current?.metrics, briefRows.current?.metrics[0]),
        previous: totalsFrom(mainRows.previous?.metrics, briefRows.previous?.metrics[0]),
      };
    }),
    section(async () => {
      const [visitors, briefs] = await Promise.all([
        report({ dimensions: [dimension("date")], metrics: [metric("activeUsers")], orderBys: [{ dimension: { dimensionName: "date" } }] }),
        report({ dimensions: [dimension("date")], metrics: [metric("eventCount")], dimensionFilter: eventIs("generate_lead") }),
      ]);
      const briefsByDate = new Map(briefs.rows.map((row) => [row.dimensions[0], row.metrics[0]]));
      // GA leaves out days with no data; fill them so the chart has every day.
      const days = RANGES[range];
      const byDate = new Map(visitors.rows.map((row) => [row.dimensions[0], row.metrics[0]]));
      return Array.from({ length: days }, (_, index) => {
        const key = dayKey(new Date(Date.now() - (days - 1 - index) * 86_400_000));
        return { date: isoDate(key), visitors: byDate.get(key) ?? 0, briefs: briefsByDate.get(key) ?? 0 };
      });
    }),
    section(async () =>
      (
        await report({
          dimensions: [dimension("pagePath"), dimension("pageTitle")],
          metrics: [metric("screenPageViews"), metric("activeUsers")],
          orderBys: [byMetricDesc("screenPageViews")],
          ...limit(12),
        })
      ).rows.map((row) => ({ path: row.dimensions[0], title: row.dimensions[1], views: row.metrics[0], visitors: row.metrics[1] })),
    ),
    section(async () =>
      (await report({ dimensions: [dimension("sessionDefaultChannelGroup")], metrics: [metric("sessions")], orderBys: [byMetricDesc("sessions")], ...limit(8) })).rows.map(
        (row) => ({ name: row.dimensions[0], sessions: row.metrics[0] }),
      ),
    ),
    section(async () =>
      (await report({ dimensions: [dimension("sessionSource")], metrics: [metric("sessions")], orderBys: [byMetricDesc("sessions")], ...limit(8) })).rows.map((row) => ({
        name: row.dimensions[0],
        sessions: row.metrics[0],
      })),
    ),
    section(async () =>
      (await report({ dimensions: [dimension("deviceCategory")], metrics: [metric("activeUsers")], orderBys: [byMetricDesc("activeUsers")] })).rows.map((row) => ({
        name: row.dimensions[0],
        visitors: row.metrics[0],
      })),
    ),
    section(async () =>
      (await report({ dimensions: [dimension("country")], metrics: [metric("activeUsers")], orderBys: [byMetricDesc("activeUsers")], ...limit(8) })).rows.map((row) => ({
        name: row.dimensions[0],
        visitors: row.metrics[0],
      })),
    ),
    section(async () =>
      (await report({ dimensions: [dimension("eventName")], metrics: [metric("eventCount")], orderBys: [byMetricDesc("eventCount")], ...limit(30) })).rows.map((row) => ({
        name: row.dimensions[0],
        count: row.metrics[0],
      })),
    ),
    section(async () =>
      (
        await report({
          dimensions: [dimension("eventName"), dimension("customEvent:location")],
          metrics: [metric("eventCount")],
          dimensionFilter: eventIs("whatsapp_click", "phone_click", "email_click"),
          orderBys: [byMetricDesc("eventCount")],
          ...limit(30),
        })
      ).rows.map((row) => ({ type: row.dimensions[0].replace(/_click$/, ""), location: row.dimensions[1], count: row.metrics[0] })),
    ),
    section(async () =>
      (
        await report({
          dimensions: [dimension("customEvent:label"), dimension("customEvent:location")],
          metrics: [metric("eventCount")],
          dimensionFilter: eventIs("button_click"),
          orderBys: [byMetricDesc("eventCount")],
          ...limit(25),
        })
      ).rows.map((row) => ({ label: row.dimensions[0], location: row.dimensions[1], count: row.metrics[0] })),
    ),
    section(async () => {
      const [steps, briefs] = await Promise.all([
        report({ dimensions: [dimension("customEvent:step_name")], metrics: [metric("totalUsers")], dimensionFilter: eventIs("form_step") }),
        report({ metrics: [metric("totalUsers")], dimensionFilter: eventIs("generate_lead") }),
      ]);
      const byStep = new Map(steps.rows.map((row) => [row.dimensions[0], row.metrics[0]]));
      return [...FORM_STEPS.map((step) => ({ step, people: byStep.get(step) ?? 0 })), { step: "Brief sent", people: briefs.rows[0]?.metrics[0] ?? 0 }];
    }),
    section(async () => {
      const rows = (
        await report({
          dimensions: [dimension("pagePath"), dimension("customEvent:percent")],
          metrics: [metric("totalUsers")],
          dimensionFilter: eventIs("scroll_depth"),
          ...limit(200),
        })
      ).rows;
      const byPage = new Map<string, Record<string, number>>();
      for (const row of rows) {
        const depth = byPage.get(row.dimensions[0]) ?? {};
        depth[row.dimensions[1]] = row.metrics[0];
        byPage.set(row.dimensions[0], depth);
      }
      return [...byPage.entries()]
        .map(([path, depth]) => ({ path, depth }))
        .sort((a, b) => (b.depth["25"] ?? 0) - (a.depth["25"] ?? 0))
        .slice(0, 10);
    }),
  ]);

  return { range, fetchedAt: new Date().toISOString(), totals, trend, pages, channels, sources, devices, countries, events, contactClicks, buttons, funnel, scroll };
}

export async function buildRealtime(config: AnalyticsConfig): Promise<Realtime> {
  const [total, pages, countries] = await Promise.all([
    runRealtimeReport(config, { metrics: [metric("activeUsers")] }),
    runRealtimeReport(config, { dimensions: [dimension("unifiedScreenName")], metrics: [metric("activeUsers")], orderBys: [byMetricDesc("activeUsers")], limit: 8 }),
    runRealtimeReport(config, { dimensions: [dimension("country")], metrics: [metric("activeUsers")], orderBys: [byMetricDesc("activeUsers")], limit: 5 }),
  ]);
  return {
    fetchedAt: new Date().toISOString(),
    visitors: total.rows[0]?.metrics[0] ?? 0,
    pages: pages.rows.map((row) => ({ name: row.dimensions[0], visitors: row.metrics[0] })),
    countries: countries.rows.map((row) => ({ name: row.dimensions[0], visitors: row.metrics[0] })),
  };
}

// ---------- Cached entry points for the page ----------

const DASHBOARD_TTL = 5 * 60_000;
const REALTIME_TTL = 30_000;
const cache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

function cached<T>(key: string, ttl: number, load: () => Promise<T>, keep: (value: T) => boolean = () => true): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { expiresAt: Date.now() + ttl, value });
  // Failures aren't kept, so the next visit tries again.
  value.then((result) => !keep(result) && cache.delete(key)).catch(() => cache.delete(key));
  return value;
}

/** A dashboard is kept only if every report loaded (or just needs the custom dimensions set up). */
export const isComplete = (dashboard: Dashboard) =>
  Object.values(dashboard).every((part) => typeof part !== "object" || part === null || !("ok" in part) || part.ok || part.needsDimensions);

export function getDashboard(range: RangeKey) {
  const config = analyticsConfig();
  return cached(`dashboard:${config.propertyId}:${range}`, DASHBOARD_TTL, () => buildDashboard(config, range), isComplete);
}

export function getRealtime() {
  const config = analyticsConfig();
  return cached(`realtime:${config.propertyId}`, REALTIME_TTL, () => buildRealtime(config));
}
