import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/AuthHeading";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Forgot your password?" intro="Enter your email and we'll send you a link to choose a new one." />
      <ForgotPasswordForm />
    </>
  );
}
