"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TasksView } from "@/components/views/TasksView";
import { DriveView } from "@/components/views/DriveView";
import { AIChatbox } from "@/components/chat/AIChatbox";

type View = "dashboard" | "tasks" | "drive";

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-y-auto">
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "tasks" && <TasksView />}
        {currentView === "drive" && <DriveView />}
      </main>
      <AIChatbox />
    </div>
  );
}
