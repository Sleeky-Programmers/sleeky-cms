"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { initialFormState } from "@/lib/form-state";
import { PASSWORD_MIN } from "@/lib/limits";

export function ResetPasswordForm({ token }: { token: string }) {
    const [state, action] = useActionState(resetPassword, initialFormState);

    return (
        <form action={action} noValidate className="space-y-5">
            {state.message && (
                <Notice tone="error">
                    {state.message}{" "}
                    <Link href="/forgot-password" className="font-semibold underline underline-offset-4">Request a new link</Link>
                </Notice>
            )}
            <input type="hidden" name="token" value={token} />
            <Field
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                autoFocus
                minLength={PASSWORD_MIN}
                hint={`At least ${PASSWORD_MIN} characters.`}
                error={state.errors?.password}
            />
            <Field
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                error={state.errors?.confirmPassword}
            />
            <SubmitButton pendingLabel="Saving…" className="w-full">Save new password</SubmitButton>
        </form>
    );
}
