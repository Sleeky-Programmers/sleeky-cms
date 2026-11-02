"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import Link from "next/link";
import { deleteCaseStudyAction, saveCaseStudyAction } from "@/app/(cms)/case-studies/actions";
import { StatusBadge } from "@/components/insights/ArticleEditor";
import { ImageAreaContext } from "@/components/insights/upload-image";
import { FieldSections, SectionNav } from "@/components/pages/FieldSections";
import { buttonClass } from "@/components/ui/button-styles";
import { Field as TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import type { CaseStudy, SaveIntent } from "@/lib/case-studies/store";
import { SLUG_MAX, slugify } from "@/lib/insights/slug";
import { isRecord, type Field, type PageValues } from "@/lib/pages/fields";

type CaseStudyEditorProps = {
    caseStudy: CaseStudy | null;
    /** Blank content for a new case study. */
    emptyContent: PageValues;
    fields: Field[];
    imagesEnabled: boolean;
    /** Public website address, for "View on website". */
    websiteUrl?: string;
};

type Draft = { slug: string; content: PageValues };

const draftFrom = (caseStudy: CaseStudy | null, emptyContent: PageValues): Draft => ({
    slug: caseStudy?.slug ?? "",
    content: caseStudy?.content ?? emptyContent,
});

const clientOf = (content: PageValues) => {
    const overview = content.overview;
    return isRecord(overview) && typeof overview.client === "string" ? overview.client : "";
};

const dateTime = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function CaseStudyEditor({ caseStudy, emptyContent, fields, imagesEnabled, websiteUrl }: CaseStudyEditorProps) {
    const [saved, setSaved] = useState<CaseStudy | null>(caseStudy);
    const [draft, setDraft] = useState<Draft>(() => draftFrom(caseStudy, emptyContent));
    const [baseline, setBaseline] = useState(() => JSON.stringify(draftFrom(caseStudy, emptyContent)));
    // The address follows the client name until someone edits it (or it has ever been live).
    const [slugTouched, setSlugTouched] = useState(
        Boolean(caseStudy && (caseStudy.publishedAt || caseStudy.slug !== slugify(clientOf(caseStudy.content)))),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();
    const [pendingIntent, setPendingIntent] = useState<SaveIntent | "delete" | null>(null);

    const dirty = JSON.stringify(draft) !== baseline;
    const status = saved?.status ?? "draft";
    const isLive = status === "published";
    const client = clientOf(draft.content);

    const setContent = (key: string, value: unknown) =>
        setDraft((current) => {
            const content = { ...current.content, [key]: value };
            return { content, slug: slugTouched ? current.slug : slugify(clientOf(content)) };
        });

    const save = (intent: SaveIntent) => {
        if (pending) return;
        setPendingIntent(intent);
        setNotice(null);
        startTransition(async () => {
            const result = await saveCaseStudyAction({ ...draft, id: saved?.id, version: saved?.version }, intent);
            setPendingIntent(null);
            if (!result.ok) {
                setErrors(result.fieldErrors ?? {});
                setNotice({ tone: "error", text: result.message });
                return;
            }
            setErrors({});
            setSaved(result.caseStudy);
            const next = draftFrom(result.caseStudy, emptyContent);
            setDraft(next);
            setBaseline(JSON.stringify(next));
            if (result.caseStudy.publishedAt) setSlugTouched(true);
            setNotice({ tone: "success", text: result.message });
            // First save: give it its own address without reloading the editor.
            if (!saved) window.history.replaceState(null, "", `/case-studies/${result.caseStudy.id}`);
        });
    };

    const saveShortcut = useEffectEvent(() => save("save"));
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                saveShortcut();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    const unpublish = () => {
        if (window.confirm("Take this case study off the website? It will become a draft again.")) save("unpublish");
    };

    const remove = () => {
        if (!saved || !window.confirm(`Delete the ${client || "untitled"} case study? This can't be undone.`)) return;
        setPendingIntent("delete");
        startTransition(async () => {
            const result = await deleteCaseStudyAction(saved.id);
            setPendingIntent(null);
            setNotice({ tone: "error", text: result.message });
        });
    };

    const label = (intent: SaveIntent | "delete", idle: string, busy: string) => (pending && pendingIntent === intent ? busy : idle);

    return (
        <div className="space-y-6">
            <h1 className="font-display text-[clamp(32px,4vw,48px)] font-extrabold leading-none tracking-[-0.04em]">
                {client || "New case study"}
                <span className="text-green">.</span>
            </h1>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-6">
                    <ImageAreaContext value="case-studies">
                        <FieldSections fields={fields} values={draft.content} onChange={setContent} errors={errors} imagesEnabled={imagesEnabled} />
                    </ImageAreaContext>
                </div>

                <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                    <section aria-label="Publishing" className="rounded-[22px] border border-line bg-surface p-5">
                        <div className="flex items-center justify-between gap-3">
                            <StatusBadge status={status} />
                            <span className="text-sm text-muted" aria-live="polite">
                                {pending ? "Saving…" : dirty ? "Unsaved changes" : saved ? "All changes saved" : "Not saved yet"}
                            </span>
                        </div>
                        {saved && (
                            <p className="mt-3 text-sm text-muted">
                                Last saved {dateTime.format(new Date(saved.updatedAt))} by {saved.updatedBy.name}
                            </p>
                        )}
                        {notice && <Notice tone={notice.tone} className="mt-4">{notice.text}</Notice>}

                        <div className="mt-5 flex flex-wrap gap-2">
                            {isLive ? (
                                <>
                                    <button type="button" onClick={() => save("save")} disabled={pending || !dirty} className={buttonClass("primary")}>
                                        {label("save", "Update", "Updating…")}
                                    </button>
                                    <button type="button" onClick={unpublish} disabled={pending} className={buttonClass("outline")}>
                                        {label("unpublish", "Unpublish", "Unpublishing…")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" onClick={() => save("publish")} disabled={pending} className={buttonClass("primary")}>
                                        {label("publish", "Publish", "Publishing…")}
                                    </button>
                                    <button type="button" onClick={() => save("save")} disabled={pending || (!dirty && Boolean(saved))} className={buttonClass("outline")}>
                                        {label("save", "Save draft", "Saving…")}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                            {saved && (
                                <Link href={`/case-studies/${saved.id}/preview`} target="_blank" className="font-semibold text-green hover:text-green-hover">
                                    Preview{dirty ? " (last saved version)" : ""}
                                </Link>
                            )}
                            {isLive && websiteUrl && saved && (
                                <a href={`${websiteUrl}/work/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green hover:text-green-hover">
                                    View on website
                                </a>
                            )}
                            {saved && !isLive && (
                                <button type="button" onClick={remove} disabled={pending} className="font-semibold text-danger hover:underline">
                                    {label("delete", "Delete draft", "Deleting…")}
                                </button>
                            )}
                        </div>
                        <p className="mt-4 text-xs text-faint">Tip: press Ctrl+S (⌘S on Mac) to save.</p>
                    </section>

                    <section aria-label="Web address" className="rounded-[22px] border border-line bg-surface p-5">
                        <TextField
                            label="Web address"
                            name="slug"
                            value={draft.slug}
                            maxLength={SLUG_MAX}
                            onChange={(event) => {
                                setSlugTouched(true);
                                const slug = event.target.value.toLowerCase().replace(/\s+/g, "-");
                                setDraft((current) => ({ ...current, slug }));
                            }}
                            onBlur={() => setDraft((current) => ({ ...current, slug: slugify(current.slug) || slugify(clientOf(current.content)) }))}
                            error={errors.slug}
                            hint={`/work/${draft.slug || "…"}`}
                        />
                        {isLive && saved && draft.slug !== saved.slug && (
                            <p className="mt-1.5 text-sm text-[#FFC27A]">Changing the address of a live case study breaks existing links to it.</p>
                        )}
                    </section>

                    <SectionNav fields={fields} errors={errors} />
                </aside>
            </div>
        </div>
    );
}
