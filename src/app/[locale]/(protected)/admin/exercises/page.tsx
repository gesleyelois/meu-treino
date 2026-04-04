"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { type MuscleGroup } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

type AdminExercise = {
    id: string;
    name: string;
    muscleGroup?: string | null;
    muscleGroupId?: string | null;
    mediaUrl?: string | null;
    muscleGroupRel?: {
        id: string;
        name: string;
        category?: string | null;
    } | null;
};

const ITEMS_PER_PAGE = 10;

export default function AdminExercisesPage() {
    const [exercises, setExercises] = useState<AdminExercise[]>([]);
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeMuscleTab, setActiveMuscleTab] = useState<string>("all");
    const [activeSection, setActiveSection] = useState<"create" | "import" | "list">("create");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [muscleGroupId, setMuscleGroupId] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<string>("");
    const [jsonImportText, setJsonImportText] = useState("");
    const [page, setPage] = useState(1);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "pt-BR";

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [activeMuscleTab]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [exRes, mgRes] = await Promise.all([
                fetch("/api/admin/exercises"),
                fetch("/api/admin/muscle-groups")
            ]);
            if (exRes.ok) setExercises(await exRes.json());
            if (mgRes.ok) setMuscleGroups(await mgRes.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchExercises = async () => {
        try {
            const res = await fetch("/api/admin/exercises");
            if (res.ok) setExercises(await res.json());
        } catch (e) {
            console.error(e);
        }
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
        if (saving) return;

        setError("");
        setSaving(true);

        try {
            let finalMediaUrl = mediaUrl;

            if (mediaFile) {
                finalMediaUrl = await uploadFile(mediaFile);
            }

            const url = editingId ? `/api/admin/exercises/${editingId}` : "/api/admin/exercises";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, muscleGroupId, mediaUrl: finalMediaUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save exercise");
            }

            resetForm();
            fetchExercises();
            setActiveSection("list");
        } catch (err: any) {
            setError(err.message);
        }
        setSaving(false);
    };

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setMuscleGroupId("");
        setMediaUrl("");
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (ex: AdminExercise) => {
        setEditingId(ex.id);
        setName(ex.name);
        setMuscleGroupId(ex.muscleGroupId || "");
        setMediaUrl(ex.mediaUrl || "");
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setActiveSection("create");
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

    const handleImportPayload = async (payload: unknown) => {
        setError("");
        setImportResult("");
        setImporting(true);

        try {
            const exercisesPayload = Array.isArray(payload) ? payload : (payload as any)?.exercises;

            if (!Array.isArray(exercisesPayload) || exercisesPayload.length === 0) {
                throw new Error("JSON inválido. Envie um array de exercícios ou { exercises: [...] }.");
            }

            const res = await fetch("/api/admin/exercises", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exercises: exercisesPayload }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Falha ao importar exercícios.");
            }

            setImportResult(`Importação concluída: ${data.imported} importado(s), ${data.failed} com falha.`);
            fetchExercises();
            setActiveSection("list");
        } catch (err: any) {
            setError(err.message || "Erro ao importar JSON.");
        } finally {
            setImporting(false);
        }
    };

    const handleImportJson = async (file?: File | null) => {
        if (!file) return;

        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);
            await handleImportPayload(parsed);
        } finally {
            if (importFileInputRef.current) importFileInputRef.current.value = "";
        }
    };

    const handleImportFromText = async () => {
        if (!jsonImportText.trim()) return;
        try {
            const parsed = JSON.parse(jsonImportText);
            await handleImportPayload(parsed);
        } catch {
            setError("JSON inválido no campo de texto.");
        }
    };

    const filteredExercises = useMemo(
        () => (activeMuscleTab === "all"
            ? exercises
            : exercises.filter((ex) => ex.muscleGroupId === activeMuscleTab)),
        [activeMuscleTab, exercises]
    );

    const pageCount = Math.max(1, Math.ceil(filteredExercises.length / ITEMS_PER_PAGE));
    const safePage = Math.min(page, pageCount);
    const paginatedExercises = filteredExercises.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin: Exercícios</h1>
                    <p className="text-zinc-400 text-sm">Gerencie os exercícios base</p>
                </div>
                <Link href={`/${locale}`} className="text-sm bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-300">
                    Voltar
                </Link>
            </header>

            {error && (
                <div className="mb-4 p-3 bg-red-950/50 border border-red-900 rounded-lg text-red-500 text-sm">
                    {error}
                </div>
            )}

            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                    onClick={() => setActiveSection("create")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSection === "create" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                >
                    Criar novo exercício
                </button>
                <button
                    onClick={() => setActiveSection("import")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSection === "import" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                >
                    Importar exercícios
                </button>
                <button
                    onClick={() => setActiveSection("list")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeSection === "list" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                >
                    Lista de exercícios
                </button>
            </div>

            {activeSection === "create" && (
                <form onSubmit={handleSubmit} className="mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">{editingId ? "Editar Exercício" : "Novo Exercício"}</h2>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-zinc-200">
                                Cancelar
                            </button>
                        )}
                    </div>

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
                            <select
                                required
                                value={muscleGroupId}
                                onChange={e => setMuscleGroupId(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                            >
                                <option value="" disabled>Selecione um grupo muscular...</option>
                                {muscleGroups.map(mg => (
                                    <option key={mg.id} value={mg.id}>{mg.category ? `${mg.category} - ${mg.name}` : mg.name}</option>
                                ))}
                            </select>
                        </div>

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
                                    <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Colar URL Direta</label>
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
                            disabled={saving || !name || !muscleGroupId}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center h-10"
                        >
                            {saving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : editingId ? "Salvar Alterações" : "Adicionar Exercício"}
                        </button>
                    </div>
                </form>
            )}

            {activeSection === "import" && (
                <section className="mb-8 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <h2 className="text-lg font-semibold mb-1">Importar exercícios (JSON)</h2>
                    <p className="text-xs text-zinc-400 mb-3">
                        Formatos aceitos: array direto ou objeto no formato {"{ exercises: [...] }"}.
                    </p>
                    <p className="text-xs text-zinc-500 mb-3">
                        Cada item deve ter <code className="text-zinc-300">name</code> e <code className="text-zinc-300">muscleGroupId</code> (ou <code className="text-zinc-300">muscleGroup</code>), opcionalmente <code className="text-zinc-300">mediaUrl</code>.
                    </p>

                    {importResult && (
                        <div className="mb-3 p-2 bg-emerald-950/50 border border-emerald-900 rounded-lg text-emerald-400 text-sm">
                            {importResult}
                        </div>
                    )}

                    <input
                        ref={importFileInputRef}
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) => handleImportJson(e.target.files?.[0])}
                        disabled={importing || saving}
                        className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 hover:file:cursor-pointer transition-all disabled:opacity-60"
                    />
                    <textarea
                        value={jsonImportText}
                        onChange={(e) => setJsonImportText(e.target.value)}
                        rows={10}
                        disabled={importing || saving}
                        placeholder={`{
  "exercises": [
    {
      "name": "Supino Reto com Barra",
      "muscleGroupId": "cm123abc456def789ghi012jk",
      "mediaUrl": "https://cdn.exemplo.com/exercicios/supino-reto.mp4"
    },
    {
      "name": "Elevação Lateral com Halteres",
      "muscleGroup": "Ombros",
      "mediaUrl": "https://cdn.exemplo.com/exercicios/elevacao-lateral.gif"
    }
  ]
}`}
                        className="mt-3 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                        type="button"
                        onClick={handleImportFromText}
                        disabled={importing || saving || !jsonImportText.trim()}
                        className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                        Importar JSON colado
                    </button>
                    {importing && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                            <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></span>
                            Importando...
                        </div>
                    )}
                </section>
            )}

            {activeSection === "list" && (
                <section>
                    <h2 className="text-lg font-semibold mb-3">Exercícios ({filteredExercises.length})</h2>

                    <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
                        <button
                            onClick={() => setActiveMuscleTab("all")}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                activeMuscleTab === "all"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                            }`}
                        >
                            Todos
                        </button>
                        {muscleGroups.map(mg => (
                            <button
                                key={mg.id}
                                onClick={() => setActiveMuscleTab(mg.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeMuscleTab === mg.id
                                        ? "bg-emerald-600 text-white"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                                }`}
                            >
                                {mg.name}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 text-sm">Nenhum exercício encontrado.</p>
                        </div>
                    ) : (
                        <>
                            <ul className="space-y-3">
                                {paginatedExercises.map(ex => (
                                    <li key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-16 h-16 rounded-md overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0">
                                                {ex.mediaUrl ? (
                                                    isMediaImage(ex.mediaUrl)
                                                        ? <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-cover" />
                                                        : <video src={ex.mediaUrl} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <span className="text-[10px] text-zinc-500">Sem mídia</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-zinc-100 truncate">{ex.name}</p>
                                                <p className="text-xs text-zinc-400 truncate">
                                                    {ex.muscleGroupRel ? ex.muscleGroupRel.name : ex.muscleGroup || "Sem grupo"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
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

                            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-400">
                                <p>
                                    Página {safePage} de {pageCount}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage <= 1}
                                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                                        disabled={safePage >= pageCount}
                                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Excluir Exercício"
                message="Tem certeza que deseja remover este exercício? Se ele estiver sendo utilizado em algum treino de usuário, não poderá ser excluído."
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
