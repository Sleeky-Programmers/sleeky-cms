"use client";

import { useActionState } from "react";
import { cancelInvite, resendInvite } from "@/app/(cms)/users/actions";
import { SubmitButton } from "@/components/ui/Button";
import { initialFormState } from "@/lib/form-state";
import { CopyLink } from "./CopyLink";

export function InviteActions({ id, email }: { id: string; email: string }) {
    const [resent, resend] = useActionState(() => resendInvite(id), initialFormState);
    const [cancelled, cancel] = useActionState(() => cancelInvite(id), initialFormState);
    const state = cancelled.message ? cancelled : resent;

    return (
        <div>
            <div className="flex flex-wrap justify-end gap-2">
                <form action={resend}>
                    <SubmitButton variant="outline" size="sm" pendingLabel="Sending…">Resend</SubmitButton>
                </form>
                <form
                    action={cancel}
                    onSubmit={(event) => {
                        if (!window.confirm(`Cancel the invite for ${email}? Their link will stop working.`)) event.preventDefault();
                    }}
                >
                    <SubmitButton variant="danger" size="sm" pendingLabel="Cancelling…">Cancel</SubmitButton>
                </form>
            </div>
            {state.message && (
                <div role={state.tone === "error" ? "alert" : "status"} className={`mt-2 text-left text-sm ${state.tone === "error" ? "text-danger" : "text-green"}`}>
                    {state.message}
                    {state.link && <CopyLink link={state.link} />}
                </div>
            )}
        </div>
    );
}
