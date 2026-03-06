import { db, type CatalogSplit } from "./db";

/**
 * Fetch workout catalog from API and cache in IndexedDB.
 * Returns cached data if offline.
 */
export async function refreshCatalog(): Promise<CatalogSplit[]> {
    try {
        const res = await fetch("/api/workouts");
        if (!res.ok) throw new Error("API error");

        const splits: CatalogSplit[] = await res.json();

        // Replace entire catalog cache
        await db.catalog.clear();
        await db.catalog.bulkPut(splits);

        return splits;
    } catch {
        // Offline — return cached
        console.log("Offline: using cached catalog");
        return db.catalog.toArray();
    }
}

/**
 * Get catalog from IndexedDB cache (no network).
 */
export async function getCatalog(): Promise<CatalogSplit[]> {
    return db.catalog.toArray();
}

/**
 * Get a single split from cache.
 */
export async function getSplit(id: string): Promise<CatalogSplit | undefined> {
    return db.catalog.get(id);
}

/**
 * Sync all pending workout logs to the server.
 * Removes successfully synced items from the queue.
 */
export async function syncPendingLogs(): Promise<{ synced: number }> {
    const pending = await db.syncQueue.toArray();

    if (pending.length === 0) return { synced: 0 };

    try {
        const res = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                logs: pending.map(({ localId, ...rest }) => rest),
            }),
        });

        if (!res.ok) throw new Error("Sync failed");

        const data = await res.json();

        // Clear synced items
        const ids = pending.map((p) => p.localId).filter(Boolean) as number[];
        await db.syncQueue.bulkDelete(ids);

        return { synced: data.synced };
    } catch (error) {
        console.warn("Sync failed, will retry later:", error);
        return { synced: 0 };
    }
}

/**
 * Get number of pending sync items.
 */
export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.count();
}

/**
 * Register online listener to auto-sync when connection returns.
 */
export function registerSyncOnReconnect() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", async () => {
        console.log("Back online — syncing pending logs...");
        const result = await syncPendingLogs();
        if (result.synced > 0) {
            console.log(`✅ Synced ${result.synced} workout(s)`);
        }
    });
}
