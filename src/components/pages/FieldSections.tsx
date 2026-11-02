"use client";

import { Notice } from "@/components/ui/Notice";
import { isRecord, type Field, type PageValues } from "@/lib/pages/fields";
import { FieldInput } from "./FieldInput";

const sectionId = (key: string) => `section-${key}`;

type FieldSectionsProps = {
    fields: Field[];
    values: PageValues;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    imagesEnabled: boolean;
};

/** One card per top-level field; a group's fields are laid out inside its card. */
export function FieldSections({ fields, values, onChange, errors, imagesEnabled }: FieldSectionsProps) {
    const errorCount = Object.keys(errors).length;
    return (
        <>
            {errorCount > 0 && (
                <Notice tone="error">
                    {errorCount === 1 ? "1 field needs" : `${errorCount} fields need`} attention. They&rsquo;re highlighted below.
                </Notice>
            )}
            {fields.map((field) => (
                <section key={field.key} id={sectionId(field.key)} aria-labelledby={`${sectionId(field.key)}-title`} className="scroll-mt-24 rounded-[22px] border border-line bg-surface p-6">
                    <h2 id={`${sectionId(field.key)}-title`} className="font-display text-xl font-bold tracking-tight">{field.label}</h2>
                    {field.hint && <p className="mt-1 text-sm text-muted">{field.hint}</p>}
                    <div className="mt-5 space-y-5">
                        {field.type === "group" ? (
                            field.fields.map((child) => {
                                const group = isRecord(values[field.key]) ? (values[field.key] as PageValues) : {};
                                return (
                                    <FieldInput
                                        key={child.key}
                                        field={child}
                                        value={group[child.key]}
                                        path={`${field.key}.${child.key}`}
                                        onChange={(next) => onChange(field.key, { ...group, [child.key]: next })}
                                        errors={errors}
                                        imagesEnabled={imagesEnabled}
                                    />
                                );
                            })
                        ) : (
                            <FieldInput
                                field={{ ...field, hint: undefined } as Field}
                                labelHidden
                                value={values[field.key]}
                                path={field.key}
                                onChange={(next) => onChange(field.key, next)}
                                errors={errors}
                                imagesEnabled={imagesEnabled}
                            />
                        )}
                    </div>
                </section>
            ))}
        </>
    );
}

/** Jump links to each section, with a dot on sections that have errors. */
export function SectionNav({ fields, errors }: { fields: Field[]; errors: Record<string, string> }) {
    const links = fields.map((field) => ({
        href: `#${sectionId(field.key)}`,
        label: field.label,
        hasError: Object.keys(errors).some((path) => path === field.key || path.startsWith(`${field.key}.`)),
    }));
    return (
        <nav aria-label="Page sections" className="hidden rounded-[22px] border border-line bg-surface p-5 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Sections</p>
            <ul className="mt-3 space-y-1 text-sm">
                {links.map((link) => (
                    <li key={link.href}>
                        <a href={link.href} className="block rounded-lg px-2 py-1.5 text-soft hover:bg-ink-raised hover:text-white">
                            {link.label}
                            {link.hasError && <span className="ml-2 text-danger" aria-label="has errors">●</span>}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
