import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const exercises = await prisma.exercise.findMany({
            orderBy: { name: "asc" },
            include: { muscleGroupRel: true }
        });
        return NextResponse.json(exercises);
    } catch (error) {
        console.error("Failed to fetch exercises:", error);
        return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, muscleGroupId, mediaUrl } = body;

        let muscleGroup = body.muscleGroup;

        if (!name || (!muscleGroupId && !muscleGroup)) {
            return NextResponse.json({ error: "Name and muscleGroupId are required" }, { status: 400 });
        }

        if (muscleGroupId) {
            const mg = await prisma.muscleGroup.findUnique({ where: { id: muscleGroupId } });
            if (mg) {
                muscleGroup = mg.name;
            }
        }

        const exercise = await prisma.exercise.create({
            data: {
                name,
                muscleGroup: muscleGroup || "Desconhecido",
                muscleGroupId: muscleGroupId || null,
                mediaUrl: mediaUrl || null,
            },
        });

        return NextResponse.json(exercise, { status: 201 });
    } catch (error) {
        console.error("Failed to create exercise:", error);
        return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
    }
}
