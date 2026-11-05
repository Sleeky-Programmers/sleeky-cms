// Shared by server and client components (links styled as buttons, submit buttons).
export type ButtonVariant = "primary" | "outline" | "danger" | "ghost";

const variants: Record<ButtonVariant, string> = {
    primary: "bg-green text-ink hover:bg-green-hover",
    outline: "border border-slate text-white hover:border-green",
    danger: "border border-danger/50 text-danger hover:bg-danger/10",
    ghost: "text-green hover:text-green-hover",
};

export const buttonClass = (variant: ButtonVariant = "primary", size: "md" | "sm" = "md") =>
    `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        size === "md" ? "px-6 py-3 text-[15px]" : "px-4 py-2 text-sm"
    } ${variants[variant]}`;
