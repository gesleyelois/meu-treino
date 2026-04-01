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

        if (Array.isArray(body?.exercises)) {
            const items = body.exercises as Array<{
                name?: string;
                muscleGroupId?: string | null;
                muscleGroup?: string | null;
                mediaUrl?: string | null;
            }>;

            if (items.length === 0) {
                return NextResponse.json({ error: "Exercises array cannot be empty" }, { status: 400 });
            }

            const created: Array<{ id: string; name: string }> = [];
            const failed: Array<{ index: number; reason: string }> = [];

            for (const [index, item] of items.entries()) {
                if (!item?.name || (!item.muscleGroupId && !item.muscleGroup)) {
                    failed.push({ index, reason: "name and muscleGroupId or muscleGroup are required" });
                    continue;
                }

                try {
                    let resolvedMuscleGroup = item.muscleGroup || undefined;

                    if (item.muscleGroupId) {
                        const mg = await prisma.muscleGroup.findUnique({ where: { id: item.muscleGroupId } });
                        if (!mg) {
                            failed.push({ index, reason: `muscleGroupId not found: ${item.muscleGroupId}` });
                            continue;
                        }
                        resolvedMuscleGroup = mg.name;
                    }

                    const exercise = await prisma.exercise.create({
                        data: {
                            name: item.name,
                            muscleGroup: resolvedMuscleGroup || "Desconhecido",
                            muscleGroupId: item.muscleGroupId || null,
                            mediaUrl: item.mediaUrl || null,
                        },
                        select: { id: true, name: true },
                    });
                    created.push(exercise);
                } catch (err) {
                    console.error("Failed to import exercise item:", err);
                    failed.push({ index, reason: "failed to create exercise" });
                }
            }

            return NextResponse.json({
                imported: created.length,
                failed: failed.length,
                created,
                errors: failed,
            }, { status: created.length > 0 ? 201 : 400 });
        }

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
