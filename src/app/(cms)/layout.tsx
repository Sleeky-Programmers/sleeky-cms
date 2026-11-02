import { Suspense } from "react";
import { Sidebar, SidebarSkeleton } from "@/components/cms/Sidebar";
import { requireUser } from "@/lib/session";

// Signed-in area: sidebar navigation plus the page. The frame renders
// immediately; the parts that depend on who is signed in stream in behind
// Suspense (required with Cache Components).
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <CmsSidebar />
      </Suspense>
      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}

async function CmsSidebar() {
  const user = await requireUser();
  return <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />;
}
