import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { previewCaseStudy } from "@/lib/case-studies/store";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Preview" };

type PreviewImage = { src: string; alt: string; width: number; height: number };

const detailLabel = "text-xs uppercase tracking-[0.12em] text-muted";

/** A screenshot, or the same placeholder the website shows until one is added. */
function Screenshot({ image, label, className = "" }: { image?: PreviewImage; label: string; className?: string }) {
  if (!image) {
    return (
      <div className={`flex aspect-[16/10] items-center justify-center border border-dashed border-slate bg-surface text-sm text-muted ${className}`}>
        {label} screenshot goes here
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src.replace("/image/upload/", "/image/upload/c_limit,w_1600,f_auto,q_auto/")}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={`h-auto w-full border border-line ${className}`}
    />
  );
}

export default function CaseStudyPreviewPage({ params }: PageProps<"/case-studies/[id]/preview">) {
  return (
    <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
      <Preview params={params} />
    </Suspense>
  );
}

// A close approximation of the website's case study template (/work/<slug>), from the last saved version.
async function Preview({ params }: Pick<PageProps<"/case-studies/[id]/preview">, "params">) {
  await requireUser();
  const { id } = await params;
  const study = await previewCaseStudy(id);
  if (!study) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate bg-ink-raised px-5 py-3 text-sm">
        <span>
          <strong className="text-white">Preview</strong>
          <span className="text-muted"> · {study.status === "published" ? "This is the live version." : "Draft: not on the website yet."} Shows the last saved version.</span>
        </span>
        <Link href={`/case-studies/${id}`} className="font-semibold text-green hover:text-green-hover">Back to editing</Link>
      </div>

      <article className="overflow-hidden rounded-[28px] border border-line bg-ink">
        <section className="px-6 pt-10 sm:px-10">
          <p className="text-sm text-muted">Work / {study.client}</p>
          <h1 className="mt-10 break-words font-display text-[clamp(56px,10vw,150px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            {study.client}<span className="text-green">.</span>
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-10">
            <p className="max-w-[680px] text-[clamp(18px,1.8vw,24px)] leading-[1.45] text-soft">{study.summary}</p>
            <dl className="grid grid-cols-[repeat(2,minmax(140px,1fr))] gap-x-12 gap-y-5">
              <div><dt className={detailLabel}>Client</dt><dd className="mt-1.5">{study.client}</dd></div>
              <div><dt className={detailLabel}>Services</dt><dd className="mt-1.5">{study.tags.join(" · ")}</dd></div>
              {study.sector && <div><dt className={detailLabel}>Sector</dt><dd className="mt-1.5">{study.sector}</dd></div>}
              {study.liveUrl && (
                <div><dt className={detailLabel}>Live at</dt><dd className="mt-1.5 text-green">{study.liveUrl.replace(/^https?:\/\//, "")}</dd></div>
              )}
            </dl>
          </div>
          <Screenshot image={study.heroImage} label="Main" className="mt-14 rounded-t-3xl border-b-0" />
        </section>

        <section className="grid gap-14 bg-[#F4F6F8] px-6 py-20 text-ink sm:px-10 md:grid-cols-2">
          {study.challenge && (
            <div>
              <p className="text-sm uppercase tracking-[0.14em] text-slate">The challenge</p>
              <h2 className="mt-4 font-display text-[clamp(28px,3vw,42px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{study.challenge.headline}</h2>
              <p className="mt-5 text-lg leading-[1.65] text-[#3A4A5A]">{study.challenge.body}</p>
            </div>
          )}
          <div className={study.challenge ? "" : "md:col-span-2 max-w-[760px]"}>
            <p className="text-sm uppercase tracking-[0.14em] text-slate">What we built</p>
            <h2 className="mt-4 font-display text-[clamp(28px,3vw,42px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{study.built.headline}</h2>
            <p className="mt-5 text-lg leading-[1.65] text-[#3A4A5A]">{study.built.body}</p>
          </div>
        </section>

        {study.features.length > 0 && (
          <section className="flex flex-col gap-20 px-6 py-20 sm:px-10">
            {study.features.map((feature, index) => (
              <div key={index} className={`flex flex-wrap items-center gap-12 ${index % 2 === 1 ? "flex-row-reverse" : ""}`}>
                <div className="min-w-0 flex-[1_1_300px]">
                  <div className="font-display text-[15px] font-extrabold text-green">{String(index + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 font-display text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.035em]">{feature.title}</h3>
                  <p className="mt-3 text-[17px] leading-[1.65] text-muted">{feature.body}</p>
                </div>
                <div className="min-w-0 flex-[1.5_1_420px]">
                  <Screenshot image={feature.image} label={feature.title} className="rounded-[18px]" />
                </div>
              </div>
            ))}
          </section>
        )}

        {(study.results || study.quote) && (
          <section className="px-6 pb-20 pt-10 sm:px-10">
            {study.results && (
              <>
                <h2 className="text-sm font-normal uppercase tracking-[0.14em] text-muted">Results</h2>
                <dl className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {study.results.map((result, index) => (
                    <div key={index} className="flex flex-col-reverse border-t-2 border-green pt-6">
                      <dt className="mt-2.5 text-muted">{result.label}</dt>
                      <dd className="font-display text-[clamp(48px,5vw,80px)] font-extrabold leading-none tracking-[-0.05em]">{result.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {study.quote && (
              <figure className={`max-w-[1000px] ${study.results ? "mt-20" : ""}`}>
                <blockquote className="font-display text-[clamp(24px,3vw,40px)] font-semibold leading-[1.2] tracking-[-0.025em]">&ldquo;{study.quote.text}&rdquo;</blockquote>
                <figcaption className="mt-6 text-muted">{[study.quote.author, study.quote.role].filter(Boolean).join(", ")}</figcaption>
              </figure>
            )}
          </section>
        )}
      </article>
    </div>
  );
}
