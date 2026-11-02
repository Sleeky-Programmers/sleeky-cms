"use client";

import { ImageUploadField } from "@/components/insights/CoverImageField";
import { RichTextEditor } from "@/components/insights/RichTextEditor";
import type { StoredImage } from "@/lib/images";
import type { RichTextDoc } from "@/lib/insights/rich-text";
import { emptyItem, isRecord, type Field, type ListField, type PageValues, type StringListField } from "@/lib/pages/fields";

type FieldInputProps = {
    field: Field;
    value: unknown;
    /** Dot path of this field, e.g. "faqs.items.2.answer"; used for ids and errors. */
    path: string;
    onChange: (value: unknown) => void;
    errors: Record<string, string>;
    imagesEnabled: boolean;
    /** Keep the label for screen readers only (when a section heading already says it). */
    labelHidden?: boolean;
};

const idFor = (path: string) => `field-${path.replace(/\./g, "-")}`;

const inputClass =
    "mt-2 w-full rounded-[14px] border border-slate bg-surface px-4 py-3 text-base text-white transition-colors placeholder:text-faint focus:border-green focus:outline-none aria-[invalid=true]:border-danger";

const smallButton = "rounded-lg px-2.5 py-1.5 text-sm font-semibold text-soft transition-colors hover:bg-ink-raised hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export function FieldInput(props: FieldInputProps) {
    const { field } = props;
    switch (field.type) {
        case "group":
            return <GroupInput {...props} field={field} />;
        case "list":
            return <ListInput {...props} field={field} />;
        case "stringList":
            return <StringListInput {...props} field={field} />;
        case "image":
            return (
                <ImageUploadField
                    id={idFor(props.path)}
                    label={field.label}
                    value={(props.value as StoredImage | null) ?? null}
                    onChange={props.onChange}
                    enabled={props.imagesEnabled}
                    altError={props.errors[`${props.path}.alt`]}
                    error={props.errors[props.path]}
                />
            );
        case "richText":
            return (
                <div>
                    <p className={props.labelHidden ? "sr-only" : "mb-2 text-[15px] font-medium"}>{field.label}</p>
                    <RichTextEditor
                        initialContent={props.value as RichTextDoc}
                        onChange={props.onChange}
                        imagesEnabled={props.imagesEnabled}
                        invalid={Boolean(props.errors[props.path])}
                        describedBy={props.errors[props.path] ? `${idFor(props.path)}-error` : undefined}
                    />
                    <ErrorText id={`${idFor(props.path)}-error`} message={props.errors[props.path]} />
                </div>
            );
        default:
            return <TextInput {...props} field={field} />;
    }
}

function ErrorText({ id, message }: { id: string; message?: string }) {
    return message ? <p id={id} className="mt-1.5 text-sm font-medium text-danger">{message}</p> : null;
}

/** Renders *starred* words in green, the way headings appear on the website. */
export function HighlightPreview({ text }: { text: string }) {
    return (
        <span className="font-display font-extrabold tracking-[-0.02em]">
            {text.split("\n").map((line, lineIndex) => (
                <span key={lineIndex} className="block">
                    {line.split(/(\*[^*]+\*)/g).map((part, index) =>
                        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
                            <span key={index} className="text-green">{part.slice(1, -1)}</span>
                        ) : (
                            <span key={index}>{part}</span>
                        ),
                    )}
                </span>
            ))}
        </span>
    );
}

function TextInput({ field, value, path, onChange, errors, labelHidden }: FieldInputProps & { field: Extract<Field, { type: "text" | "textarea" | "heading" }> }) {
    const id = idFor(path);
    const text = typeof value === "string" ? value : "";
    const error = errors[path];
    const multiline = field.type !== "text";
    const describedBy = [error && `${id}-error`, `${id}-hint`].filter(Boolean).join(" ");

    return (
        <div>
            <label htmlFor={id} className={labelHidden ? "sr-only" : "block text-[15px] font-medium"}>
                {field.label} {!field.required && <span className="font-normal text-muted">(optional)</span>}
            </label>
            {multiline ? (
                <textarea
                    id={id}
                    value={text}
                    rows={field.type === "heading" ? Math.max(2, text.split("\n").length) : field.rows ?? 3}
                    onChange={(event) => onChange(event.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={`${inputClass} resize-y leading-relaxed`}
                />
            ) : (
                <input
                    id={id}
                    value={text}
                    type={field.format === "email" ? "email" : field.format === "url" ? "url" : field.format === "tel" ? "tel" : "text"}
                    placeholder={field.placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={inputClass}
                />
            )}
            {field.type === "heading" && text.trim() && (
                <div aria-hidden="true" className="mt-2 rounded-xl border border-line bg-ink px-4 py-3 text-xl leading-tight">
                    <HighlightPreview text={text} />
                </div>
            )}
            <p id={`${id}-hint`} className="mt-1.5 flex justify-between gap-3 text-sm text-muted">
                <span>{field.hint}</span>
                <span className={text.length > field.max ? "font-semibold text-danger" : ""}>{text.length}/{field.max}</span>
            </p>
            <ErrorText id={`${id}-error`} message={error} />
        </div>
    );
}

function GroupInput({ field, value, path, onChange, errors, imagesEnabled }: FieldInputProps & { field: Extract<Field, { type: "group" }> }) {
    const values = isRecord(value) ? value : {};
    return (
        <fieldset className="space-y-5 rounded-[18px] border border-line p-5">
            <legend className="px-1 text-[15px] font-semibold">{field.label}</legend>
            {field.hint && <p className="-mt-2 text-sm text-muted">{field.hint}</p>}
            {field.fields.map((child) => (
                <FieldInput
                    key={child.key}
                    field={child}
                    value={values[child.key]}
                    path={`${path}.${child.key}`}
                    onChange={(next) => onChange({ ...values, [child.key]: next })}
                    errors={errors}
                    imagesEnabled={imagesEnabled}
                />
            ))}
        </fieldset>
    );
}

const move = <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

function ListControls({ index, count, min, label, onMove, onRemove }: { index: number; count: number; min: number; label: string; onMove: (to: number) => void; onRemove: () => void }) {
    return (
        <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className={smallButton} aria-label={`Move ${label} up`}>↑</button>
            <button type="button" onClick={() => onMove(index + 1)} disabled={index === count - 1} className={smallButton} aria-label={`Move ${label} down`}>↓</button>
            <button type="button" onClick={onRemove} disabled={count <= min} className={`${smallButton} text-danger`} aria-label={`Remove ${label}`}>Remove</button>
        </div>
    );
}

function ListInput({ field, value, path, onChange, errors, imagesEnabled, labelHidden }: FieldInputProps & { field: ListField }) {
    const items = Array.isArray(value) ? (value as PageValues[]) : [];
    const min = field.min ?? 0;
    const fixed = min === field.max;

    return (
        <div>
            <p className={labelHidden ? "text-sm text-muted" : "text-[15px] font-medium"}>
                {field.label} <span className="font-normal text-muted">({items.length}{fixed ? "" : ` of up to ${field.max}`})</span>
            </p>
            {field.hint && <p className="mt-1 text-sm text-muted">{field.hint}</p>}
            <ErrorText id={`${idFor(path)}-error`} message={errors[path]} />
            <ol className="mt-3 space-y-3">
                {items.map((item, index) => {
                    const title = field.titleKey && typeof item[field.titleKey] === "string" ? (item[field.titleKey] as string) : "";
                    const label = `${field.itemLabel} ${index + 1}`;
                    return (
                        <li key={index} className="rounded-[16px] border border-line bg-ink-raised p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="min-w-0 truncate text-sm font-semibold text-soft">
                                    {label}{title && <span className="font-normal text-muted"> · {title}</span>}
                                </p>
                                {!fixed && (
                                    <ListControls
                                        index={index}
                                        count={items.length}
                                        min={min}
                                        label={label}
                                        onMove={(to) => onChange(move(items, index, to))}
                                        onRemove={() => onChange(items.filter((_, position) => position !== index))}
                                    />
                                )}
                            </div>
                            <div className="space-y-4">
                                {field.fields.map((child) => (
                                    <FieldInput
                                        key={child.key}
                                        field={child}
                                        value={item[child.key]}
                                        path={`${path}.${index}.${child.key}`}
                                        onChange={(next) => onChange(items.map((current, position) => (position === index ? { ...current, [child.key]: next } : current)))}
                                        errors={errors}
                                        imagesEnabled={imagesEnabled}
                                    />
                                ))}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {!fixed && (
                <button
                    type="button"
                    onClick={() => onChange([...items, emptyItem(field)])}
                    disabled={items.length >= field.max}
                    className="mt-3 rounded-full border border-dashed border-slate px-4 py-2 text-sm font-semibold text-soft transition-colors hover:border-green hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    + Add {field.itemLabel.toLowerCase()}
                </button>
            )}
        </div>
    );
}

function StringListInput({ field, value, path, onChange, errors, labelHidden }: FieldInputProps & { field: StringListField }) {
    const items = Array.isArray(value) ? (value as string[]) : [];
    const min = field.min ?? 0;
    const fixed = min === field.max;

    return (
        <div>
            <p className={labelHidden ? "text-sm text-muted" : "text-[15px] font-medium"}>
                {field.label} <span className="font-normal text-muted">({items.length}{fixed ? "" : ` of up to ${field.max}`})</span>
            </p>
            {field.hint && <p className="mt-1 text-sm text-muted">{field.hint}</p>}
            <ErrorText id={`${idFor(path)}-error`} message={errors[path]} />
            <ol className="mt-2 space-y-2">
                {items.map((item, index) => {
                    const itemPath = `${path}.${index}`;
                    const id = idFor(itemPath);
                    const label = `${field.itemLabel} ${index + 1}`;
                    return (
                        <li key={index}>
                            <div className="flex items-center gap-2">
                                <label htmlFor={id} className="sr-only">{label}</label>
                                <input
                                    id={id}
                                    value={item}
                                    maxLength={field.itemMax + 20}
                                    onChange={(event) => onChange(items.map((current, position) => (position === index ? event.target.value : current)))}
                                    aria-invalid={errors[itemPath] ? true : undefined}
                                    aria-describedby={errors[itemPath] ? `${id}-error` : undefined}
                                    className="w-full rounded-xl border border-slate bg-surface px-3 py-2 text-[15px] text-white focus:border-green focus:outline-none aria-[invalid=true]:border-danger"
                                />
                                {!fixed && (
                                    <ListControls
                                        index={index}
                                        count={items.length}
                                        min={min}
                                        label={label}
                                        onMove={(to) => onChange(move(items, index, to))}
                                        onRemove={() => onChange(items.filter((_, position) => position !== index))}
                                    />
                                )}
                            </div>
                            <ErrorText id={`${id}-error`} message={errors[itemPath]} />
                        </li>
                    );
                })}
            </ol>
            {!fixed && (
                <button
                    type="button"
                    onClick={() => onChange([...items, ""])}
                    disabled={items.length >= field.max}
                    className="mt-2 rounded-full border border-dashed border-slate px-4 py-2 text-sm font-semibold text-soft transition-colors hover:border-green hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    + Add {field.itemLabel.toLowerCase()}
                </button>
            )}
        </div>
    );
}
