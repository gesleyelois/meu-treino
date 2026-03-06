"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

interface WorkoutLogEntry {
    id: string;
    date: string;
    status: string;
    workoutSplit: {
        name: string;
    };
    exerciseLogs: {
        id: string;
        setNumber: number;
        repsCompleted: number;
        weightUsed: number;
        exercise: {
            name: string;
            muscleGroup: string;
        };
    }[];
}

type ViewMode = "monthly" | "weekly" | "daily";

interface CalendarViewProps {
    logs: WorkoutLogEntry[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date | null;
}

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ logs, onSelectDate, selectedDate }: CalendarViewProps) {
    const t = useTranslations("history");
    const [viewMode, setViewMode] = useState<ViewMode>("monthly");
    const [currentDate, setCurrentDate] = useState(new Date());

    // Detect locale from translations
    const weekdays = t("monthly") === "Mensal" ? WEEKDAYS_PT : WEEKDAYS_EN;

    // Build a set of dates that have workouts (YYYY-MM-DD)
    const workoutDates = useMemo(() => {
        const map = new Map<string, number>();
        for (const log of logs) {
            const key = new Date(log.date).toISOString().slice(0, 10);
            map.set(key, (map.get(key) || 0) + 1);
        }
        return map;
    }, [logs]);

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);
    const isToday = (d: Date) => dateKey(d) === dateKey(new Date());
    const isSelected = (d: Date) => selectedDate ? dateKey(d) === dateKey(selectedDate) : false;

    // ── Monthly View ──
    const renderMonthly = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const cells: (Date | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));

        const monthName = currentDate.toLocaleDateString(t("monthly") === "Mensal" ? "pt-BR" : "en", {
            month: "long",
            year: "numeric",
        });

        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-zinc-200 capitalize">{monthName}</h3>
                    <button
                        onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekdays.map((day) => (
                        <div key={day} className="text-center text-[10px] text-zinc-500 uppercase font-medium py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} />;
                        const key = dateKey(date);
                        const count = workoutDates.get(key) || 0;
                        const today = isToday(date);
                        const selected = isSelected(date);

                        return (
                            <button
                                key={key}
                                onClick={() => onSelectDate(date)}
                                className={`
                                    relative aspect-square rounded-lg text-sm font-medium transition-all
                                    flex flex-col items-center justify-center gap-0.5
                                    ${selected
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                        : today
                                            ? "bg-zinc-800 text-emerald-400 ring-1 ring-emerald-600/50"
                                            : count > 0
                                                ? "bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
                                                : "text-zinc-500 hover:bg-zinc-800/50"
                                    }
                                `}
                            >
                                <span className="text-xs">{date.getDate()}</span>
                                {count > 0 && (
                                    <div className={`flex gap-0.5 ${selected ? "" : ""}`}>
                                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                                            <div
                                                key={j}
                                                className={`w-1 h-1 rounded-full ${selected ? "bg-white/80" : "bg-emerald-500"}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ── Weekly View ──
    const renderWeekly = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            days.push(d);
        }

        const weekLabel = `${days[0].toLocaleDateString(t("monthly") === "Mensal" ? "pt-BR" : "en", {
            day: "numeric",
            month: "short",
        })} — ${days[6].toLocaleDateString(t("monthly") === "Mensal" ? "pt-BR" : "en", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })}`;

        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() - 7);
                            setCurrentDate(d);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-zinc-200">{weekLabel}</h3>
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() + 7);
                            setCurrentDate(d);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((date) => {
                        const key = dateKey(date);
                        const count = workoutDates.get(key) || 0;
                        const today = isToday(date);
                        const selected = isSelected(date);

                        return (
                            <button
                                key={key}
                                onClick={() => onSelectDate(date)}
                                className={`
                                    flex flex-col items-center py-3 rounded-xl transition-all
                                    ${selected
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                        : today
                                            ? "bg-zinc-800 ring-1 ring-emerald-600/50"
                                            : "bg-zinc-800/50 hover:bg-zinc-800"
                                    }
                                `}
                            >
                                <span className={`text-[10px] uppercase font-medium mb-1 ${selected ? "text-white/80" : "text-zinc-500"}`}>
                                    {weekdays[date.getDay()]}
                                </span>
                                <span className={`text-sm font-bold ${selected ? "text-white" : today ? "text-emerald-400" : "text-zinc-200"}`}>
                                    {date.getDate()}
                                </span>
                                {count > 0 && (
                                    <div className={`mt-1 flex gap-0.5`}>
                                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                                            <div
                                                key={j}
                                                className={`w-1.5 h-1.5 rounded-full ${selected ? "bg-white/80" : "bg-emerald-500"}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ── Daily View ──
    const renderDaily = () => {
        const dateLabel = currentDate.toLocaleDateString(t("monthly") === "Mensal" ? "pt-BR" : "en", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const key = dateKey(currentDate);
        const count = workoutDates.get(key) || 0;

        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() - 1);
                            setCurrentDate(d);
                            onSelectDate(d);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="text-center">
                        <h3 className="text-sm font-semibold text-zinc-200 capitalize">{dateLabel}</h3>
                        {count > 0 && (
                            <span className="text-xs text-emerald-400 mt-0.5 block">
                                {count} {count === 1 ? t("workoutSingular") : t("workoutPlural")}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() + 1);
                            setCurrentDate(d);
                            onSelectDate(d);
                        }}
                        className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
            {/* View mode toggle */}
            <div className="flex gap-1 mb-4 bg-zinc-800 rounded-xl p-1">
                {(["monthly", "weekly", "daily"] as ViewMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === mode
                                ? "bg-emerald-600 text-white shadow-md"
                                : "text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        {t(mode)}
                    </button>
                ))}
            </div>

            {/* Today button */}
            <div className="flex justify-center mb-3">
                <button
                    onClick={() => {
                        const today = new Date();
                        setCurrentDate(today);
                        onSelectDate(today);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1 rounded-lg bg-emerald-500/10"
                >
                    {t("today")}
                </button>
            </div>

            {viewMode === "monthly" && renderMonthly()}
            {viewMode === "weekly" && renderWeekly()}
            {viewMode === "daily" && renderDaily()}
        </div>
    );
}
