import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { countArticles } from "@/lib/insights/articles";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-[28px] bg-surface" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0];
  const counts = await countArticles();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Dashboard</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">
          Welcome, <span className="text-green">{firstName}</span>.
        </h1>
      </div>

      <section aria-labelledby="insights-heading" className="rounded-[28px] border border-line bg-surface p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="insights-heading" className="font-display text-2xl font-bold tracking-tight">Insights</h2>
            <p className="mt-1 text-muted">Articles for the website&rsquo;s Insights page.</p>
          </div>
          <Link href="/insights/new" className={buttonClass("primary")}>New article</Link>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
          <Link href="/insights?status=published" className="rounded-2xl border border-line bg-ink-raised p-5 transition-colors hover:border-green">
            <dt className="text-sm text-muted">Published</dt>
            <dd className="mt-1 font-display text-4xl font-extrabold text-green">{counts.published}</dd>
          </Link>
          <Link href="/insights?status=draft" className="rounded-2xl border border-line bg-ink-raised p-5 transition-colors hover:border-green">
            <dt className="text-sm text-muted">Drafts</dt>
            <dd className="mt-1 font-display text-4xl font-extrabold">{counts.draft}</dd>
          </Link>
        </dl>
      </section>

      <section className="rounded-[28px] border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">More content tools are on the way</h2>
        <p className="mt-2 max-w-xl text-muted">
          Case studies and page content will be managed here too.
          {user.role === "admin" && " You can invite the rest of the team in the meantime."}
        </p>
        {user.role === "admin" && <Link href="/users" className={`${buttonClass("outline")} mt-6`}>Manage users</Link>}
      </section>
    </div>
  );
}
