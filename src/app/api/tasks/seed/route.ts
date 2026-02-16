import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { mockTasks } from "@/lib/mockData";

const COLLECTION = "tasks";

/**
 * POST /api/tasks/seed
 * Seeds (or re-seeds) Firestore with mock task data.
 * Overwrites any existing documents with the same IDs.
 */
export async function POST() {
  try {
    const db = getAdminFirestore();
    const col = db.collection(COLLECTION);

    const batch = db.batch();
    for (const task of mockTasks) {
      batch.set(col.doc(task.id), task);
    }
    await batch.commit();

    return NextResponse.json({
      success: true,
      seeded: mockTasks.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to seed tasks";
    console.error("[api/tasks/seed] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
