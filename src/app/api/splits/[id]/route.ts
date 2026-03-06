import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ExerciseInput {
    name: string;
    muscleGroup: string;
    mediaUrl?: string;
    sets: number;
    targetReps: number;
    restTimeSeconds: number;
}

// GET /api/splits/[id] — fetch a single split
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const split = await prisma.workoutSplit.findUnique({
            where: { id },
            include: {
                exercises: {
                    include: { exercise: true },
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!split) {
            return NextResponse.json({ error: "Split not found" }, { status: 404 });
        }

        return NextResponse.json(split);
    } catch (error) {
        console.error("Failed to fetch split:", error);
        return NextResponse.json({ error: "Failed to fetch split" }, { status: 500 });
    }
}

// PUT /api/splits/[id] — update a split and its exercises
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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

        const updated = await prisma.$transaction(async (tx) => {
            // Get old workout exercises
            const oldWEs = await tx.workoutExercise.findMany({
                where: { workoutSplitId: id },
            });
            const oldExerciseIds = oldWEs.map((we) => we.exerciseId);

            // Delete old workout exercises
            await tx.workoutExercise.deleteMany({
                where: { workoutSplitId: id },
            });

            // Delete old exercises (only those not referenced elsewhere)
            await tx.exercise.deleteMany({
                where: {
                    id: { in: oldExerciseIds },
                    workouts: { none: {} },
                },
            });

            // Update split info
            await tx.workoutSplit.update({
                where: { id },
                data: { name, description },
            });

            // Create new exercises
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];
                const exercise = await tx.exercise.create({
                    data: {
                        name: ex.name,
                        muscleGroup: ex.muscleGroup,
                        mediaUrl: ex.mediaUrl || null,
                    },
                });

                await tx.workoutExercise.create({
                    data: {
                        workoutSplitId: id,
                        exerciseId: exercise.id,
                        sets: ex.sets,
                        targetReps: ex.targetReps,
                        restTimeSeconds: ex.restTimeSeconds,
                        order: i,
                    },
                });
            }

            return tx.workoutSplit.findUnique({
                where: { id },
                include: {
                    exercises: {
                        include: { exercise: true },
                        orderBy: { order: "asc" },
                    },
                },
            });
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update split:", error);
        return NextResponse.json({ error: "Failed to update split" }, { status: 500 });
    }
}

// DELETE /api/splits/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Delete related records first
        const workoutExercises = await prisma.workoutExercise.findMany({
            where: { workoutSplitId: id },
        });

        const exerciseIds = workoutExercises.map((we) => we.exerciseId);

        await prisma.$transaction(async (tx) => {
            // Delete exercise logs related to this split's exercises
            await tx.exerciseLog.deleteMany({
                where: { exerciseId: { in: exerciseIds } },
            });
            // Delete workout logs for this split
            await tx.workoutLog.deleteMany({
                where: { workoutSplitId: id },
            });
            // Delete workout exercises
            await tx.workoutExercise.deleteMany({
                where: { workoutSplitId: id },
            });
            // Delete exercises
            await tx.exercise.deleteMany({
                where: { id: { in: exerciseIds } },
            });
            // Delete the split itself
            await tx.workoutSplit.delete({
                where: { id },
            });
        });

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Failed to delete split:", error);
        return NextResponse.json({ error: "Failed to delete split" }, { status: 500 });
    }
}
