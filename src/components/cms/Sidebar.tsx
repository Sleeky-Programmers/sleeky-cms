"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";
import { SignOutButton } from "./SignOutButton";

type SidebarUser = { name: string; email: string; role: Role };

const iconProps = {
    "aria-hidden": true,
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

const icons = {
    dashboard: (
        <svg {...iconProps}>
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
    ),
    insights: (
        <svg {...iconProps}>
            <path d="M6 3h9l4 4v14H6z" />
            <path d="M14 3v5h5M9 13h7M9 17h5" />
        </svg>
    ),
    work: (
        <svg {...iconProps}>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
        </svg>
    ),
    pages: (
        <svg {...iconProps}>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 13h8M8 16h5" />
        </svg>
    ),
    settings: (
        <svg {...iconProps}>
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
        </svg>
    ),
    users: (
        <svg {...iconProps}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
            <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-3-5.5" />
        </svg>
    ),
};

type NavItem = { href: string; label: string; icon: keyof typeof icons; adminOnly?: boolean };
type NavSection = { title?: string; items: NavItem[] };

// Add new CMS features here.
const SECTIONS: NavSection[] = [
    { items: [{ href: "/", label: "Dashboard", icon: "dashboard" }] },
    {
        title: "Content",
        items: [
            { href: "/insights", label: "Insights", icon: "insights" },
            { href: "/case-studies", label: "Case studies", icon: "work" },
            { href: "/pages", label: "Pages", icon: "pages" },
            { href: "/pages/site", label: "Site settings", icon: "settings" },
        ],
    },
    { title: "Admin", items: [{ href: "/users", label: "Users", icon: "users", adminOnly: true }] },
];

const matches = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

/** The most specific link for this page (e.g. "Site settings" rather than "Pages" on /pages/site). */
const currentHref = (pathname: string) =>
    SECTIONS.flatMap((section) => section.items)
        .filter((item) => matches(pathname, item.href))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href;

function Brand() {
    return (
        <Link href="/" aria-label="Sleeky CMS home" className="flex items-center gap-3">
            <Image src="/brand/logo-on-dark.svg" alt="Sleeky Programmers" width={98} height={35} priority />
            <span className="rounded-full border border-slate px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">CMS</span>
        </Link>
    );
}

function SidebarContent({ user, onNavigate }: { user: SidebarUser; onNavigate?: () => void }) {
    const pathname = usePathname();
    const sections = SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.adminOnly || user.role === "admin"),
    })).filter((section) => section.items.length > 0);

    return (
        <div className="flex h-full flex-col">
            <div className="px-5 pb-6 pt-6">
                <Brand />
            </div>

            <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3">
                {sections.map((section, index) => (
                    <div key={section.title ?? index}>
                        {section.title && (
                            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{section.title}</p>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const current = item.href === currentHref(pathname);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            aria-current={current ? "page" : undefined}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-soft transition-colors hover:bg-surface hover:text-white aria-[current=page]:bg-green-deep aria-[current=page]:text-green"
                                        >
                                            {icons[item.icon]}
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="border-t border-line p-4">
                <div className="mb-3 min-w-0 px-1">
                    <p className="truncate text-[15px] font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{ROLE_LABELS[user.role]} · {user.email}</p>
                </div>
                <SignOutButton />
            </div>
        </div>
    );
}

/** Sidebar on large screens; a top bar with a slide-in menu on phones and tablets. */
export function Sidebar({ user }: { user: SidebarUser }) {
    const pathname = usePathname();
    // The menu remembers which page it was opened on, so it closes by itself
    // whenever the page changes (links, back/forward).
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const menuButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const returnFocusTo = menuButton.current;
        closeButton.current?.focus();
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
            returnFocusTo?.focus();
        };
    }, [open]);

    return (
        <>
            {/* Phones and tablets: top bar with a menu button */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ink-raised px-4 py-3 lg:hidden">
                <Brand />
                <button
                    ref={menuButton}
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-controls="cms-menu"
                    className="rounded-full border border-slate px-4 py-2 text-sm font-semibold"
                >
                    Menu
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/70" />
                    <div id="cms-menu" role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 w-[min(300px,85vw)] border-r border-line bg-ink-raised shadow-[0_0_60px_#00000099]">
                        <button
                            ref={closeButton}
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-6 rounded-full border border-slate px-3 py-1.5 text-sm font-semibold"
                        >
                            Close
                        </button>
                        <SidebarContent user={user} onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}

            {/* Large screens: fixed sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-ink-raised lg:block">
                <SidebarContent user={user} />
            </aside>
        </>
    );
}

/** Shown while the signed-in user loads. */
export function SidebarSkeleton() {
    return (
        <>
            <div className="h-[61px] border-b border-line bg-ink-raised lg:hidden" />
            <div aria-hidden="true" className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-ink-raised p-5 lg:block">
                <div className="h-9 w-36 animate-pulse rounded-lg bg-line" />
                <div className="mt-8 space-y-3">
                    {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded-xl bg-line/60" />)}
                </div>
            </div>
        </>
    );
}
