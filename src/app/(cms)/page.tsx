import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { countCaseStudies } from "@/lib/case-studies/store";
import { countArticles } from "@/lib/insights/articles";
import { listPages } from "@/lib/pages/store";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-[28px] bg-surface" />}>
      <Dashboard />
    </Suspense>
  );
}

type ContentCardProps = {
  id: string;
  title: string;
  description: string;
  /** Where the Published and Drafts counts link to. */
  links: { published: string; draft: string };
  newHref: string;
  newLabel: string;
  counts: { published: number; draft: number };
};

function ContentCard({ id, title, description, links, newHref, newLabel, counts }: ContentCardProps) {
  return (
    <section aria-labelledby={id} className="rounded-[28px] border border-line bg-surface p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id={id} className="font-display text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-muted">{description}</p>
        </div>
        <Link href={newHref} className={buttonClass("primary")}>{newLabel}</Link>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <Link href={links.published} className="rounded-2xl border border-line bg-ink-raised p-5 transition-colors hover:border-green">
          <dt className="text-sm text-muted">Published</dt>
          <dd className="mt-1 font-display text-4xl font-extrabold text-green">{counts.published}</dd>
        </Link>
        <Link href={links.draft} className="rounded-2xl border border-line bg-ink-raised p-5 transition-colors hover:border-green">
          <dt className="text-sm text-muted">Drafts</dt>
          <dd className="mt-1 font-display text-4xl font-extrabold">{counts.draft}</dd>
        </Link>
      </dl>
    </section>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0];
  const [articles, caseStudies, pages] = await Promise.all([countArticles(), countCaseStudies(), listPages()]);
  const edited = pages.filter((page) => page.customised).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Dashboard</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">
          Welcome, <span className="text-green">{firstName}</span>.
        </h1>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <ContentCard
          id="insights-heading"
          title="Insights"
          description="Articles for the website’s Insights page."
          links={{ published: "/insights?status=published", draft: "/insights?status=draft" }}
          newHref="/insights/new"
          newLabel="New article"
          counts={articles}
        />
        <ContentCard
          id="case-studies-heading"
          title="Case studies"
          description="Projects on the website’s Work pages."
          links={{ published: "/case-studies", draft: "/case-studies" }}
          newHref="/case-studies/new"
          newLabel="New case study"
          counts={caseStudies}
        />
      </div>

      <section aria-labelledby="pages-heading" className="rounded-[28px] border border-line bg-surface p-8">
        <h2 id="pages-heading" className="font-display text-2xl font-bold tracking-tight">Website pages</h2>
        <p className="mt-2 max-w-xl text-muted">
          The text of the homepage, About, service pages and more. {edited === 0 ? "All pages show their original text." : `${edited} of ${pages.length} edited.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pages" className={buttonClass("outline")}>Edit pages</Link>
          <Link href="/pages/site" className={buttonClass("outline")}>Site settings</Link>
          {user.role === "admin" && <Link href="/users" className={buttonClass("outline")}>Manage users</Link>}
        </div>
      </section>
    </div>
  );
}
