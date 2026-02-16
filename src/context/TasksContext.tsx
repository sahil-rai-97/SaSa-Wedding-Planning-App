"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { mockTasks, type Task } from "@/lib/mockData";

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Task) => void;
  editTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  loading: true,
  addTask: () => {},
  editTask: () => {},
  deleteTask: () => {},
});

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data: Task[] = await res.json();
        if (!cancelled) {
          setTasks(data);
        }
      } catch (err) {
        console.warn("Could not load tasks from API, using mock data:", err);
        if (!cancelled) {
          setTasks(mockTasks);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();
    return () => { cancelled = true; };
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }).catch((err) => {
      console.error("Failed to persist new task:", err);
    });
  }, []);

  const editTask = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );

    fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    }).catch((err) => {
      console.error("Failed to persist task update:", err);
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    }).catch((err) => {
      console.error("Failed to persist task deletion:", err);
    });
  }, []);

  return (
    <TasksContext.Provider value={{ tasks, loading, addTask, editTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);
