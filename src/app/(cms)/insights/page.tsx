import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/insights/ArticleEditor";
import { buttonClass } from "@/components/ui/button-styles";
import { Notice } from "@/components/ui/Notice";
import { countArticles, listArticles, type ArticleStatus } from "@/lib/insights/articles";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Insights" };

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

const TABS: { label: string; status?: ArticleStatus }[] = [
  { label: "All" },
  { label: "Drafts", status: "draft" },
  { label: "Published", status: "published" },
];

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-muted">Content</p>
          <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Insights</h1>
        </div>
        <Link href="/insights/new" className={buttonClass("primary")}>New article</Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-surface" />}>
        <ArticleList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ArticleList({ searchParams }: Pick<PageProps<"/insights">, "searchParams">) {
  await requireUser();
  const params = await searchParams;
  const status = params.status === "draft" || params.status === "published" ? params.status : undefined;
  const [articles, counts] = await Promise.all([listArticles({ status }), countArticles()]);
  const total = counts.draft + counts.published;
  const countFor = (tab?: ArticleStatus) => (tab ? counts[tab] : total);

  return (
    <div className="space-y-6">
      {params.deleted === "1" && <Notice tone="success">Draft deleted.</Notice>}

      <nav aria-label="Filter articles" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const current = tab.status === status;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/insights?status=${tab.status}` : "/insights"}
              aria-current={current ? "page" : undefined}
              className="rounded-full border border-slate px-4 py-2 text-sm font-semibold text-soft transition-colors hover:text-white aria-[current=page]:border-green aria-[current=page]:bg-green-deep aria-[current=page]:text-green"
            >
              {tab.label} <span className="text-muted">{countFor(tab.status)}</span>
            </Link>
          );
        })}
      </nav>

      {articles.length === 0 ? (
        <div className="rounded-[28px] border border-line bg-surface p-10 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {total === 0 ? "No articles yet" : status === "draft" ? "No drafts" : "Nothing published yet"}
          </h2>
          <p className="mt-2 text-muted">
            {total === 0 ? "Write the first one; it stays a draft until you publish it." : "Articles will show up here."}
          </p>
          {total === 0 && <Link href="/insights/new" className={`${buttonClass("primary")} mt-6`}>Write an article</Link>}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/insights/${article.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 transition-colors hover:bg-ink-raised">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{article.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {article.category || "No category"} · by {article.author.name}
                    {article.publishedAt && <> · published {dateFormat.format(new Date(article.publishedAt))}</>}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>Updated {dateFormat.format(new Date(article.updatedAt))} by {article.updatedBy.name}</span>
                  <StatusBadge status={article.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
