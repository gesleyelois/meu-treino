"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { refreshCatalog } from "@/lib/sync";
import { type CatalogSplit } from "@/lib/db";

interface ExerciseForm {
    name: string;
    muscleGroup: string;
    mediaUrl: string;
    sets: number;
    targetReps: number;
    restTimeSeconds: number;
}

const emptyExercise: ExerciseForm = {
    name: "",
    muscleGroup: "",
    mediaUrl: "",
    sets: 3,
    targetReps: 12,
    restTimeSeconds: 90,
};

export default function ManagePage() {
    const t = useTranslations("manage");
    const [splits, setSplits] = useState<CatalogSplit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [exercises, setExercises] = useState<ExerciseForm[]>([{ ...emptyExercise }]);

    const loadSplits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/splits");
            if (res.ok) setSplits(await res.json());
        } catch {
            // Use cached data
            const data = await refreshCatalog();
            setSplits(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadSplits();
    }, [loadSplits]);

    const addExercise = () => {
        setExercises((prev) => [...prev, { ...emptyExercise }]);
    };

    const removeExercise = (index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, field: keyof ExerciseForm, value: string | number) => {
        setExercises((prev) =>
            prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
        );
    };

    const handleSubmit = async () => {
        if (!name.trim() || exercises.length === 0 || exercises.some((e) => !e.name.trim())) return;

        setSaving(true);
        try {
            const res = await fetch("/api/splits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, exercises }),
            });

            if (res.ok) {
                setShowForm(false);
                setName("");
                setDescription("");
                setExercises([{ ...emptyExercise }]);
                await refreshCatalog();
                await loadSplits();
            }
        } catch (error) {
            console.error("Failed to create split:", error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("deleteConfirm"))) return;

        try {
            const res = await fetch(`/api/splits/${id}`, { method: "DELETE" });
            if (res.ok) {
                await refreshCatalog();
                await loadSplits();
            }
        } catch (error) {
            console.error("Failed to delete split:", error);
        }
    };

    return (
        <div className="page-enter px-4 pb-8 max-w-lg mx-auto">
            <header className="pt-6 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-sm text-zinc-400 mt-0.5">{t("subtitle")}</p>
            </header>

            {/* New split button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full mb-6 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl 
                     font-bold text-base transition-all active:scale-[0.97]
                     shadow-lg shadow-emerald-600/20"
                >
                    {t("newSplit")}
                </button>
            )}

            {/* Create form */}
            {showForm && (
                <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="text-lg font-bold mb-4">{t("createSplit")}</h2>

                    {/* Split name */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                            {t("splitName")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("splitNamePlaceholder")}
                            className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-lg px-4 text-zinc-100 
                         placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">
                            {t("description")}
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descriptionPlaceholder")}
                            className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-lg px-4 text-zinc-100 
                         placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                        />
                    </div>

                    {/* Exercises */}
                    <div className="mb-4">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                            {t("exercises")}
                        </label>

                        <div className="flex flex-col gap-3">
                            {exercises.map((ex, i) => (
                                <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-zinc-300">#{i + 1}</span>
                                        {exercises.length > 1 && (
                                            <button
                                                onClick={() => removeExercise(i)}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                {t("removeExercise")}
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        value={ex.name}
                                        onChange={(e) => updateExercise(i, "name", e.target.value)}
                                        placeholder={t("exerciseNamePlaceholder")}
                                        className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 mb-2 text-sm text-zinc-100 
                               placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                                    />

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={ex.muscleGroup}
                                            onChange={(e) => updateExercise(i, "muscleGroup", e.target.value)}
                                            placeholder={t("muscleGroupPlaceholder")}
                                            className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 
                                 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                                        />
                                        <input
                                            type="text"
                                            value={ex.mediaUrl}
                                            onChange={(e) => updateExercise(i, "mediaUrl", e.target.value)}
                                            placeholder={t("mediaUrlPlaceholder")}
                                            className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 
                                 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase">{t("sets")}</label>
                                            <input
                                                type="number"
                                                value={ex.sets}
                                                onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value) || 1)}
                                                className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 
                                   text-center focus:outline-none focus:border-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase">{t("targetReps")}</label>
                                            <input
                                                type="number"
                                                value={ex.targetReps}
                                                onChange={(e) => updateExercise(i, "targetReps", parseInt(e.target.value) || 1)}
                                                className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 
                                   text-center focus:outline-none focus:border-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase">{t("restTime")}</label>
                                            <input
                                                type="number"
                                                value={ex.restTimeSeconds}
                                                onChange={(e) => updateExercise(i, "restTimeSeconds", parseInt(e.target.value) || 30)}
                                                className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100 
                                   text-center focus:outline-none focus:border-emerald-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addExercise}
                            className="mt-3 w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg 
                         text-sm font-medium transition-colors border border-dashed border-zinc-700"
                        >
                            {t("addExercise")}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setName("");
                                setDescription("");
                                setExercises([{ ...emptyExercise }]);
                            }}
                            className="flex-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !name.trim() || exercises.some((e) => !e.name.trim())}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold 
                         transition-colors disabled:opacity-50"
                        >
                            {saving ? "..." : t("save")}
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Existing splits */}
            <div className="flex flex-col gap-3">
                {splits.map((split) => (
                    <div key={split.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-zinc-100">{split.name}</h3>
                                {split.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5">{split.description}</p>
                                )}
                                <p className="text-xs text-zinc-400 mt-1">
                                    {split.exercises.length} {t("exercises").toLowerCase()} — {split.exercises.map((e) => e.exercise.name).join(", ")}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(split.id)}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
                            >
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
