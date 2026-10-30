"use client";

import { useActionState } from "react";
import { changeRole, setUserActive } from "@/app/(cms)/users/actions";
import { SubmitButton } from "@/components/ui/Button";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/auth/roles";
import { initialFormState, type FormState } from "@/lib/form-state";

type UserActionsProps = {
    user: { id: string; name: string; role: Role; active: boolean };
};

export function UserActions({ user }: UserActionsProps) {
    const [roleState, saveRole] = useActionState(
        (previous: FormState, formData: FormData) => changeRole(user.id, previous, formData),
        initialFormState,
    );
    const [activeState, toggleActive] = useActionState(() => setUserActive(user.id, !user.active), initialFormState);
    const state = activeState.message ? activeState : roleState;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                <form action={saveRole} className="flex items-center gap-2">
                    <label htmlFor={`role-${user.id}`} className="sr-only">Role for {user.name}</label>
                    <select
                        id={`role-${user.id}`}
                        name="role"
                        defaultValue={user.role}
                        key={user.role}
                        className="rounded-full border border-slate bg-surface px-3 py-2 text-sm text-white focus:border-green focus:outline-none"
                    >
                        {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                    </select>
                    <SubmitButton variant="outline" size="sm" pendingLabel="Saving…">Save</SubmitButton>
                </form>
                <form
                    action={toggleActive}
                    onSubmit={(event) => {
                        if (user.active && !window.confirm(`Deactivate ${user.name}? They'll be signed out and can't sign in until reactivated.`)) {
                            event.preventDefault();
                        }
                    }}
                >
                    <SubmitButton variant={user.active ? "danger" : "outline"} size="sm" pendingLabel={user.active ? "Deactivating…" : "Reactivating…"}>
                        {user.active ? "Deactivate" : "Reactivate"}
                    </SubmitButton>
                </form>
            </div>
            {state.message && (
                <p role={state.tone === "error" ? "alert" : "status"} className={`mt-2 text-right text-sm ${state.tone === "error" ? "text-danger" : "text-green"}`}>
                    {state.message}
                </p>
            )}
        </div>
    );
}
