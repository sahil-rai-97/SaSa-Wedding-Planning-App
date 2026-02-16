"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { type Task } from "@/lib/mockData";

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

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `GET /api/tasks failed with status ${res.status}`
          );
        }
        const data: Task[] = await res.json();
        if (!cancelled) {
          setTasks(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : String(err);
          setError(`Failed to load tasks: ${message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  const addTask = useCallback(async (task: Task) => {
    setTasks((prev) => [...prev, task]);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `POST /api/tasks failed with status ${res.status}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to save new task: ${message}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
  }, []);

  const editTask = useCallback(async (updatedTask: Task) => {
    let previousTasks: Task[] = [];
    setTasks((prev) => {
      previousTasks = prev;
      return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    });

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `PUT /api/tasks failed with status ${res.status}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update task: ${message}`);
      setTasks(previousTasks);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    let previousTasks: Task[] = [];
    setTasks((prev) => {
      previousTasks = prev;
      return prev.filter((t) => t.id !== taskId);
    });

    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `DELETE /api/tasks failed with status ${res.status}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete task: ${message}`);
      setTasks(previousTasks);
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
