"use client";

import { useTranslations } from "next-intl";

interface SetRowProps {
    setNumber: number;
    targetReps: number;
    reps: number;
    weight: number;
    completed: boolean;
    onRepsChange: (value: number) => void;
    onWeightChange: (value: number) => void;
    onComplete: () => void;
}

export default function SetRow({
    setNumber,
    targetReps,
    reps,
    weight,
    completed,
    onRepsChange,
    onWeightChange,
    onComplete,
}: SetRowProps) {
    const t = useTranslations("setRow");

    return (
        <div
            className={`rounded-xl p-4 transition-colors duration-300 ${completed
                ? "bg-emerald-950/30 border border-emerald-800/40"
                : "bg-zinc-900 border border-zinc-800"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completed
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800 text-zinc-400"
                            }`}
                    >
                        {setNumber}
                    </span>
                    <span className="text-sm text-zinc-400">
                        {t("target", { reps: targetReps })}
                    </span>
                </div>
                {completed && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {t("completed")}
                    </span>
                )}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
                {/* Reps */}
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                        {t("reps")}
                    </label>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onRepsChange(Math.max(0, reps - 1))}
                            className="h-14 w-14 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xl font-bold 
                         text-zinc-300 active:scale-95 transition-all flex-shrink-0
                         flex items-center justify-center"
                            disabled={completed}
                        >
                            −
                        </button>
                        <div className="flex-1 text-center">
                            <span className="text-2xl font-bold tabular-nums">{reps}</span>
                        </div>
                        <button
                            onClick={() => onRepsChange(reps + 1)}
                            className="h-14 w-14 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xl font-bold 
                         text-zinc-300 active:scale-95 transition-all flex-shrink-0
                         flex items-center justify-center"
                            disabled={completed}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Weight */}
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                        {t("weight")}
                    </label>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onWeightChange(Math.max(0, weight - 2.5))}
                            className="h-14 w-14 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xl font-bold 
                         text-zinc-300 active:scale-95 transition-all flex-shrink-0
                         flex items-center justify-center"
                            disabled={completed}
                        >
                            −
                        </button>
                        <div className="flex-1 text-center">
                            <span className="text-2xl font-bold tabular-nums">{weight}</span>
                        </div>
                        <button
                            onClick={() => onWeightChange(weight + 2.5)}
                            className="h-14 w-14 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xl font-bold 
                         text-zinc-300 active:scale-95 transition-all flex-shrink-0
                         flex items-center justify-center"
                            disabled={completed}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* Complete button */}
            {!completed && (
                <button
                    onClick={onComplete}
                    className="mt-3 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg 
                     font-semibold transition-colors active:scale-[0.98]"
                >
                    {t("complete")}
                </button>
            )}
        </div>
    );
}
