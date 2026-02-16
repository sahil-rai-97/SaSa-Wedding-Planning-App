"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { TasksView } from "@/components/views/TasksView";
import { DriveView } from "@/components/views/DriveView";
import { GuestsView } from "@/components/views/GuestsView";
import { VendorsView } from "@/components/views/VendorsView";
import { AIChatbox } from "@/components/chat/AIChatbox";
import { TasksProvider } from "@/context/TasksContext";
import { VendorsProvider } from "@/context/VendorsContext";

type View = "dashboard" | "tasks" | "guests" | "vendors" | "drive";

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <TasksProvider>
      <VendorsProvider>
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
            {currentView === "guests" && <GuestsView />}
            {currentView === "vendors" && <VendorsView />}
            {currentView === "drive" && <DriveView />}
          </main>
          <AIChatbox />
        </div>
      </VendorsProvider>
    </TasksProvider>
  );
}
