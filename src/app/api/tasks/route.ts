import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { mockTasks } from "@/lib/mockData";

const COLLECTION = "tasks";

/**
 * GET /api/tasks
 * Returns all tasks from Firestore. Seeds mock data on first access.
 */
export async function GET() {
  try {
    const db = getAdminFirestore();
    const col = db.collection(COLLECTION);
    const snapshot = await col.get();

    if (snapshot.empty) {
      const batch = db.batch();
      for (const task of mockTasks) {
        batch.set(col.doc(task.id), task);
      }
      await batch.commit();

      return NextResponse.json(mockTasks);
    }

    const tasks = snapshot.docs.map((doc) => doc.data());
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tasks";
    console.error("[api/tasks] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Creates a new task in Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    const task = await request.json();
    if (!task.id || !task.title) {
      return NextResponse.json(
        { error: "Task must have an id and title" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(task.id).set(task);

    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    console.error("[api/tasks] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/tasks
 * Updates an existing task in Firestore.
 */
export async function PUT(request: NextRequest) {
  try {
    const task = await request.json();
    if (!task.id) {
      return NextResponse.json(
        { error: "Task must have an id" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(task.id).set(task, { merge: true });

    return NextResponse.json(task);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update task";
    console.error("[api/tasks] PUT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks
 * Deletes a task by id (passed as query param ?id=...).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task id is required as query param" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(taskId).delete();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete task";
    console.error("[api/tasks] DELETE error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
