type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
    hint?: string;
};

// Labelled input with an inline error, linked for screen readers.
export function Field({ label, name, error, hint, id = name, className = "", ...input }: FieldProps) {
    const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-[15px] font-medium">{label}</label>
            <input
                id={id}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className="mt-2 w-full rounded-[14px] border border-slate bg-surface px-4 py-3 text-base text-white transition-colors placeholder:text-faint focus:border-green focus:outline-none aria-[invalid=true]:border-danger"
                {...input}
            />
            {hint && !error && <p id={`${id}-hint`} className="mt-2 text-sm text-muted">{hint}</p>}
            {error && <p id={`${id}-error`} className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
    );
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    name: string;
    error?: string;
    options: { value: string; label: string }[];
};

export function SelectField({ label, name, error, options, id = name, className = "", ...select }: SelectFieldProps) {
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-[15px] font-medium">{label}</label>
            <select
                id={id}
                name={name}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="mt-2 w-full rounded-[14px] border border-slate bg-surface px-4 py-3 text-base text-white focus:border-green focus:outline-none"
                {...select}
            >
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {error && <p id={`${id}-error`} className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
    );
}
