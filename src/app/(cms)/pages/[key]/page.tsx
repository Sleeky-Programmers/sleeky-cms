import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/pages/PageEditor";
import { cloudinaryConfig } from "@/lib/images";
import { getPageDefinition } from "@/lib/pages/registry";
import { getPage } from "@/lib/pages/store";
import { requireUser } from "@/lib/session";
import { websiteOrigin } from "@/lib/website";

export async function generateMetadata({ params }: PageProps<"/pages/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: getPageDefinition(key)?.title ?? "Page" };
}

export default function EditPagePage({ params }: PageProps<"/pages/[key]">) {
  return (
    <div className="space-y-6">
      <Link href="/pages" className="text-sm font-semibold text-green hover:text-green-hover">← All pages</Link>
      <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[28px] bg-surface" />}>
        <EditPage params={params} />
      </Suspense>
    </div>
  );
}

async function EditPage({ params }: Pick<PageProps<"/pages/[key]">, "params">) {
  await requireUser();
  const { key } = await params;
  const definition = getPageDefinition(key);
  const page = definition ? await getPage(key) : null;
  if (!definition || !page) notFound();

  const origin = websiteOrigin();
  const listing = page.values.listing as { name?: string } | undefined;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">{definition.group}</p>
        <h1 className="mt-3 font-display text-[clamp(32px,4vw,48px)] font-extrabold leading-none tracking-[-0.04em]">{listing?.name || definition.title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{definition.description}</p>
      </div>
      <PageEditor
        key={key}
        pageKey={key}
        fields={definition.fields}
        initial={page}
        imagesEnabled={cloudinaryConfig() !== null}
        websiteHref={origin && definition.websitePath ? `${origin}${definition.websitePath}` : undefined}
      />
    </div>
  );
}
