"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function SignOutButton({ locale }: { locale: string }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push(`/${locale}/auth/sign-in`);
        router.refresh();
    };

    return (
        <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
            Sair
        </button>
    );
}
