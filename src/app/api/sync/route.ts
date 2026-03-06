import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

interface ExerciseLogPayload {
    exerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightUsed: number;
}

interface WorkoutLogPayload {
    clientId: string;
    date: string;
    workoutSplitId: string;
    exerciseLogs: ExerciseLogPayload[];
}

export async function POST(request: Request) {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const { logs } = (await request.json()) as { logs: WorkoutLogPayload[] };

        if (!Array.isArray(logs) || logs.length === 0) {
            return NextResponse.json(
                { error: "No logs provided" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const created = [];

            for (const log of logs) {
                // Verify ownership of the split
                const split = await tx.workoutSplit.findUnique({ where: { id: log.workoutSplitId } });
                if (!split || split.userId !== user.id) {
                    throw new Error("Unauthorized or split not found");
                }

                const workoutLog = await tx.workoutLog.create({
                    data: {
                        date: new Date(log.date),
                        workoutSplitId: log.workoutSplitId,
                        status: "synced",
                        exerciseLogs: {
                            create: log.exerciseLogs.map((el) => ({
                                exerciseId: el.exerciseId,
                                setNumber: el.setNumber,
                                repsCompleted: el.repsCompleted,
                                weightUsed: el.weightUsed,
                            })),
                        },
                    },
                    include: {
                        exerciseLogs: true,
                    },
                });

                created.push(workoutLog);
            }

            return created;
        });

        return NextResponse.json({ synced: result.length, logs: result });
    } catch (error) {
        console.error("Sync failed:", error);
        return NextResponse.json(
            { error: "Sync failed" },
            { status: 500 }
        );
    }
}
