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
  Unassigned: "bg-gray-100 text-gray-500",
};

function getOwnerInitials(owner: TaskOwner): string {
  if (owner === "Unassigned") return "?";
  return owner.charAt(0);
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

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor:
          task.status === "done"
            ? "#22c55e"
            : task.status === "in-progress"
            ? "#3b82f6"
            : "#d1d5db",
      }}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
          <StatusIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${status.color}`} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(parseISO(task.dueDate), "MMM d")}
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                <span className="text-sm">{task.owner}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Due Date</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(parseISO(task.dueDate), "MMM d, yyyy")}
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
    <div className="flex-1 min-w-[280px]">
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
      <ScrollArea className="h-[calc(100vh-320px)]">
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

  const filteredTasks = useMemo(() => {
    if (ownerFilter.length === 0) return mockTasks;
    return mockTasks.filter((t) => ownerFilter.includes(t.owner));
  }, [ownerFilter]);

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your wedding planning tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filter
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
              {(["Sahil", "Saloni", "Unassigned"] as TaskOwner[]).map(
                (owner) => (
                  <DropdownMenuCheckboxItem
                    key={owner}
                    checked={ownerFilter.includes(owner)}
                    onCheckedChange={() => toggleOwnerFilter(owner)}
                  >
                    {owner}
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
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1">Files</div>
              <div className="col-span-2">Context</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {filteredTasks.map((task) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              return (
                <button
                  key={task.id}
                  className="w-full grid grid-cols-12 gap-4 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-left items-center"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="col-span-1">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.description}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ownerColors[task.owner]}`}
                    >
                      {task.owner}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(parseISO(task.dueDate), "MMM d, yyyy")}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {task.fileIds.length > 0 ? (
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                        <FileText className="h-2.5 w-2.5" />
                        {task.fileIds.length}
                      </Badge>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground truncate">
                    {task.contextLog.length > 0
                      ? `${task.contextLog.length} entries`
                      : "—"}
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
