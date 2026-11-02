import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CaseStudyEditor } from "@/components/case-studies/CaseStudyEditor";
import { caseStudyFields } from "@/lib/case-studies/fields";
import { emptyCaseStudyContent } from "@/lib/case-studies/store";
import { cloudinaryConfig } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { websiteOrigin } from "@/lib/website";

export const metadata: Metadata = { title: "New case study" };

export default function NewCaseStudyPage() {
  return (
    <div className="space-y-6">
      <Link href="/case-studies" className="text-sm font-semibold text-green hover:text-green-hover">← All case studies</Link>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <NewCaseStudy />
      </Suspense>
    </div>
  );
}

async function NewCaseStudy() {
  await requireUser();
  return (
    <CaseStudyEditor
      caseStudy={null}
      emptyContent={emptyCaseStudyContent()}
      fields={caseStudyFields}
      imagesEnabled={cloudinaryConfig() !== null}
      websiteUrl={websiteOrigin()}
    />
  );
}
