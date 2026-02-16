"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Loader2,
  AlertTriangle,
  Copy,
  Store,
  Tag,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useVendors } from "@/context/VendorsContext";
import { useTasks } from "@/context/TasksContext";
import {
  type Vendor,
  type VendorServiceType,
  type BookingStatus,
  ALL_SERVICE_TYPES,
  ALL_BOOKING_STATUSES,
  bookingStatusConfig,
} from "@/lib/vendorTypes";

function generateVendorId(): string {
  return `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getEmptyVendor(): Omit<Vendor, "id"> {
  return {
    name: "",
    serviceType: "Other",
    email: "",
    phone: "",
    website: "",
    quote: "",
    bookingStatus: "researching",
    notes: "",
    linkedTaskIds: [],
  };
}

// ── Vendor Form Dialog ───────────────────────────────────────────────────────

function VendorFormDialog({
  open,
  onClose,
  onSave,
  initialVendor,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  initialVendor: Vendor;
  mode: "add" | "edit";
}) {
  const [formData, setFormData] = useState<Vendor>(initialVendor);
  const { tasks } = useTasks();

  const [prevId, setPrevId] = useState(initialVendor.id);
  if (initialVendor.id !== prevId) {
    setPrevId(initialVendor.id);
    setFormData(initialVendor);
  }

  const updateField = <K extends keyof Vendor>(key: K, value: Vendor[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  const toggleLinkedTask = (taskId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedTaskIds: prev.linkedTaskIds.includes(taskId)
        ? prev.linkedTaskIds.filter((id) => id !== taskId)
        : [...prev.linkedTaskIds, taskId],
    }));
  };

  const decoratorTasks = tasks.filter((t) => t.decoratorTopic);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Vendor" : "Edit Vendor"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new vendor to your contacts."
              : "Update vendor details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="vendor-name">Name *</Label>
            <Input
              id="vendor-name"
              placeholder="Vendor name..."
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(v) =>
                  updateField("serviceType", v as VendorServiceType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Booking Status</Label>
              <Select
                value={formData.bookingStatus}
                onValueChange={(v) =>
                  updateField("bookingStatus", v as BookingStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_BOOKING_STATUSES.map((s) => {
                    const cfg = bookingStatusConfig[s];
                    return (
                      <SelectItem key={s} value={s}>
                        {cfg.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-email">Email</Label>
              <Input
                id="vendor-email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input
                id="vendor-phone"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-website">Website</Label>
              <Input
                id="vendor-website"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-quote">Quote / Price</Label>
              <Input
                id="vendor-quote"
                placeholder="$1,500"
                value={formData.quote}
                onChange={(e) => updateField("quote", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor-notes">Notes</Label>
            <Textarea
              id="vendor-notes"
              placeholder="Notes about this vendor..."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Linked tasks */}
          <div className="space-y-1.5">
            <Label>Linked Tasks</Label>
            <p className="text-xs text-muted-foreground">
              Select tasks related to this vendor
            </p>
            <ScrollArea className="h-[140px] rounded-md border p-2">
              <div className="space-y-1">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.linkedTaskIds.includes(task.id)}
                      onChange={() => toggleLinkedTask(task.id)}
                      className="rounded"
                    />
                    <span className="truncate flex-1">{task.title}</span>
                    {task.decoratorTopic && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700"
                      >
                        Decorator
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {mode === "add" ? "Add Vendor" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  vendor,
  open,
  onClose,
  onConfirm,
}: {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Vendor</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{vendor.name}&rdquo;? This
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

// ── Vendor Detail Dialog ────────────────────────────────────────────────────

function VendorDetailDialog({
  vendor,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
}) {
  const { tasks } = useTasks();

  if (!vendor) return null;

  const statusCfg = bookingStatusConfig[vendor.bookingStatus];
  const linkedTasks = tasks.filter((t) =>
    vendor.linkedTaskIds.includes(t.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{vendor.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{vendor.serviceType}</Badge>
            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
            {vendor.quote && (
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {vendor.quote}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {vendor.email && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm">{vendor.email}</p>
              </div>
            )}
            {vendor.phone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="text-sm">{vendor.phone}</p>
              </div>
            )}
            {vendor.website && (
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Website
                </p>
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {vendor.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {vendor.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Notes
                </p>
                <div className="text-sm bg-muted/50 rounded-md px-3 py-2 whitespace-pre-wrap">
                  {vendor.notes}
                </div>
              </div>
            </>
          )}

          {linkedTasks.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Linked Tasks ({linkedTasks.length})
                </p>
                <div className="space-y-1">
                  {linkedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm bg-muted/30 rounded px-2 py-1.5"
                    >
                      <span className="flex-1 truncate">{task.title}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onClose();
                onEdit(vendor);
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
                onDelete(vendor);
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

// ── Main VendorsView ─────────────────────────────────────────────────────────

export function VendorsView() {
  const { vendors, loading, error, addVendor, editVendor, deleteVendor } =
    useVendors();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<VendorServiceType[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const filteredVendors = useMemo(() => {
    let result = vendors;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.serviceType.toLowerCase().includes(q) ||
          v.notes.toLowerCase().includes(q)
      );
    }
    if (typeFilter.length > 0) {
      result = result.filter((v) => typeFilter.includes(v.serviceType));
    }
    if (statusFilter.length > 0) {
      result = result.filter((v) => statusFilter.includes(v.bookingStatus));
    }
    return result;
  }, [vendors, searchQuery, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = vendors.length;
    const booked = vendors.filter(
      (v) => v.bookingStatus === "booked" || v.bookingStatus === "paid"
    ).length;
    const pending = vendors.filter(
      (v) =>
        v.bookingStatus === "researching" ||
        v.bookingStatus === "contacted" ||
        v.bookingStatus === "quoted"
    ).length;
    return { total, booked, pending };
  }, [vendors]);

  const toggleTypeFilter = (val: VendorServiceType) => {
    setTypeFilter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const toggleStatusFilter = (val: BookingStatus) => {
    setStatusFilter((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleAddVendor = useCallback(
    (vendor: Vendor) => {
      addVendor(vendor);
    },
    [addVendor]
  );

  const handleEditVendor = useCallback(
    (vendor: Vendor) => {
      editVendor(vendor);
    },
    [editVendor]
  );

  const handleDeleteVendor = useCallback(() => {
    if (!vendorToDelete) return;
    deleteVendor(vendorToDelete.id);
    setVendorToDelete(null);
    setDeleteDialogOpen(false);
  }, [vendorToDelete, deleteVendor]);

  const openEditDialog = useCallback((vendor: Vendor) => {
    setVendorToEdit(vendor);
    setEditDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  }, []);

  const newVendor: Vendor = {
    id: generateVendorId(),
    ...getEmptyVendor(),
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-sm text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="max-w-lg w-full">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-800">
                  Error Loading Vendors
                </h3>
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
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-800 text-sm">Error</p>
              <pre className="mt-1 text-sm text-red-700 bg-red-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all select-all font-mono">
                {error}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            {stats.total} vendors &middot; {stats.booked} booked &middot;{" "}
            {stats.pending} pending
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Vendor
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Service
              {typeFilter.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] px-1.5 py-0"
                >
                  {typeFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Filter by Service</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_SERVICE_TYPES.map((t) => (
              <DropdownMenuCheckboxItem
                key={t}
                checked={typeFilter.includes(t)}
                onCheckedChange={() => toggleTypeFilter(t)}
              >
                {t}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
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
            {ALL_BOOKING_STATUSES.map((s) => {
              const cfg = bookingStatusConfig[s];
              return (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onCheckedChange={() => toggleStatusFilter(s)}
                >
                  {cfg.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters */}
      {(typeFilter.length > 0 || statusFilter.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {typeFilter.map((t) => (
            <Badge
              key={`type-${t}`}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleTypeFilter(t)}
            >
              {t} &times;
            </Badge>
          ))}
          {statusFilter.map((s) => {
            const cfg = bookingStatusConfig[s];
            return (
              <Badge
                key={`status-${s}`}
                variant="secondary"
                className={`gap-1 cursor-pointer ${cfg.color}`}
                onClick={() => toggleStatusFilter(s)}
              >
                {cfg.label} &times;
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => {
              setTypeFilter([]);
              setStatusFilter([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => {
          const statusCfg = bookingStatusConfig[vendor.bookingStatus];
          return (
            <Card
              key={vendor.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => setSelectedVendor(vendor)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {vendor.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {vendor.serviceType}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(vendor);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(vendor);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}>
                    {statusCfg.label}
                  </Badge>
                  {vendor.quote && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 gap-0.5"
                    >
                      <DollarSign className="h-2.5 w-2.5" />
                      {vendor.quote}
                    </Badge>
                  )}
                  {vendor.linkedTaskIds.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 gap-0.5"
                    >
                      {vendor.linkedTaskIds.length} task
                      {vendor.linkedTaskIds.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {(vendor.email || vendor.phone) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {vendor.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {vendor.phone}
                      </span>
                    )}
                    {vendor.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {vendor.email}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || typeFilter.length > 0 || statusFilter.length > 0
              ? "No vendors match your filters"
              : "No vendors yet. Add your first vendor to get started!"}
          </p>
        </div>
      )}

      {/* Dialogs */}
      <VendorDetailDialog
        vendor={selectedVendor}
        open={!!selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      <VendorFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddVendor}
        initialVendor={newVendor}
        mode="add"
      />

      {vendorToEdit && (
        <VendorFormDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setVendorToEdit(null);
          }}
          onSave={handleEditVendor}
          initialVendor={vendorToEdit}
          mode="edit"
        />
      )}

      <DeleteConfirmDialog
        vendor={vendorToDelete}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleDeleteVendor}
      />
    </div>
  );
}
