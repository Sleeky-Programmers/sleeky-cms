"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { resetPageAction, savePageAction, type PageSaveResult } from "@/app/(cms)/pages/actions";
import { buttonClass } from "@/components/ui/button-styles";
import { Notice } from "@/components/ui/Notice";
import type { Field, PageValues } from "@/lib/pages/fields";
import type { PageState } from "@/lib/pages/store";
import { FieldSections, SectionNav } from "./FieldSections";

type PageEditorProps = {
    pageKey: string;
    fields: Field[];
    initial: PageState;
    imagesEnabled: boolean;
    /** Full website address of this page, for "View on website". */
    websiteHref?: string;
};

const dateTime = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function PageEditor({ pageKey, fields, initial, imagesEnabled, websiteHref }: PageEditorProps) {
    const [page, setPage] = useState(initial);
    const [values, setValues] = useState<PageValues>(initial.values);
    const [baseline, setBaseline] = useState(() => JSON.stringify(initial.values));
    // Remounts rich-text editors when the content is replaced wholesale (reset).
    const [generation, setGeneration] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
    const [pending, startTransition] = useTransition();

    const dirty = JSON.stringify(values) !== baseline;

    const apply = (result: PageSaveResult, replaceValues: boolean) => {
        if (!result.ok) {
            setErrors(result.fieldErrors ?? {});
            setNotice({ tone: "error", text: result.message });
            return;
        }
        setErrors({});
        setPage(result.page);
        setBaseline(JSON.stringify(replaceValues ? result.page.values : values));
        if (replaceValues) {
            setValues(result.page.values);
            setGeneration((current) => current + 1);
        }
        setNotice({ tone: "success", text: result.message });
    };

    const save = () => {
        if (pending || !dirty) return;
        setNotice(null);
        startTransition(async () => apply(await savePageAction(pageKey, values, page.version), false));
    };

    const reset = () => {
        if (pending) return;
        if (!window.confirm("Put this page back to the website's original text? Your edits to this page will be lost.")) return;
        setNotice(null);
        startTransition(async () => apply(await resetPageAction(pageKey, page.version), true));
    };

    const saveShortcut = useEffectEvent(save);
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

    const setField = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-6" key={generation}>
                <FieldSections fields={fields} values={values} onChange={setField} errors={errors} imagesEnabled={imagesEnabled} />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <section aria-label="Saving" className="rounded-[22px] border border-line bg-surface p-5">
                    <div className="flex items-center justify-between gap-3">
                        {page.customised ? (
                            <span className="rounded-full bg-green-deep px-2.5 py-1 text-xs font-semibold text-green">Edited</span>
                        ) : (
                            <span className="rounded-full bg-chip px-2.5 py-1 text-xs font-semibold text-soft">Original text</span>
                        )}
                        <span className="text-sm text-muted" aria-live="polite">
                            {pending ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
                        </span>
                    </div>
                    {page.updatedAt && page.updatedBy && (
                        <p className="mt-3 text-sm text-muted">Last saved {dateTime.format(new Date(page.updatedAt))} by {page.updatedBy.name}</p>
                    )}
                    {notice && <Notice tone={notice.tone} className="mt-4">{notice.text}</Notice>}
                    <button type="button" onClick={save} disabled={pending || !dirty} className={`${buttonClass("primary")} mt-5 w-full`}>
                        {pending ? "Saving…" : "Save changes"}
                    </button>
                    <p className="mt-3 text-xs text-faint">Changes go live on the website when you save. Ctrl+S (⌘S) also saves.</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        {websiteHref && (
                            <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-green hover:text-green-hover">View on website</a>
                        )}
                        {page.customised && (
                            <button type="button" onClick={reset} disabled={pending} className="font-semibold text-danger hover:underline">Reset to original text</button>
                        )}
                    </div>
                </section>

                <SectionNav fields={fields} errors={errors} />
            </aside>
        </div>
    );
}
