import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const splits = await prisma.workoutSplit.findMany({
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
