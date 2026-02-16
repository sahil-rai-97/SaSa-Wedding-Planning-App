"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ListTodo,
  FolderOpen,
  LogOut,
  Heart,
  ChevronLeft,
  ChevronRight,
  Users,
  Store,
} from "lucide-react";
import { WEDDING_DATE, WEDDING_VENUE } from "@/lib/mockData";

type View = "dashboard" | "tasks" | "guests" | "vendors" | "drive";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "guests", label: "Guests", icon: Users },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "drive", label: "Drive", icon: FolderOpen },
];

function getDaysUntilWedding(): number {
  const now = new Date();
  const diff = WEDDING_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function Sidebar({
  currentView,
  onViewChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const daysLeft = getDaysUntilWedding();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-border transition-all duration-300 relative",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-white shadow-sm hover:bg-gray-50"
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">Wedding Planner</h2>
            <p className="text-xs text-muted-foreground truncate">
              S & S &middot; Apr 26, 2026
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Countdown */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="rounded-lg bg-gradient-to-r from-rose-50 to-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-rose-600">{daysLeft}</p>
            <p className="text-xs text-muted-foreground">days until the wedding</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {WEDDING_VENUE}
            </p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="px-2 py-3 text-center">
          <div className="rounded-lg bg-gradient-to-r from-rose-50 to-amber-50 p-2">
            <p className="text-lg font-bold text-rose-600">{daysLeft}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                isActive && "bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800",
                collapsed && "justify-center px-0"
              )}
              onClick={() => onViewChange(item.id)}
              title={item.label}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className={cn("p-3 flex items-center gap-3", collapsed && "justify-center")}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email || "Guest"}
            </p>
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
