"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { deleteArticleAction, saveArticleAction } from "@/app/(cms)/insights/actions";
import { buttonClass } from "@/components/ui/button-styles";
import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import type { StoredImage } from "@/lib/images";
import type { Article, SaveIntent } from "@/lib/insights/articles";
import { CATEGORY_MAX, EXCERPT_MAX, META_DESCRIPTION_MAX, TITLE_MAX } from "@/lib/insights/limits";
import { emptyDoc, wordCount, type RichTextDoc } from "@/lib/insights/rich-text";
import { SLUG_MAX, slugify } from "@/lib/insights/slug";
import { CoverImageField } from "./CoverImageField";
import { RichTextEditor } from "./RichTextEditor";

type Person = { id: string; name: string };

type ArticleEditorProps = {
    article: Article | null;
    authors: Person[];
    categories: string[];
    currentUser: Person;
    imagesEnabled: boolean;
    /** Public website address, for "View on website" links. */
    websiteUrl?: string;
};

type Fields = {
    title: string;
    slug: string;
    excerpt: string;
    metaDescription: string;
    category: string;
    authorId: string;
    coverImage: StoredImage | null;
    body: RichTextDoc;
};

const fieldsFrom = (article: Article | null, currentUser: Person): Fields => ({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    metaDescription: article?.metaDescription ?? "",
    category: article?.category ?? "",
    authorId: article?.author.id ?? currentUser.id,
    coverImage: article?.coverImage ?? null,
    body: article?.body ?? emptyDoc(),
});

const dateTime = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function ArticleEditor({ article, authors, categories, currentUser, imagesEnabled, websiteUrl }: ArticleEditorProps) {
    const [saved, setSaved] = useState<Article | null>(article);
    const [fields, setFields] = useState<Fields>(() => fieldsFrom(article, currentUser));
    const [baseline, setBaseline] = useState(() => JSON.stringify(fieldsFrom(article, currentUser)));
    // The address follows the title until someone edits it (or the article has ever been live).
    const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug && (article.publishedAt || article.slug !== slugify(article.title))));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();
    const [pendingIntent, setPendingIntent] = useState<SaveIntent | "delete" | null>(null);

    const dirty = JSON.stringify(fields) !== baseline;
    const status = saved?.status ?? "draft";
    const isLive = status === "published";
    const words = useMemo(() => wordCount(fields.body), [fields.body]);

    const update = <K extends keyof Fields>(key: K, value: Fields[K]) => {
        setFields((current) => {
            const next = { ...current, [key]: value };
            if (key === "title" && !slugTouched) next.slug = slugify(String(value));
            return next;
        });
        setErrors((current) => {
            if (!current[key]) return current;
            const rest = { ...current };
            delete rest[key];
            return rest;
        });
    };

    const save = useCallback(
        (intent: SaveIntent) => {
            if (pending) return;
            setPendingIntent(intent);
            setNotice(null);
            startTransition(async () => {
                const result = await saveArticleAction({ ...fields, id: saved?.id, version: saved?.version }, intent);
                setPendingIntent(null);
                if (!result.ok) {
                    setErrors(result.fieldErrors ?? {});
                    setNotice({ tone: "error", text: result.message });
                    return;
                }
                setErrors({});
                setSaved(result.article);
                const next = fieldsFrom(result.article, currentUser);
                // Keep the body the editor is showing; the saved copy is the cleaned-up equivalent.
                setFields((current) => ({ ...next, body: current.body }));
                setBaseline(JSON.stringify({ ...next, body: fields.body }));
                if (result.article.publishedAt) setSlugTouched(true);
                setNotice({ tone: "success", text: result.message });
                // First save of a new article: give it its own address without reloading the editor.
                if (!saved) window.history.replaceState(null, "", `/insights/${result.article.id}`);
            });
        },
        [currentUser, fields, pending, saved],
    );

    // Ctrl/Cmd+S saves (always with the latest field values).
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

    // Warn before closing the tab or reloading with unsaved changes.
    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    const unpublish = () => {
        if (window.confirm("Take this article off the website? It will become a draft again.")) save("unpublish");
    };

    const remove = () => {
        if (!saved || !window.confirm(`Delete "${saved.title}"? This can't be undone.`)) return;
        setPendingIntent("delete");
        startTransition(async () => {
            const result = await deleteArticleAction(saved.id);
            setPendingIntent(null);
            setNotice({ tone: "error", text: result.message });
        });
    };

    const label = (intent: SaveIntent | "delete", idle: string, busy: string) => (pending && pendingIntent === intent ? busy : idle);

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
                <div>
                    <label htmlFor="title" className="sr-only">Title</label>
                    <textarea
                        id="title"
                        rows={1}
                        value={fields.title}
                        maxLength={TITLE_MAX}
                        onChange={(event) => update("title", event.target.value.replace(/\n/g, " "))}
                        placeholder="Article title"
                        aria-invalid={errors.title ? true : undefined}
                        aria-describedby={errors.title ? "title-error" : undefined}
                        className="field-sizing-content w-full resize-none bg-transparent font-display text-[clamp(32px,4vw,48px)] font-extrabold leading-tight tracking-[-0.03em] text-white placeholder:text-line focus:outline-none"
                    />
                    {errors.title && <p id="title-error" className="mt-1 text-sm font-medium text-danger">{errors.title}</p>}
                </div>
                <div>
                    <RichTextEditor
                        initialContent={fields.body}
                        onChange={(body) => update("body", body)}
                        imagesEnabled={imagesEnabled}
                        invalid={Boolean(errors.body)}
                        describedBy={errors.body ? "body-error" : undefined}
                    />
                    <div className="mt-2 flex justify-between gap-3 text-sm text-muted">
                        <span id="body-error" className="font-medium text-danger">{errors.body}</span>
                        <span>{words} {words === 1 ? "word" : "words"}</span>
                    </div>
                </div>
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
                            {saved.publishedAt && <> · First published {dateTime.format(new Date(saved.publishedAt))}</>}
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
                            <Link href={`/insights/${saved.id}/preview`} target="_blank" className="font-semibold text-green hover:text-green-hover">
                                Preview{dirty ? " (last saved version)" : ""}
                            </Link>
                        )}
                        {isLive && websiteUrl && saved && (
                            <a href={`${websiteUrl}/insights/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green hover:text-green-hover">
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

                <section aria-label="Article details" className="space-y-5 rounded-[22px] border border-line bg-surface p-5">
                    <div>
                        <Field
                            label="Web address"
                            name="slug"
                            value={fields.slug}
                            maxLength={SLUG_MAX}
                            onChange={(event) => {
                                setSlugTouched(true);
                                update("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
                            }}
                            onBlur={() => update("slug", slugify(fields.slug) || slugify(fields.title))}
                            error={errors.slug}
                            hint={`/insights/${fields.slug || "…"}`}
                        />
                        {isLive && saved && fields.slug !== saved.slug && (
                            <p className="mt-1.5 text-sm text-[#FFC27A]">Changing the address of a live article breaks existing links to it.</p>
                        )}
                    </div>

                    <div>
                        <Field
                            label="Category"
                            name="category"
                            list="article-categories"
                            value={fields.category}
                            maxLength={CATEGORY_MAX}
                            onChange={(event) => update("category", event.target.value)}
                            error={errors.category}
                            hint="Pick one or type a new category."
                        />
                        <datalist id="article-categories">
                            {categories.map((category) => <option key={category} value={category} />)}
                        </datalist>
                    </div>

                    <SelectField
                        label="Author"
                        name="authorId"
                        value={fields.authorId}
                        onChange={(event) => update("authorId", event.target.value)}
                        error={errors.authorId}
                        options={authors.map((author) => ({ value: author.id, label: author.name }))}
                    />

                    <TextAreaField
                        label="Summary"
                        name="excerpt"
                        rows={3}
                        value={fields.excerpt}
                        onChange={(event) => update("excerpt", event.target.value)}
                        error={errors.excerpt}
                        hint="Shown on the Insights page and in shares."
                        counter={{ used: fields.excerpt.length, max: EXCERPT_MAX }}
                    />

                    <TextAreaField
                        label="Search description"
                        name="metaDescription"
                        rows={3}
                        value={fields.metaDescription}
                        onChange={(event) => update("metaDescription", event.target.value)}
                        error={errors.metaDescription}
                        hint="For Google results. Leave empty to use the summary."
                        counter={{ used: fields.metaDescription.length, max: META_DESCRIPTION_MAX }}
                    />

                    <CoverImageField value={fields.coverImage} onChange={(image) => update("coverImage", image)} enabled={imagesEnabled} altError={errors.coverAlt} />
                </section>
            </aside>
        </div>
    );
}

export function StatusBadge({ status }: { status: Article["status"] }) {
    return status === "published" ? (
        <span className="rounded-full bg-green-deep px-2.5 py-1 text-xs font-semibold text-green">Published</span>
    ) : (
        <span className="rounded-full bg-chip px-2.5 py-1 text-xs font-semibold text-soft">Draft</span>
    );
}
