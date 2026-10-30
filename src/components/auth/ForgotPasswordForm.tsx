"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { initialFormState } from "@/lib/form-state";

export function ForgotPasswordForm() {
    const [state, action] = useActionState(requestPasswordReset, initialFormState);

    if (state.tone === "success") {
        return (
            <div className="space-y-6">
                <Notice tone="success">{state.message}</Notice>
                <Link href="/sign-in" className="inline-block text-sm font-medium text-green hover:text-green-hover">Back to sign in</Link>
            </div>
        );
    }

    return (
        <form action={action} noValidate className="space-y-5">
            {state.message && <Notice tone="error">{state.message}</Notice>}
            <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                defaultValue={state.values?.email}
                error={state.errors?.email}
            />
            <SubmitButton pendingLabel="Sending…" className="w-full">Send reset link</SubmitButton>
            <Link href="/sign-in" className="block text-center text-sm font-medium text-green hover:text-green-hover">Back to sign in</Link>
        </form>
    );
}
