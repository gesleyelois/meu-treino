"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { refreshCatalog } from "@/lib/sync";
import { type CatalogSplit } from "@/lib/db";

interface ExerciseForm {
    name: string;
    muscleGroup: string;
    mediaUrl: string;
    mediaFile: File | null;
    sets: number;
    targetReps: number;
    restTimeSeconds: number;
}

const emptyExercise: ExerciseForm = {
    name: "",
    muscleGroup: "",
    mediaUrl: "",
    mediaFile: null,
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
    const [editingSplitId, setEditingSplitId] = useState<string | null>(null);

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

    const resetForm = () => {
        setShowForm(false);
        setEditingSplitId(null);
        setName("");
        setDescription("");
        setExercises([{ ...emptyExercise }]);
    };

    const handleEdit = (split: CatalogSplit) => {
        setEditingSplitId(split.id);
        setName(split.name);
        setDescription(split.description || "");
        setExercises(
            split.exercises.map((we) => ({
                name: we.exercise.name,
                muscleGroup: we.exercise.muscleGroup,
                mediaUrl: we.exercise.mediaUrl || "",
                mediaFile: null,
                sets: we.sets,
                targetReps: we.targetReps,
                restTimeSeconds: we.restTimeSeconds,
            }))
        );
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const addExercise = () => {
        setExercises((prev) => [...prev, { ...emptyExercise }]);
    };

    const removeExercise = (index: number) => {
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, field: keyof ExerciseForm, value: string | number | File | null) => {
        setExercises((prev) =>
            prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
        );
    };

    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async () => {
        if (!name.trim() || exercises.length === 0 || exercises.some((e) => !e.name.trim())) return;

        setSaving(true);
        try {
            // Upload any files first
            const processedExercises = await Promise.all(
                exercises.map(async (ex) => {
                    let mediaUrl = ex.mediaUrl;
                    if (ex.mediaFile) {
                        mediaUrl = await uploadFile(ex.mediaFile);
                    }
                    return {
                        name: ex.name,
                        muscleGroup: ex.muscleGroup,
                        mediaUrl,
                        sets: ex.sets,
                        targetReps: ex.targetReps,
                        restTimeSeconds: ex.restTimeSeconds,
                    };
                })
            );

            const url = editingSplitId ? `/api/splits/${editingSplitId}` : "/api/splits";
            const method = editingSplitId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, exercises: processedExercises }),
            });

            if (res.ok) {
                resetForm();
                await refreshCatalog();
                await loadSplits();
            }
        } catch (error) {
            console.error("Failed to save split:", error);
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

    const isMediaImage = (url: string) => {
        return /\.(gif|png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(url);
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

            {/* Create/Edit form */}
            {showForm && (
                <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="text-lg font-bold mb-4">
                        {editingSplitId ? t("editSplit") : t("createSplit")}
                    </h2>

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
                                        <div className="flex flex-col gap-1">
                                            {/* File upload */}
                                            <label
                                                className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-zinc-100
                                     flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors"
                                            >
                                                <span className="truncate text-xs">
                                                    {ex.mediaFile
                                                        ? ex.mediaFile.name
                                                        : ex.mediaUrl
                                                            ? "✓ " + t("preview")
                                                            : t("uploadFile")}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".gif,.mp4,.webm,.webp,.png,.jpg,.jpeg"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        if (file) {
                                                            updateExercise(i, "mediaFile", file);
                                                            updateExercise(i, "mediaUrl", "");
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Media preview */}
                                    {(ex.mediaFile || ex.mediaUrl) && (
                                        <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700/50">
                                            {ex.mediaFile ? (
                                                isMediaImage(ex.mediaFile.name) ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={URL.createObjectURL(ex.mediaFile)}
                                                        alt={t("preview")}
                                                        className="w-full max-h-40 object-contain"
                                                    />
                                                ) : (
                                                    <video
                                                        src={URL.createObjectURL(ex.mediaFile)}
                                                        className="w-full max-h-40 object-contain"
                                                        autoPlay
                                                        loop
                                                        muted
                                                        playsInline
                                                    />
                                                )
                                            ) : ex.mediaUrl && isMediaImage(ex.mediaUrl) ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={ex.mediaUrl}
                                                    alt={t("preview")}
                                                    className="w-full max-h-40 object-contain"
                                                />
                                            ) : ex.mediaUrl ? (
                                                <video
                                                    src={ex.mediaUrl}
                                                    className="w-full max-h-40 object-contain"
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                />
                                            ) : null}
                                            <button
                                                onClick={() => {
                                                    updateExercise(i, "mediaFile", null);
                                                    updateExercise(i, "mediaUrl", "");
                                                }}
                                                className="w-full text-xs text-red-400 hover:text-red-300 py-1.5 transition-colors"
                                            >
                                                ✕ {t("removeExercise")}
                                            </button>
                                        </div>
                                    )}

                                    {/* URL fallback input */}
                                    {!ex.mediaFile && (
                                        <input
                                            type="text"
                                            value={ex.mediaUrl}
                                            onChange={(e) => updateExercise(i, "mediaUrl", e.target.value)}
                                            placeholder={t("orPasteUrl")}
                                            className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 mb-2 text-sm text-zinc-100 
                                 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
                                        />
                                    )}

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
                            onClick={resetForm}
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
                            {saving ? t("uploading") : t("save")}
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
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-zinc-100">{split.name}</h3>
                                {split.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5">{split.description}</p>
                                )}
                                <p className="text-xs text-zinc-400 mt-1">
                                    {split.exercises.length} {t("exercises").toLowerCase()} — {split.exercises.map((e) => e.exercise.name).join(", ")}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                                <button
                                    onClick={() => handleEdit(split)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded transition-colors"
                                >
                                    {t("edit")}
                                </button>
                                <button
                                    onClick={() => handleDelete(split.id)}
                                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
                                >
                                    {t("delete")}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
