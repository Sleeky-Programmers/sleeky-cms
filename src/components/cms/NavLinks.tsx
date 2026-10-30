"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/", label: "Dashboard", adminOnly: false },
    { href: "/users", label: "Users", adminOnly: true },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    return (
        <nav aria-label="Main" className="flex items-center gap-1">
            {links
                .filter((link) => isAdmin || !link.adminOnly)
                .map((link) => {
                    const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={current ? "page" : undefined}
                            className="rounded-full px-4 py-2 text-[15px] font-medium text-soft transition-colors hover:text-white aria-[current=page]:bg-surface aria-[current=page]:text-white"
                        >
                            {link.label}
                        </Link>
                    );
                })}
        </nav>
    );
}
