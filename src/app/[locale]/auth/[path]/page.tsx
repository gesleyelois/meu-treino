"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CustomAuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await authClient.signIn.email({
                email,
                password,
            });

            if (res.error) {
                setError(res.error.message || "Email ou senha incorretos.");
            } else {
                router.push("/manage");
            }
        } catch (err: any) {
            setError(err.message || "Um erro inesperado ocorreu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950">
            <div className="w-full max-w-sm space-y-8 bg-zinc-900/60 p-8 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Login</h2>
                    <p className="text-sm text-zinc-400">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm font-medium text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                E-mail
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="block w-full h-12 rounded-xl border-0 bg-zinc-950 px-4 text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm transition-all outline-none"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="block w-full h-12 rounded-xl border-0 bg-zinc-950 px-4 text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="flex w-full h-12 justify-center items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98]"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
