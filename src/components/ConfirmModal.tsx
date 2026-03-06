import { ReactNode } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    isDangerous = true,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
                    <p className="text-sm text-zinc-400">{message}</p>
                </div>

                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-10 px-4 rounded-xl font-medium text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 h-10 px-4 rounded-xl font-medium text-sm text-white transition-colors ${isDangerous
                                ? "bg-red-600/90 hover:bg-red-500 shadow-lg shadow-red-900/20"
                                : "bg-emerald-600/90 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
