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
        const existing = await prisma.workoutExercise.findFirst({
            where: { exerciseId: id }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Cannot delete exercise because it is currently used in User Workouts. Remove references first." },
                { status: 400 }
            );
        }

        await prisma.exercise.delete({
            where: { id }
        });

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
        const { name, muscleGroup, mediaUrl } = body;

        if (!name || !muscleGroup) {
            return NextResponse.json({ error: "Name and muscleGroup are required" }, { status: 400 });
        }

        const exercise = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                muscleGroup,
                mediaUrl: mediaUrl || null,
            },
        });

        return NextResponse.json(exercise);
    } catch (error) {
        console.error("Failed to update exercise:", error);
        return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
    }
}
