type NoticeProps = {
    tone?: "error" | "success" | "info";
    children: React.ReactNode;
    className?: string;
};

const tones = {
    error: "border-danger/40 bg-danger/10 text-[#FFC2C2]",
    success: "border-green/40 bg-green-deep text-[#C9F5DA]",
    info: "border-slate bg-surface text-soft",
};

export function Notice({ tone = "info", children, className = "" }: NoticeProps) {
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-[15px] leading-relaxed ${tones[tone]} ${className}`}>
            {children}
        </div>
    );
}
