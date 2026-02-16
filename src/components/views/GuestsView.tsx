"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserCheck,
  UserX,
  HelpCircle,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Cloud,
  CloudOff,
  Filter,
  Mail,
  Phone,
  UtensilsCrossed,
  MessageSquare,
  CalendarDays,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

interface Guest {
  row: number;
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  events: string[];
  numberOfGuests: number;
  dietaryRestrictions: string;
  plusOneName: string;
  plusOneDietary: string;
  message: string;
}

const attendingConfig = {
  yes: {
    label: "Attending",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: UserCheck,
  },
  no: {
    label: "Declined",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: UserX,
  },
  maybe: {
    label: "Maybe",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: HelpCircle,
  },
};

const ALL_EVENTS = [
  "Haldi",
  "Mehendi",
  "Ganesh Pooja + Wedding",
  "Dinner / Hang",
];

type AttendingFilter = "yes" | "no" | "maybe";

export function GuestsView() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendingFilter, setAttendingFilter] = useState<AttendingFilter[]>([]);
  const [eventFilter, setEventFilter] = useState<string[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guests");
      const data = await res.json();
      if (res.ok && !data.error) {
        setGuests(data.guests ?? []);
        setIsLive(true);
      } else {
        setGuests([]);
        setIsLive(false);
        setError(data.error ?? "Failed to load guests");
      }
    } catch {
      setGuests([]);
      setIsLive(false);
      setError("Could not connect to Google Sheets API");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const stats = useMemo(() => {
    const total = guests.length;
    const attending = guests.filter((g) => g.attending === "yes").length;
    const declined = guests.filter((g) => g.attending === "no").length;
    const maybe = guests.filter((g) => g.attending === "maybe").length;
    const totalHeadcount = guests
      .filter((g) => g.attending === "yes")
      .reduce((sum, g) => sum + g.numberOfGuests, 0);
    return { total, attending, declined, maybe, totalHeadcount };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    let result = guests;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.plusOneName.toLowerCase().includes(q)
      );
    }

    if (attendingFilter.length > 0) {
      result = result.filter((g) => attendingFilter.includes(g.attending));
    }

    if (eventFilter.length > 0) {
      result = result.filter((g) =>
        eventFilter.some((e) => g.events.includes(e))
      );
    }

    return result;
  }, [guests, searchQuery, attendingFilter, eventFilter]);

  const toggleAttendingFilter = (val: AttendingFilter) => {
    setAttendingFilter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleEventFilter = (val: string) => {
    setEventFilter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guest List</h1>
          <p className="text-muted-foreground">
            RSVPs from Google Sheets
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-green-50 text-green-700 border-green-200"
            >
              <Cloud className="h-3.5 w-3.5" />
              Live from Google Sheets
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-amber-50 text-amber-700 border-amber-200"
            >
              <CloudOff className="h-3.5 w-3.5" />
              Not Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">
            Google Sheets not connected — {error}. RSVPs submitted via the
            public RSVP page will appear here once connected.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-shrink-0"
            onClick={fetchGuests}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RSVPs</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attending</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.attending}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maybe</p>
                <p className="text-3xl font-bold text-amber-600">
                  {stats.maybe}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.declined}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Headcount</p>
                <p className="text-3xl font-bold text-rose-600">
                  {stats.totalHeadcount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Confirmed guests + plus-ones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Attending filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Status
              {attendingFilter.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] px-1.5 py-0"
                >
                  {attendingFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by RSVP Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["yes", "no", "maybe"] as AttendingFilter[]).map((val) => {
              const cfg = attendingConfig[val];
              const Icon = cfg.icon;
              return (
                <DropdownMenuCheckboxItem
                  key={val}
                  checked={attendingFilter.includes(val)}
                  onCheckedChange={() => toggleAttendingFilter(val)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Event filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Event
              {eventFilter.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] px-1.5 py-0"
                >
                  {eventFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Event</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_EVENTS.map((evt) => (
              <DropdownMenuCheckboxItem
                key={evt}
                checked={eventFilter.includes(evt)}
                onCheckedChange={() => toggleEventFilter(evt)}
              >
                {evt}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={fetchGuests}
          disabled={isLoading}
          title="Refresh guest list"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 ml-auto"
          onClick={() => {
            const url = `${window.location.origin}/rsvp`;
            navigator.clipboard.writeText(url);
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Copy RSVP Link
        </Button>
      </div>

      {/* Active filters */}
      {(attendingFilter.length > 0 || eventFilter.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {attendingFilter.map((val) => {
            const cfg = attendingConfig[val];
            return (
              <Badge
                key={`att-${val}`}
                variant="secondary"
                className={`gap-1 cursor-pointer ${cfg.color}`}
                onClick={() => toggleAttendingFilter(val)}
              >
                {cfg.label} &times;
              </Badge>
            );
          })}
          {eventFilter.map((evt) => (
            <Badge
              key={`evt-${evt}`}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleEventFilter(evt)}
            >
              {evt} &times;
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => {
              setAttendingFilter([]);
              setEventFilter([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading guest list from Google Sheets...
            </p>
          </div>
        </div>
      )}

      {/* Guest Table */}
      {!isLoading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground gap-4 px-2">
              <div className="col-span-3">Name</div>
              <div className="col-span-1">RSVP</div>
              <div className="col-span-3">Events</div>
              <div className="col-span-1">Guests</div>
              <div className="col-span-2">Dietary</div>
              <div className="col-span-2">Submitted</div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-520px)]">
              <div className="space-y-1">
                {filteredGuests.map((guest, idx) => {
                  const cfg = attendingConfig[guest.attending];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={`${guest.row}-${idx}`}
                      className="w-full grid grid-cols-12 gap-4 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors items-center text-left"
                      onClick={() => setSelectedGuest(guest)}
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium truncate">
                          {guest.fullName}
                        </p>
                        {guest.plusOneName && (
                          <p className="text-xs text-muted-foreground truncate">
                            +1: {guest.plusOneName}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${cfg.color}`}
                        >
                          <Icon className="h-2.5 w-2.5 mr-0.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="col-span-3 flex flex-wrap gap-1">
                        {guest.events.map((evt) => (
                          <Badge
                            key={evt}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {evt}
                          </Badge>
                        ))}
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm text-muted-foreground">
                          {guest.numberOfGuests}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground truncate block">
                          {guest.dietaryRestrictions || "—"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground">
                          {guest.timestamp
                            ? format(
                                parseISO(guest.timestamp),
                                "MMM d, yyyy"
                              )
                            : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredGuests.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery || attendingFilter.length > 0 || eventFilter.length > 0
                        ? "No guests match your filters"
                        : "No RSVPs yet. Share your RSVP link to get started!"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Guest Detail Dialog */}
      <GuestDetailDialog
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
      />
    </div>
  );
}

// ── Guest Detail Dialog ──────────────────────────────────────────────────────

function GuestDetailDialog({
  guest,
  open,
  onClose,
}: {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!guest) return null;

  const cfg = attendingConfig[guest.attending];
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{guest.fullName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cfg.color}>
              <Icon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
            <Badge variant="secondary">
              {guest.numberOfGuests} guest{guest.numberOfGuests > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {guest.email && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm">{guest.email}</p>
              </div>
            )}
            {guest.phone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="text-sm">{guest.phone}</p>
              </div>
            )}
          </div>

          {guest.events.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Attending Events
              </p>
              <div className="flex flex-wrap gap-1.5">
                {guest.events.map((evt) => (
                  <Badge key={evt} variant="outline">
                    {evt}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {guest.plusOneName && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Users className="h-3 w-3" /> Plus One
              </p>
              <p className="text-sm">{guest.plusOneName}</p>
              {guest.plusOneDietary && (
                <p className="text-xs text-muted-foreground">
                  Dietary: {guest.plusOneDietary}
                </p>
              )}
            </div>
          )}

          {guest.dietaryRestrictions && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <UtensilsCrossed className="h-3 w-3" /> Dietary Restrictions
              </p>
              <p className="text-sm">{guest.dietaryRestrictions}</p>
            </div>
          )}

          {guest.message && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Message
                </p>
                <div className="text-sm bg-muted/50 rounded-md px-3 py-2">
                  {guest.message}
                </div>
              </div>
            </>
          )}

          {guest.timestamp && (
            <p className="text-xs text-muted-foreground text-right">
              Submitted {format(parseISO(guest.timestamp), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
