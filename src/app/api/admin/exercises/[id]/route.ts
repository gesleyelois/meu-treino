import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;

    try {
        // Cascade-delete related records before deleting the exercise
        await prisma.$transaction([
            prisma.exerciseLog.deleteMany({ where: { exerciseId: id } }),
            prisma.workoutExercise.deleteMany({ where: { exerciseId: id } }),
            prisma.exercise.delete({ where: { id } }),
        ]);

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("Failed to delete exercise:", error);
        return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { name, muscleGroupId, mediaUrl } = body;

        let muscleGroup = body.muscleGroup;

        if (!name || (!muscleGroupId && !muscleGroup)) {
            return NextResponse.json({ error: "Name and muscleGroup are required" }, { status: 400 });
        }

        if (muscleGroupId) {
            const mg = await prisma.muscleGroup.findUnique({ where: { id: muscleGroupId } });
            if (mg) {
                muscleGroup = mg.name;
            }
        }

        const exercise = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                muscleGroup: muscleGroup || "Desconhecido",
                muscleGroupId: muscleGroupId || null,
                mediaUrl: mediaUrl || null,
            },
        });

        return NextResponse.json(exercise);
    } catch (error) {
        console.error("Failed to update exercise:", error);
        return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
    }
}
