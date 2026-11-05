import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { BarList } from "@/components/analytics/BarList";
import { RefreshButton } from "@/components/analytics/RefreshButton";
import { TrendChart } from "@/components/analytics/TrendChart";
import { AnalyticsError } from "@/lib/analytics/google";
import { CUSTOM_DIMENSIONS, getDashboard, getRealtime, isRange, RANGES, type Dashboard, type RangeKey, type Realtime, type Section, type Totals } from "@/lib/analytics/reports";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Analytics" };

const RANGE_LABELS: Record<RangeKey, string> = { "7d": "Last 7 days", "28d": "Last 28 days", "90d": "Last 90 days" };
const time = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });

export default function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Website</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Analytics</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Visitors, clicks, scrolling and briefs on sleekyprogrammers.com, from Google Analytics. Only visitors who accept cookies are counted.
        </p>
      </div>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AnalyticsContent({ searchParams }: Pick<PageProps<"/analytics">, "searchParams">) {
  await requireUser();
  // Live data: only ever fetched for a real request, never during prerendering.
  await connection();
  const params = await searchParams;
  const range: RangeKey = isRange(params.range) ? params.range : "28d";

  let dashboard: Dashboard;
  try {
    dashboard = await getDashboard(range);
  } catch (error) {
    if (error instanceof AnalyticsError) return <Setup problem={error} />;
    throw error;
  }
  // "Right now" is a bonus: if it fails, the rest of the page still shows.
  const realtime = await getRealtime().catch(() => null);
  const propertyId = env().GA4_PROPERTY_ID?.trim();
  const needsDimensions = [dashboard.contactClicks, dashboard.buttons, dashboard.funnel, dashboard.scroll].some((part) => !part.ok && part.needsDimensions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Period" className="flex flex-wrap gap-2">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <Link
              key={key}
              href={`/analytics?range=${key}`}
              aria-current={key === range ? "page" : undefined}
              className="rounded-full border border-slate px-4 py-2 text-sm font-semibold text-soft transition-colors hover:text-white aria-[current=page]:border-green aria-[current=page]:bg-green-deep aria-[current=page]:text-green"
            >
              {RANGE_LABELS[key]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Updated {time.format(new Date(dashboard.fetchedAt))}</span>
          <RefreshButton />
          {propertyId && (
            <a href={`https://analytics.google.com/analytics/web/#/p${propertyId}/reports/intelligenthome`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green hover:text-green-hover">
              Open Google Analytics
            </a>
          )}
        </div>
      </div>

      {needsDimensions && <DimensionsNotice />}

      <RealtimeCard realtime={realtime} />

      <SectionCard title="Overview" subtitle={`${RANGE_LABELS[range]}, compared with the ${RANGES[range]} days before`} part={dashboard.totals}>
        {(totals) => <Overview current={totals.current} previous={totals.previous} />}
      </SectionCard>

      <SectionCard title="Visitors and briefs per day" part={dashboard.trend}>
        {(points) => <TrendChart points={points} />}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Start a project form" subtitle="People reaching each step, and sending a brief" part={dashboard.funnel}>
          {(steps) => <Funnel steps={steps} />}
        </SectionCard>
        <SectionCard title="WhatsApp, phone and email clicks" subtitle="By where on the site they were clicked" part={dashboard.contactClicks}>
          {(clicks) => <BarList unit="clicks" items={clicks.map((click) => ({ label: CONTACT_LABELS[click.type] ?? capitalise(click.type), detail: click.location, value: click.count }))} />}
        </SectionCard>
      </div>

      <SectionCard title="Buttons and links clicked" subtitle="Every button and link, with the section it's in" part={dashboard.buttons}>
        {(buttons) => <BarList unit="clicks" items={buttons.map((button) => ({ label: button.label, detail: button.location, value: button.count }))} />}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Top pages" part={dashboard.pages}>
          {(pages) => <BarList unit="views" items={pages.map((page) => ({ label: page.path, detail: `${page.visitors.toLocaleString()} visitors`, value: page.views }))} />}
        </SectionCard>
        <SectionCard title="How far people scroll" subtitle="Visitors reaching each depth, by page" part={dashboard.scroll}>
          {(rows) => <ScrollTable rows={rows} />}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Channels" subtitle="Sessions" part={dashboard.channels}>
          {(rows) => <BarList unit="sessions" items={rows.map((row) => ({ label: row.name, value: row.sessions }))} />}
        </SectionCard>
        <SectionCard title="Sources" subtitle="Sessions" part={dashboard.sources}>
          {(rows) => <BarList unit="sessions" items={rows.map((row) => ({ label: row.name, value: row.sessions }))} />}
        </SectionCard>
        <SectionCard title="Devices" subtitle="Visitors" part={dashboard.devices}>
          {(rows) => <BarList unit="visitors" items={rows.map((row) => ({ label: capitalise(row.name), value: row.visitors }))} />}
        </SectionCard>
        <SectionCard title="Countries" subtitle="Visitors" part={dashboard.countries}>
          {(rows) => <BarList unit="visitors" items={rows.map((row) => ({ label: row.name, value: row.visitors }))} />}
        </SectionCard>
      </div>

      <SectionCard title="All events" subtitle="Everything the website records, by count" part={dashboard.events}>
        {(rows) => <BarList unit="times" items={rows.map((row) => ({ label: row.name, value: row.count }))} />}
      </SectionCard>
    </div>
  );
}

// ---------- Pieces ----------

function SectionCard<T>({ title, subtitle, part, children }: { title: string; subtitle?: string; part: Section<T>; children: (data: T) => React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-[22px] border border-line bg-surface p-6">
      <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{part.ok ? children(part.data) : <p className="text-sm text-muted">{part.message}</p>}</div>
    </section>
  );
}

const capitalise = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);
const CONTACT_LABELS: Record<string, string> = { whatsapp: "WhatsApp", phone: "Phone", email: "Email" };

function formatDuration(seconds: number) {
  const whole = Math.round(seconds);
  return whole < 60 ? `${whole}s` : `${Math.floor(whole / 60)}m ${whole % 60}s`;
}

function Change({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  if (!previous) return <span className="text-faint">{current ? "New this period" : "No change"}</span>;
  const change = (current - previous) / previous;
  if (Math.abs(change) < 0.005) return <span className="text-faint">No change</span>;
  const up = change > 0;
  const good = invert ? !up : up;
  return (
    <span className={good ? "text-green" : "text-[#FF8A80]"}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {Math.abs(change * 100).toFixed(change > -1 && Math.abs(change) < 0.1 ? 1 : 0)}% {up ? "up" : "down"}
    </span>
  );
}

function Overview({ current, previous }: { current: Totals; previous: Totals }) {
  const tiles: { label: string; value: string; current: number; previous: number; hero?: boolean }[] = [
    { label: "Briefs sent", value: current.briefs.toLocaleString(), current: current.briefs, previous: previous.briefs, hero: true },
    { label: "Visitors", value: current.visitors.toLocaleString(), current: current.visitors, previous: previous.visitors, hero: true },
    { label: "New visitors", value: current.newVisitors.toLocaleString(), current: current.newVisitors, previous: previous.newVisitors },
    { label: "Sessions", value: current.sessions.toLocaleString(), current: current.sessions, previous: previous.sessions },
    { label: "Page views", value: current.pageViews.toLocaleString(), current: current.pageViews, previous: previous.pageViews },
    { label: "Average visit", value: formatDuration(current.averageSessionSeconds), current: current.averageSessionSeconds, previous: previous.averageSessionSeconds },
    { label: "Engaged visits", value: `${Math.round(current.engagementRate * 100)}%`, current: current.engagementRate, previous: previous.engagementRate },
  ];
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl border border-line bg-ink-raised p-4">
          <dt className="text-sm text-muted">{tile.label}</dt>
          <dd className={`mt-1 font-display font-extrabold tracking-tight tabular-nums ${tile.hero ? "text-4xl" : "text-3xl"}`}>{tile.value}</dd>
          <dd className="mt-1 text-xs">
            <Change current={tile.current} previous={tile.previous} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Funnel({ steps }: { steps: { step: string; people: number }[] }) {
  const first = steps[0]?.people ?? 0;
  if (!steps.some((step) => step.people)) return <p className="text-sm text-muted">No one has opened the form in this period yet.</p>;
  return (
    <ol className="space-y-2.5">
      {steps.map((step, index) => {
        const share = first ? step.people / first : 0;
        return (
          <li key={step.step} title={`${step.step}: ${step.people.toLocaleString()} people`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-soft">
                <span className="mr-2 font-display font-bold text-faint">{index + 1}</span>
                {step.step}
              </span>
              <span className="tabular-nums text-white">
                {step.people.toLocaleString()} <span className="text-faint">({Math.round(share * 100)}%)</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-chip">
              <div className="h-1.5 rounded-full bg-green" style={{ width: `${Math.max(2, share * 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ScrollTable({ rows }: { rows: { path: string; depth: Record<string, number> }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">No scrolling recorded in this period yet.</p>;
  const columns = ["25", "50", "75", "90"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.1em] text-faint">
          <tr>
            <th className="pb-2 font-medium">Page</th>
            {columns.map((column) => <th key={column} className="pb-2 text-right font-medium">{column}%</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.path}>
              <td className="max-w-[16rem] truncate py-2 pr-3 text-soft">{row.path}</td>
              {columns.map((column) => (
                <td key={column} className="py-2 text-right tabular-nums">{(row.depth[column] ?? 0).toLocaleString()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RealtimeCard({ realtime }: { realtime: Realtime | null }) {
  return (
    <section aria-label="Right now" className="flex flex-wrap items-start gap-x-10 gap-y-4 rounded-[22px] border border-line bg-surface p-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          Right now · last 30 minutes
        </h2>
        <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums">{realtime ? realtime.visitors.toLocaleString() : "–"}</p>
        <p className="text-sm text-muted">{realtime ? (realtime.visitors === 1 ? "visitor on the site" : "visitors on the site") : "Couldn't load live visitors."}</p>
      </div>
      {realtime && realtime.pages.length > 0 && (
        <div className="min-w-[14rem] flex-1">
          <p className="text-xs uppercase tracking-[0.1em] text-faint">On these pages</p>
          <ul className="mt-2 space-y-1 text-sm">
            {realtime.pages.map((page) => (
              <li key={page.name} className="flex justify-between gap-3">
                <span className="truncate text-soft">{page.name}</span>
                <span className="tabular-nums">{page.visitors}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {realtime && realtime.countries.length > 0 && (
        <div className="min-w-[10rem]">
          <p className="text-xs uppercase tracking-[0.1em] text-faint">From</p>
          <ul className="mt-2 space-y-1 text-sm">
            {realtime.countries.map((country) => (
              <li key={country.name} className="flex justify-between gap-3">
                <span className="text-soft">{country.name}</span>
                <span className="tabular-nums">{country.visitors}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function DimensionsNotice() {
  return (
    <div role="status" className="rounded-[22px] border border-[#FFC27A]/40 bg-[#FFC27A]/5 p-5 text-sm">
      <p className="font-semibold text-white">A few reports need one more setting in Google Analytics</p>
      <p className="mt-1 text-soft">
        In Google Analytics → Admin → <strong>Custom definitions</strong>, create these <strong>event-scoped custom dimensions</strong> (event parameter in brackets). Google only collects them from the moment they&rsquo;re created.
      </p>
      <ul className="mt-2 grid gap-1 text-soft sm:grid-cols-2">
        {CUSTOM_DIMENSIONS.map((item) => (
          <li key={item.parameter}>
            <span className="text-white">{item.name}</span> <code className="text-green">({item.parameter})</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Setup({ problem }: { problem: AnalyticsError }) {
  const notConfigured = problem.code === "not-configured";
  return (
    <section className="space-y-5 rounded-[28px] border border-line bg-surface p-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{notConfigured ? "Connect Google Analytics" : "Google Analytics needs attention"}</h2>
        <p className="mt-2 max-w-2xl text-muted">{notConfigured ? "Once it's connected, the website's visitors, clicks, scrolling and briefs show here." : problem.message}</p>
      </div>
      <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-soft marker:text-green">
        <li>In Google Analytics → Admin → <strong>Property details</strong>, copy the numeric <strong>Property ID</strong> into <code className="text-green">GA4_PROPERTY_ID</code> (not the G-… measurement ID).</li>
        <li>In Google Cloud, enable the <strong>Google Analytics Data API</strong>, create a <strong>service account</strong> and download a <strong>JSON key</strong>. Put the whole file&rsquo;s contents in <code className="text-green">GOOGLE_SERVICE_ACCOUNT_JSON</code>.</li>
        <li>In Google Analytics → Admin → <strong>Property access management</strong>, add the service account&rsquo;s email as a <strong>Viewer</strong>.</li>
        <li>Create the custom dimensions listed in the README so click, scroll and form reports work.</li>
      </ol>
    </section>
  );
}
