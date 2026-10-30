import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading, FormSkeleton } from "@/components/auth/AuthHeading";
import { SignInForm } from "@/components/auth/SignInForm";
import { safeRedirectPath } from "@/lib/security";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };


export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <>
      <AuthHeading title="Sign in" intro="Use the email address your invite was sent to." />
      <Suspense fallback={<FormSkeleton />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SignIn({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : undefined;

  // Already signed in: skip the form.
  if (await getCurrentUser()) redirect(next ?? "/");

  const notice =
    params.reset === "done"
      ? "Your password has been changed. Sign in with your new password."
      : params.invited === "done"
        ? "Your account is ready. Sign in to continue."
        : undefined;

  return <SignInForm next={next !== "/" ? next : undefined} notice={notice} />;
}
