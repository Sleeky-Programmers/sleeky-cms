import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/cms/NavLinks";
import { SignOutButton } from "@/components/cms/SignOutButton";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { requireUser } from "@/lib/session";

// Signed-in area. The frame renders immediately; the parts that depend on who
// is signed in stream in behind Suspense (required with Cache Components).
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-ink-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="Sleeky CMS home" className="flex items-center gap-3">
              <Image src="/brand/logo-on-dark.svg" alt="Sleeky Programmers" width={98} height={35} priority />
              <span className="rounded-full border border-slate px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">CMS</span>
            </Link>
            <Suspense fallback={null}>
              <MainNav />
            </Suspense>
          </div>
          <Suspense fallback={<div className="h-9 w-40 animate-pulse rounded-full bg-line" />}>
            <AccountMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}

async function MainNav() {
  const user = await requireUser();
  return <NavLinks isAdmin={user.role === "admin"} />;
}

async function AccountMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-4">
      <div className="text-right leading-tight">
        <p className="text-[15px] font-semibold">{user.name}</p>
        <p className="text-xs text-muted">{ROLE_LABELS[user.role]} · {user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
