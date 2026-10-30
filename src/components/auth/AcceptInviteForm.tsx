"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { initialFormState } from "@/lib/form-state";
import { PASSWORD_MIN } from "@/lib/limits";

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
    const [state, action] = useActionState(acceptInvite, initialFormState);

    return (
        <form action={action} noValidate className="space-y-5">
            {state.message && <Notice tone="error">{state.message}</Notice>}
            <input type="hidden" name="token" value={token} />
            <div>
                <p className="text-[15px] font-medium">Email</p>
                <p className="mt-2 rounded-[14px] border border-line bg-ink-raised px-4 py-3 text-base text-soft">{email}</p>
            </div>
            <Field
                label="Your name"
                name="name"
                autoComplete="name"
                required
                autoFocus
                defaultValue={state.values?.name}
                error={state.errors?.name}
            />
            <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
                hint={`At least ${PASSWORD_MIN} characters.`}
                error={state.errors?.password}
            />
            <Field
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                error={state.errors?.confirmPassword}
            />
            <SubmitButton pendingLabel="Setting up…" className="w-full">Create my account</SubmitButton>
        </form>
    );
}
