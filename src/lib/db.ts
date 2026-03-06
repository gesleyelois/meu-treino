import Dexie, { type EntityTable } from "dexie";

// ── Catalog types (cached from API) ────────────────────────────────
export interface CatalogExercise {
    id: string;
    name: string;
    muscleGroup: string;
    mediaUrl: string | null;
}

export interface CatalogWorkoutExercise {
    id: string;
    exerciseId: string;
    exercise: CatalogExercise;
    sets: number;
    targetReps: number;
    restTimeSeconds: number;
    order: number;
}

export interface CatalogSplit {
    id: string;
    name: string;
    description: string | null;
    exercises: CatalogWorkoutExercise[];
    logs?: { date: string; id: string }[];
}

// ── Sync queue types ───────────────────────────────────────────────
export interface SyncExerciseLog {
    exerciseId: string;
    setNumber: number;
    repsCompleted: number;
    weightUsed: number;
}

export interface SyncWorkoutLog {
    localId?: number;       // auto-increment PK in IndexedDB
    clientId: string;       // UUID generated client-side
    date: string;           // ISO string
    workoutSplitId: string;
    exerciseLogs: SyncExerciseLog[];
}

// ── Dexie database ────────────────────────────────────────────────
class WorkoutDB extends Dexie {
    catalog!: EntityTable<CatalogSplit, "id">;
    syncQueue!: EntityTable<SyncWorkoutLog, "localId">;

    constructor() {
        super("WorkoutTracker");

        this.version(1).stores({
            catalog: "id, name",
            syncQueue: "++localId, clientId, workoutSplitId",
        });
    }
}

export const db = new WorkoutDB();
