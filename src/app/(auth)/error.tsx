"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function AuthError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
