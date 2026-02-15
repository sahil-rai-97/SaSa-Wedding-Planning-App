"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  mockTasks,
  mockCalendarEvents,
  WEDDING_DATE,
  WEDDING_VENUE,
  type CalendarEvent,
} from "@/lib/mockData";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ListTodo,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Circle,
  Star,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
} from "date-fns";

function getEventTypeColor(type: CalendarEvent["type"]) {
  switch (type) {
    case "deadline":
      return "bg-red-500";
    case "appointment":
      return "bg-blue-500";
    case "milestone":
      return "bg-amber-500";
  }
}

function getEventTypeBadge(type: CalendarEvent["type"]) {
  switch (type) {
    case "deadline":
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Deadline</Badge>;
    case "appointment":
      return <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">Appt</Badge>;
    case "milestone":
      return <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">Milestone</Badge>;
  }
}

export function DashboardView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const stats = useMemo(() => {
    const total = mockTasks.length;
    const done = mockTasks.filter((t) => t.status === "done").length;
    const inProgress = mockTasks.filter((t) => t.status === "in-progress").length;
    const todo = mockTasks.filter((t) => t.status === "todo").length;
    return { total, done, inProgress, todo };
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsForDate = (date: Date) =>
    mockCalendarEvents.filter((evt) => isSameDay(parseISO(evt.date), date));

  const selectedDateEvents = selectedDate
    ? eventsForDate(selectedDate)
    : [];

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return mockCalendarEvents
      .filter((evt) => parseISO(evt.date) >= now)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, []);

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (WEDDING_DATE.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your wedding planning at a glance
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Left</p>
                <p className="text-3xl font-bold text-rose-600">{daysLeft}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {WEDDING_VENUE}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.inProgress}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active tasks being worked on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.done}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.done / stats.total) * 100)}% of all tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendar</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Deadline
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Appointment
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Milestone
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayEvents = eventsForDate(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isWeddingDay = isSameDay(day, WEDDING_DATE);
                const isSelected =
                  selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-1 h-14 border border-transparent text-sm rounded-md
                      transition-colors
                      ${!inMonth ? "text-muted-foreground/40" : ""}
                      ${today ? "bg-blue-50 font-semibold" : ""}
                      ${isWeddingDay ? "bg-rose-50 ring-2 ring-rose-300 font-bold text-rose-700" : ""}
                      ${isSelected && !isWeddingDay ? "bg-gray-100 ring-2 ring-gray-300" : ""}
                      hover:bg-gray-50
                    `}
                  >
                    <span className="text-xs">{format(day, "d")}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 justify-center mt-0.5">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <div
                            key={evt.id}
                            className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(evt.type)}`}
                          />
                        ))}
                      </div>
                    )}
                    {isWeddingDay && (
                      <Star className="absolute top-0.5 right-0.5 h-3 w-3 text-rose-500 fill-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected date events */}
            {selectedDate && selectedDateEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">
                  {format(selectedDate, "MMMM d, yyyy")}
                </p>
                <div className="space-y-2">
                  {selectedDateEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${getEventTypeColor(evt.type)}`}
                      />
                      <span className="flex-1">{evt.title}</span>
                      {getEventTypeBadge(evt.type)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events sidebar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getEventTypeColor(evt.type)}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{evt.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(evt.date), "MMM d, yyyy")}
                  </p>
                </div>
                {getEventTypeBadge(evt.type)}
              </div>
            ))}

            <Separator />

            {/* Wedding countdown */}
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-1.5 text-rose-600">
                <Star className="h-4 w-4 fill-rose-500" />
                <span className="text-sm font-semibold">Wedding Day</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(WEDDING_DATE, "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            {/* Task progress */}
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Task Progress</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Circle className="h-3 w-3 text-gray-400" /> To Do
                  </span>
                  <span className="font-medium">{stats.todo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-blue-500" /> In Progress
                  </span>
                  <span className="font-medium">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-500" /> Done
                  </span>
                  <span className="font-medium">{stats.done}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                  style={{
                    width: `${(stats.done / stats.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {Math.round((stats.done / stats.total) * 100)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
