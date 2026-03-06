import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-check";

export async function GET() {
    const { user, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    try {
        const exercises = await prisma.exercise.findMany({
            orderBy: { name: "asc" },
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
        const { name, muscleGroup, mediaUrl } = body;

        if (!name || !muscleGroup) {
            return NextResponse.json({ error: "Name and muscleGroup are required" }, { status: 400 });
        }

        const exercise = await prisma.exercise.create({
            data: {
                name,
                muscleGroup,
                mediaUrl: mediaUrl || null,
            },
        });

        return NextResponse.json(exercise, { status: 201 });
    } catch (error) {
        console.error("Failed to create exercise:", error);
        return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
    }
}
