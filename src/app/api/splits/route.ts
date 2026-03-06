import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

// GET /api/splits — list all splits
// POST /api/splits — create a new split with exercises
export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const splits = await prisma.workoutSplit.findMany({
            where: { userId: user.id },
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(splits);
    } catch (error) {
        console.error("Failed to fetch splits:", error);
        return NextResponse.json({ error: "Failed to fetch splits" }, { status: 500 });
    }
}

interface ExerciseInput {
    exerciseId: string;
    sets: number;
    targetReps: number;
    restTimeSeconds: number;
}

export async function POST(request: Request) {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const body = await request.json();
        const { name, description, exercises } = body as {
            name: string;
            description?: string;
            exercises: ExerciseInput[];
        };

        if (!name || !exercises || exercises.length === 0) {
            return NextResponse.json(
                { error: "Name and at least one exercise are required" },
                { status: 400 }
            );
        }

        const split = await prisma.$transaction(async (tx) => {
            const ws = await tx.workoutSplit.create({
                data: { name, description, userId: user.id },
            });

            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];

                await tx.workoutExercise.create({
                    data: {
                        workoutSplitId: ws.id,
                        exerciseId: ex.exerciseId,
                        sets: ex.sets,
                        targetReps: ex.targetReps,
                        restTimeSeconds: ex.restTimeSeconds,
                        order: i,
                    },
                });
            }

            return tx.workoutSplit.findUnique({
                where: { id: ws.id },
                include: {
                    exercises: {
                        include: { exercise: true },
                        orderBy: { order: "asc" },
                    },
                },
            });
        });

        return NextResponse.json(split, { status: 201 });
    } catch (error) {
        console.error("Failed to create split:", error);
        return NextResponse.json({ error: "Failed to create split" }, { status: 500 });
    }
}
