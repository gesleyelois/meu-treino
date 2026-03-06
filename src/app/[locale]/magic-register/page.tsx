"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function MagicSignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [secret, setSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        // Simple magic keyword logic without needing database secrets, 
        // to avoid exposing raw registrations.
        if (secret !== "meutreino2026") {
            setMessage("🔴 Acesso negado. O código de validação está incorreto.");
            return;
        }

        setLoading(true);
        try {
            const res = await authClient.signUp.email({
                email,
                password,
                name: name || "Atleta",
            });

            if (res.error) {
                setMessage(`🔴 Falha no registro: ${res.error.message}`);
            } else {
                setMessage("🟢 Conta de atleta criada com sucesso! Você já pode voltar para a tela de Login.");
            }
        } catch (err: any) {
            setMessage(`🔴 Erro inesperado: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950">
            <div className="w-full max-w-sm space-y-8 bg-zinc-900/60 p-8 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
                <div className="text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">Registro de Atleta</h2>
                    <p className="text-xs text-zinc-500">Adicione novos membros preenchendo os dados e o código de autorização.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {message && (
                        <div className="p-3 text-xs font-medium bg-zinc-950 border border-zinc-800 rounded-xl text-center text-zinc-300">
                            {message}
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="block w-full h-10 rounded-xl border-0 bg-zinc-950 px-3 text-sm text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 outline-none transition-all"
                            placeholder="Nome (opcional)"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="block w-full h-10 rounded-xl border-0 bg-zinc-950 px-3 text-sm text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="block w-full h-10 rounded-xl border-0 bg-zinc-950 px-3 text-sm text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            Código de Autorização
                        </label>
                        <input
                            type="password"
                            required
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                            className="block w-full h-10 rounded-xl border-0 bg-zinc-950 px-3 text-sm text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-red-500 outline-none transition-all"
                            placeholder="Segredo para liberar a criação"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password || !secret}
                        className="mt-4 flex w-full h-10 justify-center items-center rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-bold text-zinc-900 shadow-md hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all disabled:opacity-50"
                    >
                        {loading ? "Criando..." : "Criar Usuário"}
                    </button>
                </form>
            </div>
        </div>
    );
}
