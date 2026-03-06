import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

const EXERCISES = [
    // Full Body A
    {
        name: "Barbell Squat",
        muscleGroup: "Quadríceps",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-squat-front.mp4",
    },
    {
        name: "Bench Press",
        muscleGroup: "Peitoral",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4",
    },
    // Full Body B
    {
        name: "Deadlift",
        muscleGroup: "Posterior",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-deadlift-front.mp4",
    },
    {
        name: "Overhead Press",
        muscleGroup: "Deltóides",
        mediaUrl: "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-overhead-press-front.mp4",
    },
    // Full Body C
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

    // Clear existing data
    await prisma.exerciseLog.deleteMany();
    await prisma.workoutLog.deleteMany();
    await prisma.workoutExercise.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.workoutSplit.deleteMany();

    // Create exercises
    const createdExercises = await Promise.all(
        EXERCISES.map((ex) =>
            prisma.exercise.create({
                data: ex,
            })
        )
    );

    // Create splits
    const splits = [
        {
            name: "Full Body A",
            description: "Agachamento e Supino — foco em empurrar",
            exercises: [createdExercises[0], createdExercises[1]],
            sets: [4, 4],
            reps: [8, 10],
            rest: [120, 90],
        },
        {
            name: "Full Body B",
            description: "Levantamento Terra e Desenvolvimento — foco em puxar e vertical",
            exercises: [createdExercises[2], createdExercises[3]],
            sets: [3, 4],
            reps: [6, 10],
            rest: [150, 90],
        },
        {
            name: "Full Body C",
            description: "Remada e Leg Press — foco em costas e quadríceps",
            exercises: [createdExercises[4], createdExercises[5]],
            sets: [4, 3],
            reps: [10, 12],
            rest: [90, 90],
        },
    ];

    for (const split of splits) {
        const ws = await prisma.workoutSplit.create({
            data: {
                name: split.name,
                description: split.description,
            },
        });

        for (let i = 0; i < split.exercises.length; i++) {
            await prisma.workoutExercise.create({
                data: {
                    workoutSplitId: ws.id,
                    exerciseId: split.exercises[i].id,
                    sets: split.sets[i],
                    targetReps: split.reps[i],
                    restTimeSeconds: split.rest[i],
                    order: i,
                },
            });
        }

        console.log(`  ✅ Created split: ${ws.name}`);
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
