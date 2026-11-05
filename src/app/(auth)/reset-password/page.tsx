import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, FormSkeleton } from "@/components/auth/AuthHeading";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Notice } from "@/components/ui/Notice";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the emailed link: Better Auth checks the token, then redirects
// here with ?token=… (valid) or ?error=INVALID_TOKEN (expired or used).
export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <AuthHeading title="Choose a new password" />
      <Suspense fallback={<FormSkeleton />}>
        <ResetPassword searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ResetPassword({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, error } = await searchParams;

  if (error || typeof token !== "string" || !token) {
    return (
      <div className="space-y-6">
        <Notice tone="error">This reset link has expired or was already used.</Notice>
        <Link href="/forgot-password" className="inline-block text-sm font-medium text-green hover:text-green-hover">
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
