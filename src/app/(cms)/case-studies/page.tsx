import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/insights/ArticleEditor";
import { buttonClass } from "@/components/ui/button-styles";
import { Notice } from "@/components/ui/Notice";
import { listCaseStudies } from "@/lib/case-studies/store";
import { websiteCaseStudyImports } from "@/lib/case-studies/website-case-studies";
import { requireUser } from "@/lib/session";
import { importWebsiteCaseStudiesAction, moveCaseStudyAction } from "./actions";

export const metadata: Metadata = { title: "Case studies" };

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

const moveButton =
  "rounded-lg px-2.5 py-1.5 text-sm font-semibold text-soft transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

export default function CaseStudiesPage({ searchParams }: PageProps<"/case-studies">) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-muted">Content</p>
          <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Case studies</h1>
          <p className="mt-3 max-w-2xl text-muted">Projects on the website&rsquo;s Work pages. The order here is the order on the website.</p>
        </div>
        <Link href="/case-studies/new" className={buttonClass("primary")}>New case study</Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-surface" />}>
        <CaseStudyList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CaseStudyList({ searchParams }: Pick<PageProps<"/case-studies">, "searchParams">) {
  await requireUser();
  const [params, studies] = await Promise.all([searchParams, listCaseStudies()]);
  const imported = Number(params.imported);

  return (
    <div className="space-y-6">
      {params.deleted === "1" && <Notice tone="success">Draft deleted.</Notice>}
      {params.imported !== undefined && (
        <Notice tone="success">
          {imported > 0 ? `Imported ${imported} case ${imported === 1 ? "study" : "studies"} from the website.` : "Those case studies are already here."}
        </Notice>
      )}

      {studies.length === 0 ? (
        <div className="rounded-[28px] border border-line bg-surface p-10 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">No case studies yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            The website currently shows {websiteCaseStudyImports.length} projects. Import them to start editing them here; they stay live on the website.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <form action={importWebsiteCaseStudiesAction}>
              <button type="submit" className={buttonClass("primary")}>Import from the website</button>
            </form>
            <Link href="/case-studies/new" className={buttonClass("outline")}>Start from scratch</Link>
          </div>
        </div>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
          {studies.map((study, index) => (
            <li key={study.id} className="flex items-center gap-2 pr-4 transition-colors hover:bg-ink-raised">
              <Link href={`/case-studies/${study.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 py-5 pl-6">
                <span aria-hidden="true" className="font-display text-sm font-extrabold text-green">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{study.client || "Untitled"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {study.tags.join(" · ") || "No services yet"} · /work/{study.slug}
                    {!study.hasScreenshot && " · no screenshot yet"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>Updated {dateFormat.format(new Date(study.updatedAt))} by {study.updatedBy.name}</span>
                  <StatusBadge status={study.status} />
                </div>
              </Link>
              <form action={moveCaseStudyAction} className="flex shrink-0 gap-1">
                <input type="hidden" name="id" value={study.id} />
                <button type="submit" name="direction" value="up" disabled={index === 0} className={moveButton} aria-label={`Move ${study.client} up`}>↑</button>
                <button type="submit" name="direction" value="down" disabled={index === studies.length - 1} className={moveButton} aria-label={`Move ${study.client} down`}>↓</button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
