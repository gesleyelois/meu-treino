"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getSplit, syncPendingLogs } from "@/lib/sync";
import { db, type CatalogSplit, type CatalogWorkoutExercise, type SyncExerciseLog } from "@/lib/db";
import SetRow from "@/components/SetRow";
import RestTimer from "@/components/RestTimer";

interface SetState {
    reps: number;
    weight: number;
    completed: boolean;
}

interface ExerciseState {
    exerciseId: string;
    sets: SetState[];
}

export default function ActiveWorkout() {
    const t = useTranslations("workout");
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "pt-BR";
    const splitId = params.splitId as string;

    const [split, setSplit] = useState<CatalogSplit | null>(null);
    const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [showTimer, setShowTimer] = useState(false);
    const [saving, setSaving] = useState(false);
    const [workoutStartTime] = useState(new Date().toISOString());

    const loadSplit = useCallback(async () => {
        const data = await getSplit(splitId);
        if (!data) {
            router.push(`/${locale}`);
            return;
        }
        setSplit(data);
        setExerciseStates(
            data.exercises.map((we: CatalogWorkoutExercise) => ({
                exerciseId: we.exercise.id,
                sets: Array.from({ length: we.sets }, () => ({
                    reps: we.targetReps,
                    weight: 0,
                    completed: false,
                })),
            }))
        );
    }, [splitId, router, locale]);

    useEffect(() => {
        loadSplit();
    }, [loadSplit]);

    if (!split) {
        return (
            <div className="flex items-center justify-center min-h-dvh">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentWE = split.exercises[currentExerciseIndex];
    const currentState = exerciseStates[currentExerciseIndex];
    const totalExercises = split.exercises.length;
    const allSetsCompleted = currentState?.sets.every((s) => s.completed) ?? false;
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const allExercisesCompleted = exerciseStates.every((es) =>
        es.sets.every((s) => s.completed)
    );

    const updateSet = (setIndex: number, field: "reps" | "weight", value: number) => {
        setExerciseStates((prev) => {
            const next = [...prev];
            next[currentExerciseIndex] = {
                ...next[currentExerciseIndex],
                sets: next[currentExerciseIndex].sets.map((s, i) =>
                    i === setIndex ? { ...s, [field]: value } : s
                ),
            };
            return next;
        });
    };

    const completeSet = (setIndex: number) => {
        setExerciseStates((prev) => {
            const next = [...prev];
            next[currentExerciseIndex] = {
                ...next[currentExerciseIndex],
                sets: next[currentExerciseIndex].sets.map((s, i) =>
                    i === setIndex ? { ...s, completed: true } : s
                ),
            };
            return next;
        });
        setShowTimer(true);
    };

    const nextExercise = () => {
        if (currentExerciseIndex < totalExercises - 1) {
            setCurrentExerciseIndex((prev) => prev + 1);
            setShowTimer(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const prevExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex((prev) => prev - 1);
            setShowTimer(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const finishWorkout = async () => {
        setSaving(true);
        const exerciseLogs: SyncExerciseLog[] = [];
        for (const es of exerciseStates) {
            for (let i = 0; i < es.sets.length; i++) {
                const s = es.sets[i];
                if (s.completed) {
                    exerciseLogs.push({
                        exerciseId: es.exerciseId,
                        setNumber: i + 1,
                        repsCompleted: s.reps,
                        weightUsed: s.weight,
                    });
                }
            }
        }

        const clientId = crypto.randomUUID();
        await db.syncQueue.add({
            clientId,
            date: workoutStartTime,
            workoutSplitId: splitId,
            exerciseLogs,
        });

        try {
            await syncPendingLogs();
        } catch {
            console.log("Will sync later when online");
        }

        router.push(`/${locale}`);
    };

    const progress =
        exerciseStates.reduce((acc, es) => acc + es.sets.filter((s) => s.completed).length, 0) /
        exerciseStates.reduce((acc, es) => acc + es.sets.length, 0);

    return (
        <div className="page-enter min-h-dvh pb-8">
            <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl px-4 py-4 border-b border-zinc-800/50">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm">{t("back")}</span>
                        </button>
                        <span className="text-sm text-zinc-400 font-medium">
                            {currentExerciseIndex + 1} / {totalExercises}
                        </span>
                    </div>
                    <h1 className="text-lg font-bold">{split.name}</h1>
                    <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
                    </div>
                </div>
            </header>

            <div className="px-4 max-w-lg mx-auto mt-4">
                {currentWE.exercise.mediaUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                        <video key={currentWE.exercise.mediaUrl} className="w-full aspect-video object-cover" autoPlay loop muted playsInline>
                            <source src={currentWE.exercise.mediaUrl} type="video/mp4" />
                        </video>
                    </div>
                )}

                <div className="mb-4">
                    <h2 className="text-xl font-bold">{currentWE.exercise.name}</h2>
                    <p className="text-sm text-zinc-400 mt-0.5">
                        {currentWE.exercise.muscleGroup} · {currentWE.sets}×{currentWE.targetReps} · {currentWE.restTimeSeconds}s
                    </p>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                    {currentState?.sets.map((set, i) => (
                        <SetRow
                            key={i}
                            setNumber={i + 1}
                            targetReps={currentWE.targetReps}
                            reps={set.reps}
                            weight={set.weight}
                            completed={set.completed}
                            onRepsChange={(v) => updateSet(i, "reps", v)}
                            onWeightChange={(v) => updateSet(i, "weight", v)}
                            onComplete={() => completeSet(i)}
                        />
                    ))}
                </div>

                {showTimer && !allSetsCompleted && (
                    <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <h3 className="text-sm font-medium text-zinc-400 text-center mb-3">{t("restTitle")}</h3>
                        <RestTimer seconds={currentWE.restTimeSeconds} autoStart={true} onComplete={() => setShowTimer(false)} />
                    </div>
                )}

                <div className="flex gap-3 mt-4">
                    {currentExerciseIndex > 0 && (
                        <button onClick={prevExercise} className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold transition-colors active:scale-[0.97]">
                            {t("previous")}
                        </button>
                    )}
                    {!isLastExercise && (
                        <button onClick={nextExercise} className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold transition-colors active:scale-[0.97]">
                            {t("next")}
                        </button>
                    )}
                </div>

                {isLastExercise && allSetsCompleted && (
                    <button
                        onClick={finishWorkout}
                        disabled={saving}
                        className="w-full mt-4 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg transition-all active:scale-[0.97] shadow-xl shadow-emerald-600/30 disabled:opacity-50"
                    >
                        {saving ? t("saving") : t("finishWorkout")}
                    </button>
                )}

                {!allExercisesCompleted && (
                    <button
                        onClick={finishWorkout}
                        disabled={saving}
                        className="w-full mt-3 h-12 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-xl font-medium text-sm transition-colors border border-zinc-800/50"
                    >
                        {t("finishEarly")}
                    </button>
                )}
            </div>
        </div>
    );
}
