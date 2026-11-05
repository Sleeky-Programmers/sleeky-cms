"use client";

import { useActionState } from "react";
import { inviteUser } from "@/app/(cms)/users/actions";
import { SubmitButton } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES } from "@/lib/auth/roles";
import { initialFormState } from "@/lib/form-state";
import { CopyLink } from "./CopyLink";

export function InviteForm() {
    const [state, action] = useActionState(inviteUser, initialFormState);
    const succeeded = state.tone === "success";

    return (
        <form action={action} noValidate className="space-y-4">
            {state.message && (
                <Notice tone={state.tone}>
                    {state.message}
                    {state.link && <CopyLink link={state.link} />}
                </Notice>
            )}
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field
                    // Reset the email field after each successful invite.
                    key={succeeded ? state.link : "draft"}
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    placeholder="name@sleekyprogrammers.com"
                    required
                    defaultValue={succeeded ? "" : state.values?.email}
                    error={state.errors?.email}
                />
                <SelectField
                    label="Role"
                    name="role"
                    defaultValue={state.values?.role ?? "editor"}
                    error={state.errors?.role}
                    options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
                />
            </div>
            <p className="text-sm text-muted">
                {ROLES.map((role) => `${ROLE_LABELS[role]}: ${ROLE_DESCRIPTIONS[role]}`).join(" ")}
            </p>
            <SubmitButton pendingLabel="Sending invite…">Send invite</SubmitButton>
        </form>
    );
}
