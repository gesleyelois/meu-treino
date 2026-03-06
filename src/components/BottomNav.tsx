"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
    {
        key: "home" as const,
        href: "/",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        key: "manage" as const,
        href: "/manage",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        ),
    },
    {
        key: "history" as const,
        href: "/history",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const t = useTranslations("nav");
    const pathname = usePathname();

    // Extract locale prefix from pathname
    const segments = pathname.split("/");
    const locale = segments[1] || "pt-BR";
    const currentPath = "/" + segments.slice(2).join("/");

    // Hide bottom nav during active workout
    if (currentPath.startsWith("/workout/")) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50">
            <div className="max-w-lg mx-auto flex items-center justify-around h-16">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? currentPath === "/" || currentPath === ""
                            : currentPath.startsWith(item.href);

                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors
                ${isActive ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">{t(item.key)}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
