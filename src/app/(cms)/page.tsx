import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-[28px] bg-surface" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Dashboard</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">
          Welcome, <span className="text-green">{firstName}</span>.
        </h1>
      </div>
      <section className="rounded-[28px] border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">Content tools are on the way</h2>
        <p className="mt-2 max-w-xl text-muted">
          Insights articles, case studies and page content will be managed here.
          {user.role === "admin" && " In the meantime, you can invite the rest of the team."}
        </p>
        {user.role === "admin" && (
          <Link href="/users" className={`${buttonClass("primary")} mt-6`}>Manage users</Link>
        )}
      </section>
    </div>
  );
}
