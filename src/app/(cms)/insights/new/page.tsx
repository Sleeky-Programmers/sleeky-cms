import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArticleEditor } from "@/components/insights/ArticleEditor";
import { requireUser } from "@/lib/session";
import { editorData } from "../editor-data";

export const metadata: Metadata = { title: "New article" };

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <Link href="/insights" className="text-sm font-semibold text-green hover:text-green-hover">← All articles</Link>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <NewArticle />
      </Suspense>
    </div>
  );
}

async function NewArticle() {
  const user = await requireUser();
  const data = await editorData();
  return <ArticleEditor article={null} currentUser={{ id: user.id, name: user.name }} {...data} />;
}
