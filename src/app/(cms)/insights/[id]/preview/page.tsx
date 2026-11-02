import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { previewArticle } from "@/lib/insights/articles";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Preview" };

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default function PreviewPage({ params }: PageProps<"/insights/[id]/preview">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[600px] max-w-[760px] animate-pulse rounded-[28px] bg-surface" />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: Pick<PageProps<"/insights/[id]/preview">, "params">) {
  await requireUser();
  const { id } = await params;
  const article = await previewArticle(id);
  if (!article) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate bg-ink-raised px-5 py-3 text-sm">
        <span>
          <strong className="text-white">Preview</strong>
          <span className="text-muted"> · {article.status === "published" ? "This is the live version." : "Draft: not on the website yet."} Shows the last saved version.</span>
        </span>
        <Link href={`/insights/${id}`} className="font-semibold text-green hover:text-green-hover">Back to editing</Link>
      </div>

      <article className="mx-auto max-w-[760px]">
        <p className="text-[13px] uppercase tracking-[0.12em] text-muted">
          {article.category || "Uncategorised"} · <time dateTime={article.publishedAt}>{dateFormat.format(new Date(article.publishedAt))}</time> · {article.author} · {article.readingMinutes} min read
        </p>
        <h1 className="mt-5 font-display text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.04em]">{article.title}</h1>
        {article.excerpt && <p className="mt-6 text-xl leading-relaxed text-soft">{article.excerpt}</p>}
        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage.url.replace("/image/upload/", "/image/upload/c_limit,w_1600,f_auto,q_auto/")}
            alt={article.coverImage.alt}
            width={article.coverImage.width}
            height={article.coverImage.height}
            className="mt-10 h-auto w-full rounded-[20px]"
          />
        )}
        {/* The body is sanitized on save and rendered only through the editor schema. */}
        <div className="rich-text mt-10" dangerouslySetInnerHTML={{ __html: article.html }} />
      </article>
    </div>
  );
}
