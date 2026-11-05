import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";
import { AuthHeading, FormSkeleton } from "@/components/auth/AuthHeading";
import { Notice } from "@/components/ui/Notice";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { findInvitationByToken } from "@/lib/invitations";

export const metadata: Metadata = { title: "Accept invite" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<><AuthHeading title="Join Sleeky CMS" /><FormSkeleton fields={3} /></>}>
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: Pick<PageProps<"/invite/[token]">, "params">) {
  const { token } = await params;
  // Single-use, time-limited links: always check at request time, never prerender.
  await connection();
  const invitation = await findInvitationByToken(token);

  if (!invitation || invitation.status !== "pending") {
    const reason =
      invitation?.status === "accepted"
        ? "This invite has already been used. If it was yours, sign in with the password you chose."
        : invitation?.status === "expired"
          ? "This invite has expired. Ask an admin to send you a new one."
          : "This invite link isn't valid any more. Ask an admin to send you a new one.";
    return (
      <>
        <AuthHeading title="Invite unavailable" />
        <div className="space-y-6">
          <Notice tone="error">{reason}</Notice>
          <Link href="/sign-in" className="inline-block text-sm font-medium text-green hover:text-green-hover">Go to sign in</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Join Sleeky CMS"
        intro={<>You&rsquo;ve been invited as an <strong className="text-white">{ROLE_LABELS[invitation.role]}</strong>. Choose your name and a password to finish setting up your account.</>}
      />
      <AcceptInviteForm token={token} email={invitation.email} />
    </>
  );
}
