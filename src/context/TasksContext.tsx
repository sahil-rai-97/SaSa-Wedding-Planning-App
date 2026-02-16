"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getFirebaseFirestore } from "@/lib/firebase";
import { mockTasks, type Task } from "@/lib/mockData";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

const COLLECTION = "tasks";

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: Task) => void;
  editTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  loading: true,
  error: null,
  addTask: () => {},
  editTask: () => {},
  deleteTask: () => {},
});

async function seedIfEmpty(db: Firestore) {
  const col = collection(db, COLLECTION);
  const snapshot = await getDocs(col);
  if (snapshot.empty) {
    const batch = writeBatch(db);
    for (const task of mockTasks) {
      batch.set(doc(db, COLLECTION, task.id), task);
    }
    await batch.commit();
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const db = getFirebaseFirestore();
      if (!db) {
        setError(
          "Firestore not initialized. Check that your NEXT_PUBLIC_FIREBASE_* environment variables are set correctly."
        );
        setLoading(false);
        return;
      }

      try {
        await seedIfEmpty(db);

        const col = collection(db, COLLECTION);
        unsubscribe = onSnapshot(
          col,
          (snapshot) => {
            const data = snapshot.docs.map((d) => d.data() as Task);
            setTasks(data);
            setLoading(false);
            setError(null);
          },
          (err) => {
            setError(`Firestore listener error: ${err.code} — ${err.message}`);
            setLoading(false);
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize tasks: ${message}`);
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addTask = useCallback(async (task: Task) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot add task.");
      return;
    }
    try {
      await setDoc(doc(db, COLLECTION, task.id), task);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to add task: ${message}`);
    }
  }, []);

  const editTask = useCallback(async (updatedTask: Task) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot edit task.");
      return;
    }
    try {
      await setDoc(doc(db, COLLECTION, updatedTask.id), updatedTask);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update task: ${message}`);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError("Firestore not available — cannot delete task.");
      return;
    }
    try {
      await deleteDoc(doc(db, COLLECTION, taskId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete task: ${message}`);
    }
  }, []);

  return (
    <TasksContext.Provider
      value={{ tasks, loading, error, addTask, editTask, deleteTask }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);
