import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { listPages } from "@/lib/pages/store";
import { PAGE_GROUPS } from "@/lib/pages/registry";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pages" };

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

export default function PagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Content</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Pages</h1>
        <p className="mt-3 max-w-2xl text-muted">Edit the text on the website. Every page starts with the website&rsquo;s current text, and changes go live when you save.</p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-surface" />}>
        <PageList />
      </Suspense>
    </div>
  );
}

async function PageList() {
  await requireUser();
  const pages = await listPages();

  return (
    <div className="space-y-8">
      {PAGE_GROUPS.map((group) => {
        const inGroup = pages.filter((page) => page.group === group);
        if (inGroup.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{group}</h2>
            <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
              {inGroup.map((page) => (
                <li key={page.key}>
                  <Link href={`/pages/${page.key}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 transition-colors hover:bg-ink-raised">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold">{page.title}</p>
                      <p className="mt-1 text-sm text-muted">{page.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      {page.updatedAt && page.updatedBy && <span>Edited {dateFormat.format(new Date(page.updatedAt))} by {page.updatedBy.name}</span>}
                      {page.customised ? (
                        <span className="rounded-full bg-green-deep px-2.5 py-1 text-xs font-semibold text-green">Edited</span>
                      ) : (
                        <span className="rounded-full bg-chip px-2.5 py-1 text-xs font-semibold text-soft">Original text</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
