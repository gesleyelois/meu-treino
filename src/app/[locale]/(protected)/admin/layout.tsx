import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-check";
import { getLocale } from "next-intl/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, errorResponse } = await requireAuth();
    const locale = await getLocale();

    if (errorResponse || !user) {
        redirect(`/${locale}/auth/sign-in`);
    }

    if (user.role !== "ADMIN") {
        redirect(`/${locale}`);
    }

    return <>{children}</>;
}
