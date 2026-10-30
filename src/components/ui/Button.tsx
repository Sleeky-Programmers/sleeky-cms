"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "./button-styles";

type SubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    pendingLabel?: string;
    variant?: ButtonVariant;
    size?: "md" | "sm";
};

/** Submit button that disables itself and shows progress while its form is submitting. */
export function SubmitButton({ children, pendingLabel, variant = "primary", size = "md", className = "", ...button }: SubmitButtonProps) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending || button.disabled} aria-disabled={pending} className={`${buttonClass(variant, size)} ${className}`} {...button}>
            {pending && pendingLabel ? pendingLabel : children}
        </button>
    );
}
