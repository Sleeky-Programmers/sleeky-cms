"use client";

import { signOut } from "@/app/(cms)/actions";
import { SubmitButton } from "@/components/ui/Button";

// Signs out, then does a full page load instead of a client-side navigation, so
// no signed-in pages stay in the browser's memory (it may be a shared computer).
export function SignOutButton() {
    return (
        <form
            action={async () => {
                await signOut();
                window.location.replace("/sign-in");
            }}
        >
            <SubmitButton variant="outline" size="sm" pendingLabel="Signing out…">Sign out</SubmitButton>
        </form>
    );
}
