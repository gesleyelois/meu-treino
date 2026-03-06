import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
