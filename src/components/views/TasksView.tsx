"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  mockTasks,
  type Task,
  type TaskStatus,
  type TaskOwner,
  type TaskCategory,
} from "@/lib/mockData";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";

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

function getOwnerInitials(owner: TaskOwner): string {
  if (owner === "Unassigned") return "?";
  if (owner === "Both") return "S+S";
  return owner.charAt(0);
}

function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate) < new Date();
}

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
          <StatusIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${status.color}`} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${categoryColors[task.category]}`}
          >
            {task.category}
          </Badge>
          {task.decoratorTopic && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
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
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
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

function TaskDetailDialog({
  task,
  open,
  onClose,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
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
            {overdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{task.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Status</p>
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
              <p className="text-xs text-muted-foreground font-medium">Due Date</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm ${overdue ? "text-red-600 font-medium" : ""}`}>
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
                <span className="text-sm">
                  {task.fileIds.length} attached
                </span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

export function TasksView() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<TaskOwner[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory[]>([]);

  const filteredTasks = useMemo(() => {
    let tasks = mockTasks;
    if (ownerFilter.length > 0) {
      tasks = tasks.filter((t) => ownerFilter.includes(t.owner));
    }
    if (categoryFilter.length > 0) {
      tasks = tasks.filter((t) => categoryFilter.includes(t.category));
    }
    return tasks;
  }, [ownerFilter, categoryFilter]);

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Category
                {categoryFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
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

          {/* Owner filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Owner
                {ownerFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
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
      {(categoryFilter.length > 0 || ownerFilter.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
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
              <div className="col-span-2">Tags</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredTasks.map((task) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <button
                  key={task.id}
                  className="w-full grid grid-cols-12 gap-4 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-left items-center"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="col-span-1">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                  </div>
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
                      <span className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {format(parseISO(task.dueDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {task.decoratorTopic && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                        <Paintbrush className="h-2.5 w-2.5" />
                      </Badge>
                    )}
                    {task.fileIds.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                        <FileText className="h-2.5 w-2.5" />
                        {task.fileIds.length}
                      </Badge>
                    )}
                    {task.contextLog.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {task.contextLog.length}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Task detail dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
