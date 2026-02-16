"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Task,
  type TaskStatus,
  type TaskOwner,
  type TaskCategory,
} from "@/lib/mockData";
import { useTasks } from "@/context/TasksContext";
import {
  Calendar,
  User,
  FileText,
  MessageSquare,
  Circle,
  Clock,
  CheckCircle2,
  LayoutGrid,
  List,
  Filter,
  Tag,
  Paintbrush,
  Plus,
  Pencil,
  Trash2,
  CalendarIcon,
  X,
  Loader2,
  AlertTriangle,
  Copy,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, addDays, isBefore, isAfter, startOfDay } from "date-fns";

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  todo: {
    label: "To Do",
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
};

const ownerColors: Record<TaskOwner, string> = {
  Sahil: "bg-blue-100 text-blue-700",
  Saloni: "bg-pink-100 text-pink-700",
  Both: "bg-purple-100 text-purple-700",
  Unassigned: "bg-gray-100 text-gray-500",
};

const categoryColors: Record<TaskCategory, string> = {
  "General Prep": "bg-slate-100 text-slate-700",
  Haldi: "bg-yellow-100 text-yellow-800",
  Mehendi: "bg-green-100 text-green-700",
  "Ganesh Pooja + Wedding": "bg-orange-100 text-orange-700",
  "Dinner / Hang": "bg-indigo-100 text-indigo-700",
  Night: "bg-violet-100 text-violet-700",
};

const allCategories: TaskCategory[] = [
  "General Prep",
  "Haldi",
  "Mehendi",
  "Ganesh Pooja + Wedding",
  "Dinner / Hang",
  "Night",
];

const allOwners: TaskOwner[] = ["Sahil", "Saloni", "Both", "Unassigned"];
const allStatuses: TaskStatus[] = ["todo", "in-progress", "done"];

function getOwnerInitials(owner: TaskOwner): string {
  if (owner === "Unassigned") return "?";
  if (owner === "Both") return "S+S";
  return owner.charAt(0);
}

type DateFilter = "upcoming" | "past-due";

function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate) < new Date();
}

function isUpcoming(dueDate: string): boolean {
  if (!dueDate) return false;
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  const due = startOfDay(parseISO(dueDate));
  return !isBefore(due, today) && !isAfter(due, nextWeek);
}

function isPastDue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  const today = startOfDay(new Date());
  return isBefore(startOfDay(parseISO(dueDate)), today);
}

const dateFilterConfig: Record<
  DateFilter,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  upcoming: {
    label: "Upcoming (7 days)",
    icon: CalendarClock,
    color: "text-blue-600",
    bgColor: "bg-blue-50 text-blue-700",
  },
  "past-due": {
    label: "Past Due",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 text-red-700",
  },
};

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getEmptyTask(): Omit<Task, "id"> {
  return {
    title: "",
    description: "",
    category: "General Prep",
    dueDate: "",
    status: "todo",
    owner: "Unassigned",
    fileIds: [],
    contextLog: [],
    decoratorTopic: false,
  };
}

// ── Date Picker with Calendar Popover ────────────────────────────────────────

function DatePickerField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-9"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {value ? (
              format(parseISO(value), "EEE, MMM d, yyyy")
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
            {value && (
              <X
                className="ml-auto h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarWidget
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
              } else {
                onChange("");
              }
              setOpen(false);
            }}
            defaultMonth={selected || new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Add / Edit Task Dialog ───────────────────────────────────────────────────

function TaskFormDialog({
  open,
  onClose,
  onSave,
  initialTask,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  initialTask: Task;
  mode: "add" | "edit";
}) {
  const [formData, setFormData] = useState<Task>(initialTask);

  // Reset form when dialog opens with new task
  const resetKey = initialTask.id;
  useState(() => {
    setFormData(initialTask);
  });

  // Sync when initialTask changes (e.g. opening a different task to edit)
  const [prevId, setPrevId] = useState(resetKey);
  if (resetKey !== prevId) {
    setPrevId(resetKey);
    setFormData(initialTask);
  }

  const updateField = <K extends keyof Task>(key: K, value: Task[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details to create a new task."
              : "Update any field below and save your changes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Enter task description..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => updateField("category", v as TaskCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v as TaskStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => {
                    const cfg = statusConfig[s];
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Owner + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select
                value={formData.owner}
                onValueChange={(v) => updateField("owner", v as TaskOwner)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {allOwners.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o === "Both" ? "Sahil + Saloni" : o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DatePickerField
              label="Due Date"
              value={formData.dueDate}
              onChange={(date) => updateField("dueDate", date)}
            />
          </div>

          {/* Decorator topic toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Decorator Topic</Label>
              <p className="text-xs text-muted-foreground">
                Mark if this needs discussion with the decorator
              </p>
            </div>
            <Switch
              checked={formData.decoratorTopic}
              onCheckedChange={(checked) => updateField("decoratorTopic", checked)}
            />
          </div>

          {/* Context Log (edit mode only) */}
          {mode === "edit" && formData.contextLog.length > 0 && (
            <div className="space-y-1.5">
              <Label>Context Log</Label>
              <div className="space-y-2">
                {formData.contextLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Input
                      value={entry}
                      onChange={(e) => {
                        const updated = [...formData.contextLog];
                        updated[i] = e.target.value;
                        updateField("contextLog", updated);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const updated = formData.contextLog.filter((_, idx) => idx !== i);
                        updateField("contextLog", updated);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            {mode === "add" ? "Add Task" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  task,
  open,
  onClose,
  onConfirm,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{task.title}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Task Detail Dialog (view mode with edit/delete actions) ──────────────────

function TaskDetailDialog({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (!task) return null;

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={categoryColors[task.category]}>
              {task.category}
            </Badge>
            {task.decoratorTopic && (
              <Badge className="bg-amber-100 text-amber-700">
                <Paintbrush className="h-3 w-3 mr-1" />
                Discuss with Decorator
              </Badge>
            )}
            {overdue && <Badge variant="destructive">Overdue</Badge>}
          </div>

          <p className="text-sm text-muted-foreground">{task.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Status
              </p>
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`h-4 w-4 ${status.color}`} />
                <span className="text-sm">{status.label}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Owner</p>
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {task.owner === "Both" ? "Sahil + Saloni" : task.owner}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Due Date
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`text-sm ${overdue ? "text-red-600 font-medium" : ""}`}
                >
                  {task.dueDate
                    ? format(parseISO(task.dueDate), "EEE, MMM d, yyyy")
                    : "Not set"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Files</p>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.fileIds.length} attached</span>
              </div>
            </div>
          </div>

          {task.contextLog.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Context Log
                  </p>
                </div>
                <div className="space-y-2">
                  {task.contextLog.map((entry, i) => (
                    <div
                      key={i}
                      className="text-sm bg-muted/50 rounded-md px-3 py-2"
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onClose();
                onDelete(task);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor:
          task.status === "done"
            ? "#22c55e"
            : task.status === "in-progress"
            ? "#3b82f6"
            : overdue
            ? "#ef4444"
            : "#d1d5db",
      }}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
          <StatusIcon
            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${status.color}`}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${categoryColors[task.category]}`}
          >
            {task.category}
          </Badge>
          {task.decoratorTopic && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
            >
              <Paintbrush className="h-2.5 w-2.5 mr-0.5" />
              Decorator
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {task.dueDate ? (
              <>
                <Calendar className="h-3 w-3" />
                <span className={overdue ? "text-red-600 font-medium" : ""}>
                  {format(parseISO(task.dueDate), "MMM d")}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground/60">No date</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {task.fileIds.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 gap-1"
              >
                <FileText className="h-2.5 w-2.5" />
                {task.fileIds.length}
              </Badge>
            )}
            <Avatar className="h-5 w-5">
              <AvatarFallback
                className={`text-[10px] ${ownerColors[task.owner]}`}
              >
                {getOwnerInitials(task.owner)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex-1 min-w-[300px]">
      <div className={`rounded-t-lg ${config.bgColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <h3 className="font-medium text-sm">{config.label}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-340px)]">
        <div className="space-y-3 p-3 bg-muted/30 rounded-b-lg min-h-[200px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main TasksView ───────────────────────────────────────────────────────────

export function TasksView() {
  const { tasks, loading, error, addTask, editTask, deleteTask } = useTasks();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<TaskOwner[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter[]>([]);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (ownerFilter.length > 0) {
      filtered = filtered.filter((t) => ownerFilter.includes(t.owner));
    }
    if (categoryFilter.length > 0) {
      filtered = filtered.filter((t) => categoryFilter.includes(t.category));
    }
    if (statusFilter.length > 0) {
      filtered = filtered.filter((t) => statusFilter.includes(t.status));
    }
    if (dateFilter.length > 0) {
      filtered = filtered.filter((t) => {
        const matchUpcoming = dateFilter.includes("upcoming") && isUpcoming(t.dueDate);
        const matchPastDue = dateFilter.includes("past-due") && isPastDue(t.dueDate, t.status);
        return matchUpcoming || matchPastDue;
      });
    }
    return filtered;
  }, [tasks, ownerFilter, categoryFilter, statusFilter, dateFilter]);

  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === "todo"),
      "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
      done: filteredTasks.filter((t) => t.status === "done"),
    };
  }, [filteredTasks]);

  const toggleOwnerFilter = (owner: TaskOwner) => {
    setOwnerFilter((prev) =>
      prev.includes(owner)
        ? prev.filter((o) => o !== owner)
        : [...prev, owner]
    );
  };

  const toggleCategoryFilter = (cat: TaskCategory) => {
    setCategoryFilter((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleDateFilter = (df: DateFilter) => {
    setDateFilter((prev) =>
      prev.includes(df)
        ? prev.filter((d) => d !== df)
        : [...prev, df]
    );
  };

  // ── Task CRUD Handlers ───────────────────────────────────────────────────

  const handleAddTask = useCallback((task: Task) => {
    addTask(task);
  }, [addTask]);

  const handleEditTask = useCallback((updatedTask: Task) => {
    editTask(updatedTask);
  }, [editTask]);

  const handleDeleteTask = useCallback(() => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    setTaskToDelete(null);
    setDeleteDialogOpen(false);
  }, [taskToDelete, deleteTask]);

  const openEditDialog = useCallback((task: Task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  }, []);

  // New task template
  const newTask: Task = {
    id: generateTaskId(),
    ...getEmptyTask(),
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="max-w-lg w-full">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-800">Error Loading Tasks</h3>
                <pre className="mt-2 text-sm text-red-700 bg-red-100 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all select-all font-mono">
                  {error}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(error)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy error message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Error banner for mutation errors (tasks still loaded) */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-800 text-sm">Error</p>
              <pre className="mt-1 text-sm text-red-700 bg-red-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all select-all font-mono">
                {error}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(error)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-medium"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy error message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {filteredTasks.length} tasks &middot;{" "}
            {filteredTasks.filter((t) => t.status === "done").length} done
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Task button */}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>

          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Category
                {categoryFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0"
                  >
                    {categoryFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allCategories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={categoryFilter.includes(cat)}
                  onCheckedChange={() => toggleCategoryFilter(cat)}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Circle className="h-3.5 w-3.5" />
                Status
                {statusFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0"
                  >
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allStatuses.map((s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={statusFilter.includes(s)}
                    onCheckedChange={() => toggleStatusFilter(s)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Due Date
                {dateFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0"
                  >
                    {dateFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Due Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["upcoming", "past-due"] as DateFilter[]).map((df) => {
                const cfg = dateFilterConfig[df];
                const Icon = cfg.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={df}
                    checked={dateFilter.includes(df)}
                    onCheckedChange={() => toggleDateFilter(df)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Owner filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Owner
                {ownerFilter.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1.5 py-0"
                  >
                    {ownerFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Owner</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["Sahil", "Saloni", "Both", "Unassigned"] as TaskOwner[]).map(
                (owner) => (
                  <DropdownMenuCheckboxItem
                    key={owner}
                    checked={ownerFilter.includes(owner)}
                    onCheckedChange={() => toggleOwnerFilter(owner)}
                  >
                    {owner === "Both" ? "Sahil + Saloni" : owner}
                  </DropdownMenuCheckboxItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "kanban" | "list")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="gap-1.5 text-xs px-3">
                <LayoutGrid className="h-3.5 w-3.5" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 text-xs px-3">
                <List className="h-3.5 w-3.5" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Active filters */}
      {(categoryFilter.length > 0 || ownerFilter.length > 0 || statusFilter.length > 0 || dateFilter.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter.map((s) => {
            const cfg = statusConfig[s];
            return (
              <Badge
                key={`status-${s}`}
                variant="secondary"
                className={`gap-1 cursor-pointer ${cfg.bgColor} ${cfg.color}`}
                onClick={() => toggleStatusFilter(s)}
              >
                {cfg.label} &times;
              </Badge>
            );
          })}
          {dateFilter.map((df) => {
            const cfg = dateFilterConfig[df];
            return (
              <Badge
                key={`date-${df}`}
                variant="secondary"
                className={`gap-1 cursor-pointer ${cfg.bgColor}`}
                onClick={() => toggleDateFilter(df)}
              >
                {cfg.label} &times;
              </Badge>
            );
          })}
          {categoryFilter.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className={`gap-1 cursor-pointer ${categoryColors[cat]}`}
              onClick={() => toggleCategoryFilter(cat)}
            >
              {cat} &times;
            </Badge>
          ))}
          {ownerFilter.map((owner) => (
            <Badge
              key={owner}
              variant="secondary"
              className={`gap-1 cursor-pointer ${ownerColors[owner]}`}
              onClick={() => toggleOwnerFilter(owner)}
            >
              {owner === "Both" ? "Sahil + Saloni" : owner} &times;
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => {
              setCategoryFilter([]);
              setOwnerFilter([]);
              setStatusFilter([]);
              setDateFilter([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(["todo", "in-progress", "done"] as TaskStatus[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground gap-4 px-2">
              <div className="col-span-1">Status</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2">Actions</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredTasks.map((task) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <div
                  key={task.id}
                  className="w-full grid grid-cols-12 gap-4 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors items-center group"
                >
                  <div className="col-span-1">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <button
                    className="col-span-3 text-left"
                    onClick={() => setSelectedTask(task)}
                  >
                    <p className="text-sm font-medium truncate hover:underline">
                      {task.title}
                    </p>
                  </button>
                  <div className="col-span-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${categoryColors[task.category]}`}
                    >
                      {task.category}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ownerColors[task.owner]}`}
                    >
                      {task.owner === "Both" ? "S + S" : task.owner}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    {task.dueDate ? (
                      <span
                        className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                      >
                        {format(parseISO(task.dueDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">
                        &mdash;
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEditDialog(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(task)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {task.decoratorTopic && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Paintbrush className="h-2.5 w-2.5" />
                      </Badge>
                    )}
                    {task.fileIds.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 gap-1"
                      >
                        <FileText className="h-2.5 w-2.5" />
                        {task.fileIds.length}
                      </Badge>
                    )}
                    {task.contextLog.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 gap-1"
                      >
                        <MessageSquare className="h-2.5 w-2.5" />
                        {task.contextLog.length}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Task Detail Dialog (view) */}
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      {/* Add Task Dialog */}
      <TaskFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddTask}
        initialTask={newTask}
        mode="add"
      />

      {/* Edit Task Dialog */}
      {taskToEdit && (
        <TaskFormDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setTaskToEdit(null);
          }}
          onSave={handleEditTask}
          initialTask={taskToEdit}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        task={taskToDelete}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}
