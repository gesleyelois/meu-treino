import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

// GET /api/history — return all workout logs with exercise details
export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const logs = await prisma.workoutLog.findMany({
            where: { workoutSplit: { userId: user.id } },
            include: {
                workoutSplit: true,
                exerciseLogs: {
                    include: { exercise: true },
                    orderBy: { setNumber: "asc" },
                },
            },
            orderBy: { date: "desc" },
            take: 50,
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
