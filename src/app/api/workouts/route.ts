import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const splits = await prisma.workoutSplit.findMany({
            where: { userId: user.id },
            include: {
                exercises: {
                    include: {
                        exercise: true,
                    },
                    orderBy: {
                        order: "asc",
                    },
                },
                logs: {
                    where: {
                        date: {
                            gte: oneWeekAgo
                        }
                    },
                    select: {
                        date: true,
                        id: true
                    }
                }
            },
        });

        return NextResponse.json(splits);
    } catch (error) {
        console.error("Failed to fetch workouts:", error);
        return NextResponse.json(
            { error: "Failed to fetch workouts" },
            { status: 500 }
        );
    }
}
