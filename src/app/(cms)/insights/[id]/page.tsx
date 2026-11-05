import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/insights/ArticleEditor";
import { getArticle } from "@/lib/insights/articles";
import { requireUser } from "@/lib/session";
import { editorData } from "../editor-data";

export const metadata: Metadata = { title: "Edit article" };

export default function EditArticlePage({ params }: PageProps<"/insights/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/insights" className="text-sm font-semibold text-green hover:text-green-hover">← All articles</Link>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <EditArticle params={params} />
      </Suspense>
    </div>
  );
}

async function EditArticle({ params }: Pick<PageProps<"/insights/[id]">, "params">) {
  const user = await requireUser();
  const { id } = await params;
  const [article, data] = await Promise.all([getArticle(id), editorData()]);
  if (!article) notFound();

  // The current author stays selectable even if they've since been deactivated.
  const authors = data.authors.some((author) => author.id === article.author.id) ? data.authors : [article.author, ...data.authors];

  // Keyed by id so opening another article starts a fresh editor.
  return <ArticleEditor key={article.id} article={article} currentUser={{ id: user.id, name: user.name }} {...data} authors={authors} />;
}
