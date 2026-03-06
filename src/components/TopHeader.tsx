import Link from "next/link";
import { requireAuth } from "@/lib/auth-check";
import { getLocale } from "next-intl/server";
import SignOutButton from "@/components/SignOutButton";

export default async function TopHeader() {
    const { user, errorResponse } = await requireAuth();
    const locale = await getLocale();

    if (errorResponse || !user) {
        return null; // Not logged in, layout shouldn't crash
    }

    return (
        <header className="w-full h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 fixed top-0 z-50">
            <div className="flex items-center gap-3">
                <span className="text-zinc-100 font-bold tracking-tight text-sm">Meu Treino</span>
                {user.role === "ADMIN" && (
                    <Link
                        href={`/${locale}/admin/exercises`}
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600/30 transition-colors"
                    >
                        Painel Admin
                    </Link>
                )}
            </div>

            <SignOutButton locale={locale} />
        </header>
    );
}
