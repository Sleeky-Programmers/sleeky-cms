import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyEditor } from "@/components/case-studies/CaseStudyEditor";
import { caseStudyFields } from "@/lib/case-studies/fields";
import { emptyCaseStudyContent, getCaseStudy } from "@/lib/case-studies/store";
import { cloudinaryConfig } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { websiteOrigin } from "@/lib/website";

export const metadata: Metadata = { title: "Edit case study" };

export default function EditCaseStudyPage({ params }: PageProps<"/case-studies/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/case-studies" className="text-sm font-semibold text-green hover:text-green-hover">← All case studies</Link>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <EditCaseStudy params={params} />
      </Suspense>
    </div>
  );
}

async function EditCaseStudy({ params }: Pick<PageProps<"/case-studies/[id]">, "params">) {
  await requireUser();
  const { id } = await params;
  const caseStudy = await getCaseStudy(id);
  if (!caseStudy) notFound();

  // Keyed by id so opening another case study starts a fresh editor.
  return (
    <CaseStudyEditor
      key={caseStudy.id}
      caseStudy={caseStudy}
      emptyContent={emptyCaseStudyContent()}
      fields={caseStudyFields}
      imagesEnabled={cloudinaryConfig() !== null}
      websiteUrl={websiteOrigin()}
    />
  );
}
