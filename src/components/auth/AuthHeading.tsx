export function AuthHeading({ title, intro }: { title: string; intro?: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-[-0.03em]">{title}</h1>
            {intro && <p className="mt-2 text-[15px] leading-relaxed text-muted">{intro}</p>}
        </div>
    );
}

export function FormSkeleton({ fields = 2 }: { fields?: number }) {
    return (
        <div aria-hidden="true" className="animate-pulse space-y-5">
            {Array.from({ length: fields }, (_, index) => (
                <div key={index}>
                    <div className="h-4 w-24 rounded bg-line" />
                    <div className="mt-2 h-12 rounded-[14px] bg-line/60" />
                </div>
            ))}
            <div className="h-12 rounded-full bg-line" />
        </div>
    );
}
