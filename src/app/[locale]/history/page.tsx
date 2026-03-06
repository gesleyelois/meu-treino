"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import CalendarView from "@/components/CalendarView";

interface ExerciseLogEntry {
    id: string;
    setNumber: number;
    repsCompleted: number;
    weightUsed: number;
    exercise: {
        name: string;
        muscleGroup: string;
    };
}

interface WorkoutLogEntry {
    id: string;
    date: string;
    status: string;
    workoutSplit: {
        name: string;
    };
    exerciseLogs: ExerciseLogEntry[];
}

export default function HistoryPage() {
    const t = useTranslations("history");
    const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/history");
                if (res.ok) setLogs(await res.json());
            } catch {
                console.error("Failed to fetch history");
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Group exercise logs by exercise for display
    const groupByExercise = (exerciseLogs: ExerciseLogEntry[]) => {
        const groups: Record<string, { name: string; muscleGroup: string; sets: ExerciseLogEntry[] }> = {};
        for (const log of exerciseLogs) {
            const key = log.exercise.name;
            if (!groups[key]) {
                groups[key] = { name: log.exercise.name, muscleGroup: log.exercise.muscleGroup, sets: [] };
            }
            groups[key].sets.push(log);
        }
        return Object.values(groups);
    };

    // Filter logs by selected date
    const filteredLogs = useMemo(() => {
        if (!selectedDate) return logs;
        const key = selectedDate.toISOString().slice(0, 10);
        return logs.filter((log) => new Date(log.date).toISOString().slice(0, 10) === key);
    }, [logs, selectedDate]);

    return (
        <div className="page-enter px-4 pb-8 max-w-lg mx-auto">
            <header className="pt-6 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-zinc-400 mt-0.5">{t("subtitle")}</p>
            </header>

            {loading && (
                <div className="flex flex-col items-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-400">{t("loading")}</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* Calendar */}
                    <CalendarView
                        logs={logs}
                        onSelectDate={setSelectedDate}
                        selectedDate={selectedDate}
                    />

                    {/* Selected date label */}
                    {selectedDate && (
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-zinc-300 font-medium">
                                {selectedDate.toLocaleDateString(undefined, {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}
                            </p>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {t("showAll")}
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-zinc-400 text-lg">
                                {selectedDate ? t("noWorkoutsOnDate") : t("noHistory")}
                            </p>
                            <p className="text-zinc-500 text-sm mt-1">
                                {selectedDate ? "" : t("noHistoryDesc")}
                            </p>
                        </div>
                    )}

                    {/* Workout logs */}
                    <div className="flex flex-col gap-3">
                        {filteredLogs.map((log) => {
                            const isExpanded = expandedLog === log.id;
                            const exerciseGroups = groupByExercise(log.exerciseLogs);

                            return (
                                <div
                                    key={log.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all"
                                >
                                    {/* Header */}
                                    <button
                                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                        className="w-full p-4 flex items-center justify-between text-left"
                                    >
                                        <div>
                                            <h3 className="font-bold text-zinc-100">{log.workoutSplit.name}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">{formatDate(log.date)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${log.status === "synced"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    }`}
                                            >
                                                {log.status === "synced" ? t("synced") : t("pending")}
                                            </span>
                                            <svg
                                                className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-zinc-800/50">
                                            {exerciseGroups.map((group, i) => (
                                                <div key={i} className="mt-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-medium text-zinc-200">{group.name}</span>
                                                        <span className="text-xs text-zinc-500">{group.muscleGroup}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 text-xs text-zinc-500 mb-1 px-2">
                                                        <span>{t("sets")}</span>
                                                        <span>{t("reps")}</span>
                                                        <span>{t("kg")}</span>
                                                    </div>
                                                    {group.sets.map((s) => (
                                                        <div
                                                            key={s.id}
                                                            className="grid grid-cols-3 gap-1 bg-zinc-800/50 rounded-lg px-2 py-2 mb-1 text-sm"
                                                        >
                                                            <span className="text-zinc-400 tabular-nums">{s.setNumber}</span>
                                                            <span className="text-zinc-200 font-medium tabular-nums">{s.repsCompleted}</span>
                                                            <span className="text-zinc-200 font-medium tabular-nums">{s.weightUsed}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
