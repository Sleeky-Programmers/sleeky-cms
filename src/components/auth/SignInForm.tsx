"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { initialFormState } from "@/lib/form-state";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
    const [state, action] = useActionState(signIn, initialFormState);

    return (
        <form action={action} noValidate className="space-y-5">
            {notice && !state.message && <Notice tone="success">{notice}</Notice>}
            {state.message && <Notice tone={state.tone}>{state.message}</Notice>}
            {next && <input type="hidden" name="next" value={next} />}
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
            <div>
                <Field
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    error={state.errors?.password}
                />
                <Link href="/forgot-password" className="mt-2 inline-block text-sm font-medium text-green hover:text-green-hover">
                    Forgot your password?
                </Link>
            </div>
            <SubmitButton pendingLabel="Signing in…" className="w-full">Sign in</SubmitButton>
        </form>
    );
}
