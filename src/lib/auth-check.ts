import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function requireAuth() {
    const { data } = await auth.getSession();
    if (!data?.session || !data?.user) {
        return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { user } = data;

    // Ensure AppUser exists and map the Neon Auth role to our DB
    const vendorRole = (user as any).role || "user";
    const mappedRole = vendorRole === "admin" ? "ADMIN" : "USER";

    const appUser = await prisma.appUser.upsert({
        where: { id: user.id },
        create: { id: user.id, role: mappedRole },
        update: { role: mappedRole },
    });

    return { user: appUser, errorResponse: null };
}
