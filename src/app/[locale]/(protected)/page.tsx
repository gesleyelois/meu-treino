"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { refreshCatalog, syncPendingLogs, registerSyncOnReconnect } from "@/lib/sync";
import { type CatalogSplit } from "@/lib/db";
import SyncBadge from "@/components/SyncBadge";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import ExerciseThumb from "@/components/ExerciseThumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Home() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "pt-BR";

  const [splits, setSplits] = useState<CatalogSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await refreshCatalog();
    setSplits(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    registerSyncOnReconnect();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPendingLogs();
      if (result.synced > 0) {
        alert(`✅ ${t("syncSuccess", { count: result.synced })}`);
      } else {
        alert(t("syncNone"));
      }
    } catch {
      alert(t("syncError"));
    }
    setSyncing(false);
  };

  return (
    <div className="page-enter px-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="pt-safe-top sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-xl pb-4 pt-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <SyncBadge />
          </div>
        </div>
      </header>

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="w-full mb-6 h-12 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 
                   rounded-xl text-sm text-zinc-300 font-medium transition-colors
                   flex items-center justify-center gap-2 active:scale-[0.98]
                   disabled:opacity-50"
      >
        <svg
          className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
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
        {syncing ? t("syncing") : t("syncButton")}
      </button>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">{t("loading")}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && splits.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">{t("noRoutines")}</p>
          <p className="text-zinc-500 text-sm mt-1">{t("checkConnection")}</p>
        </div>
      )}

      {/* Workout Cards */}
      <div className="flex flex-col gap-4">
        {splits.map((split, index) => {
          const isCompleted = split.logs && split.logs.length > 0;
          return (
            <div
              key={split.id}
              className={`border rounded-2xl p-5 
                         transition-all duration-200
                         ${isCompleted
                  ? "bg-zinc-900/40 border-zinc-800/40 opacity-70"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-950/20"
                }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${isCompleted ? 'text-zinc-300' : 'text-zinc-50'}`}>
                    {split.name}
                    {isCompleted && (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </h2>
                  {split.description && (
                    <p className="text-sm text-zinc-500 mt-0.5">{split.description}</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${isCompleted ? 'bg-zinc-800/50 text-zinc-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  {split.exercises.length} {t("exercises")}
                </span>
              </div>

              <div className={`flex flex-col gap-2 mb-4 ${isCompleted ? 'grayscale opacity-70' : ''}`}>
                {split.exercises.map((we) => (
                  <div
                    key={we.id}
                    className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-3 py-2.5"
                  >
                    <ExerciseThumb mediaUrl={we.exercise.mediaUrl} name={we.exercise.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {we.exercise.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {we.sets}×{we.targetReps} · {we.exercise.muscleGroup} ·{" "}
                        {we.restTimeSeconds}s {t("rest")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href={`/${locale}/workout/${split.id}`}>
                <button
                  className={`w-full h-14 rounded-xl 
                             font-bold text-base transition-all active:scale-[0.97]
                             ${isCompleted
                      ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-700/50"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"}`}
                >
                  {isCompleted ? t("workoutCompleted") : t("startWorkout")}
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
