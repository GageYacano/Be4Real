import { getDB } from "./mongo.js";

/**
 * Sets up database indexes
 */
export async function setupIndexes() {
    try {
        const db = await getDB();

        // one reaction per post per user
        await db.collection("reactions").createIndex(
            { post: 1, user: 1 },
            { unique: true }
        );
    } catch (error: any) {
        console.error("Error creating database indexes:", error);
        throw error;
    }
}
