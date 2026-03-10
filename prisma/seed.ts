import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

const MUSCLE_GROUPS = [
    { name: "Peito", category: null, order: 1 },
    { name: "Costas", category: null, order: 2 },
    { name: "Quadríceps", category: "Pernas", order: 3 },
    { name: "Posteriores", category: "Pernas", order: 4 },
    { name: "Glúteos", category: null, order: 5 },
    { name: "Ombros", category: null, order: 6 },
    { name: "Bíceps", category: "Braços", order: 7 },
    { name: "Tríceps", category: "Braços", order: 8 },
    { name: "Panturrilhas", category: null, order: 9 },
    { name: "Abdômen", category: null, order: 10 },
];

const EXERCISES = [
    {
        name: "Barbell Squat",
        muscleGroup: "Quadríceps",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-squat-front.mp4",
    },
    {
        name: "Bench Press",
        muscleGroup: "Peito",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4",
    },
    {
        name: "Deadlift",
        muscleGroup: "Posteriores",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-deadlift-front.mp4",
    },
    {
        name: "Overhead Press",
        muscleGroup: "Ombros",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-overhead-press-front.mp4",
    },
    {
        name: "Barbell Row",
        muscleGroup: "Costas",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bent-over-row-front.mp4",
    },
    {
        name: "Leg Press",
        muscleGroup: "Quadríceps",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-leg-press-side.mp4",
    },
];

async function main() {
    console.log("🌱 Seeding database...");

    // Seed muscle groups (upsert to avoid duplicates)
    const createdMuscleGroups = await Promise.all(
        MUSCLE_GROUPS.map((mg) =>
            prisma.muscleGroup.upsert({
                where: { name: mg.name },
                update: { category: mg.category, order: mg.order },
                create: mg,
            })
        )
    );

    console.log(`  ✅ Created/updated ${createdMuscleGroups.length} muscle groups`);

    // Create a map for quick lookups
    const mgMap = new Map(createdMuscleGroups.map((mg) => [mg.name, mg.id]));

    // Check if exercises already exist; if not, create them
    const existingExercises = await prisma.exercise.findMany();
    if (existingExercises.length === 0) {
        // Clear and recreate exercises
        const createdExercises = await Promise.all(
            EXERCISES.map((ex) =>
                prisma.exercise.create({
                    data: {
                        name: ex.name,
                        muscleGroup: ex.muscleGroup,
                        muscleGroupId: mgMap.get(ex.muscleGroup) || null,
                        mediaUrl: ex.mediaUrl,
                    },
                })
            )
        );
        console.log(`  ✅ Created ${createdExercises.length} exercises`);
    } else {
        // Update existing exercises to link to muscle groups
        for (const ex of existingExercises) {
            const mgId = mgMap.get(ex.muscleGroup);
            if (mgId && !ex.muscleGroupId) {
                await prisma.exercise.update({
                    where: { id: ex.id },
                    data: { muscleGroupId: mgId },
                });
            }
        }
        console.log(`  ✅ Updated ${existingExercises.length} existing exercises with muscle group links`);
    }

    console.log("🌱 Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
