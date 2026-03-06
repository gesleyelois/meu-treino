"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export default function LocaleSwitcher() {
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations("sync");

    const segments = pathname.split("/");
    const currentLocale = segments[1] || "pt-BR";

    const switchLocale = (newLocale: string) => {
        const newPath = "/" + newLocale + "/" + segments.slice(2).join("/");
        router.push(newPath);
    };

    return (
        <button
            onClick={() => switchLocale(currentLocale === "pt-BR" ? "en" : "pt-BR")}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 
                 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300 
                 transition-colors"
            title={t("online")}
        >
            {currentLocale === "pt-BR" ? "🇧🇷 PT" : "🇺🇸 EN"}
        </button>
    );
}
