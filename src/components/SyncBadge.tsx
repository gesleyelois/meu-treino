"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getPendingSyncCount } from "@/lib/sync";

export default function SyncBadge() {
    const t = useTranslations("sync");
    const [count, setCount] = useState(0);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const updateCount = async () => {
            const c = await getPendingSyncCount();
            setCount(c);
        };

        updateCount();

        const interval = setInterval(updateCount, 5000);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
                <div
                    className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse-dot"
                        }`}
                />
                <span className="text-xs text-zinc-400">
                    {isOnline ? t("online") : t("offline")}
                </span>
            </div>

            {count > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
                    <svg
                        className="w-3.5 h-3.5 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span className="text-xs font-medium text-amber-500 tabular-nums">
                        {count}
                    </span>
                </div>
            )}
        </div>
    );
}
