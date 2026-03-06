"use client";

import { useState, useEffect, useRef } from "react";
import { type Exercise } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [error, setError] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "pt-BR";

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/exercises");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setExercises(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
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

    const isMediaImage = (url: string) => {
        return /\.(gif|png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return; // Prevent double click

        setError("");
        setSaving(true);

        try {
            let finalMediaUrl = mediaUrl;

            // Upload the file if provided
            if (mediaFile) {
                finalMediaUrl = await uploadFile(mediaFile);
            }

            const url = editingId ? `/api/admin/exercises/${editingId}` : "/api/admin/exercises";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, muscleGroup, mediaUrl: finalMediaUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save exercise");
            }

            resetForm();
            fetchExercises();
        } catch (err: any) {
            setError(err.message);
        }
        setSaving(false);
    };

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setMuscleGroup("");
        setMediaUrl("");
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (ex: Exercise) => {
        setEditingId(ex.id);
        setName(ex.name);
        setMuscleGroup(ex.muscleGroup);
        setMediaUrl(ex.mediaUrl || "");
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteClick = (id: string) => {
        setExerciseToDelete(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async (id: string) => {
        setDeleteModalOpen(false);
        setExerciseToDelete(null);

        if (saving) return;

        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/exercises/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            fetchExercises();
            if (editingId === id) resetForm();
        } catch (err: any) {
            setError(err.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setSaving(false);
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin: Catálogo</h1>
                    <p className="text-zinc-400 text-sm">Gerencie os exercícios base</p>
                </div>
                <Link href={`/${locale}`} className="text-sm bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                    Voltar
                </Link>
            </header>

            <form onSubmit={handleSubmit} className="mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{editingId ? "Editar Exercício" : "Novo Exercício"}</h2>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-zinc-200">
                            Cancelar
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-3 p-2 bg-red-950/50 border border-red-900 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Nome</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Supino Reto"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Grupo Muscular</label>
                        <input
                            required
                            type="text"
                            value={muscleGroup}
                            onChange={e => setMuscleGroup(e.target.value)}
                            placeholder="Ex: Peitoral"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Media Setup */}
                    <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/50">
                        <label className="block text-xs font-semibold text-zinc-400 mb-2">Mídia do Exercício (GIF/Vídeo)</label>

                        {(mediaUrl || mediaFile) && (
                            <div className="mb-3 relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-700">
                                {mediaFile ? (
                                    <span className="text-xs text-zinc-400">Arquivo Selecionado: {mediaFile.name}</span>
                                ) : isMediaImage(mediaUrl) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={mediaUrl} controls className="w-full h-full object-cover" />
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Fazer Upload de Arquivo</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        setMediaFile(e.target.files?.[0] || null);
                                        if (e.target.files?.[0]) setMediaUrl("");
                                    }}
                                    accept="image/*,video/*"
                                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 hover:file:cursor-pointer transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-px bg-zinc-800 flex-1"></div>
                                <span className="text-[10px] text-zinc-600 font-medium">OU</span>
                                <div className="h-px bg-zinc-800 flex-1"></div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                                    Colar URL Direta
                                </label>
                                <input
                                    type="url"
                                    value={mediaUrl}
                                    onChange={e => {
                                        setMediaUrl(e.target.value);
                                        setMediaFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    placeholder="https://"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving || !name || !muscleGroup}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center h-10"
                    >
                        {saving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : editingId ? "Salvar Alterações" : "Adicionar ao Catálogo"}
                    </button>
                </div>
            </form>

            <div>
                <h2 className="text-lg font-semibold mb-3">Catálogo Atual ({exercises.length})</h2>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {exercises.map(ex => (
                            <li key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm text-zinc-100">{ex.name}</p>
                                        {ex.mediaUrl && (
                                            <span className="bg-zinc-800 text-[10px] text-zinc-400 px-1.5 py-0.5 rounded">Mídia</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500">{ex.muscleGroup}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(ex)}
                                        className="text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 px-2 py-1.5 rounded transition-all"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(ex.id)}
                                        className="text-xs font-medium text-red-400 hover:bg-red-400/10 px-2 py-1.5 rounded transition-all"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Excluir Exercício"
                message="Tem certeza que deseja remover este exercício do catálogo? Se ele estiver sendo utilizado em algum treino de usuário, não poderá ser excluído."
                confirmText="Excluir"
                cancelText="Cancelar"
                onConfirm={() => {
                    if (exerciseToDelete) executeDelete(exerciseToDelete);
                }}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setExerciseToDelete(null);
                }}
            />
        </div>
    );
}
