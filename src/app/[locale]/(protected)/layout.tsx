import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side session check
    const { data: session } = await auth.getSession();

    if (!session) {
        // Use an absolute-like path to sign-in so standard routing hits next-intl
        redirect('/pt-BR/auth/sign-in');
    }

    return <>{children}</>;
}
