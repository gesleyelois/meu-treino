import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const groups = await prisma.muscleGroup.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(groups);
    } catch (error) {
        console.error("Failed to fetch muscle groups:", error);
        return NextResponse.json({ error: "Failed to fetch muscle groups" }, { status: 500 });
    }
}
