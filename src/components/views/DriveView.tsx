"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockDriveFiles } from "@/lib/mockData";
import type { DriveFile } from "@/lib/mockData";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Search,
  ExternalLink,
  LayoutGrid,
  List,
  FolderOpen,
  HardDrive,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  AlertCircle,
  Cloud,
  CloudOff,
} from "lucide-react";
import { format, parseISO } from "date-fns";

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf") || mimeType.includes("google-apps.document"))
    return <FileText className="h-8 w-8 text-red-500" />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("google-apps.spreadsheet")
  )
    return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (mimeType.includes("image"))
    return <FileImage className="h-8 w-8 text-purple-500" />;
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("google-apps.document")
  )
    return <FileText className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes("google-apps.folder"))
    return <FolderOpen className="h-8 w-8 text-amber-500" />;
  return <File className="h-8 w-8 text-gray-400" />;
}

function getFileIconSmall(mimeType: string) {
  if (mimeType.includes("pdf") || mimeType.includes("google-apps.document"))
    return <FileText className="h-4 w-4 text-red-500" />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("google-apps.spreadsheet")
  )
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (mimeType.includes("image"))
    return <FileImage className="h-4 w-4 text-purple-500" />;
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("google-apps.document")
  )
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes("google-apps.folder"))
    return <FolderOpen className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-gray-400" />;
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes("google-apps.document")) return "Google Doc";
  if (mimeType.includes("google-apps.spreadsheet")) return "Google Sheet";
  if (mimeType.includes("google-apps.presentation")) return "Google Slides";
  if (mimeType.includes("google-apps.folder")) return "Folder";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet";
  if (mimeType.includes("image/jpeg")) return "JPEG Image";
  if (mimeType.includes("image/png")) return "PNG Image";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("document") || mimeType.includes("word"))
    return "Document";
  return "File";
}

type SortKey = "name" | "modified" | "size";

export function DriveView() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("modified");

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drive/files");
      const data = await res.json();
      if (res.ok && data.files && data.files.length > 0) {
        setFiles(data.files);
        setIsLive(true);
      } else if (data.error) {
        // API returned an error — fall back to mock data
        console.warn("Drive API error, using mock data:", data.error);
        setFiles(mockDriveFiles);
        setIsLive(false);
        setError(data.error);
      } else {
        // API returned empty — could be a real empty folder or an issue
        setFiles(data.files ?? []);
        setIsLive(true);
      }
    } catch {
      // Network/fetch error — fall back to mock data
      console.warn("Failed to reach Drive API, using mock data");
      setFiles(mockDriveFiles);
      setIsLive(false);
      setError("Could not connect to Google Drive API");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "modified":
          return (
            new Date(b.modifiedTime).getTime() -
            new Date(a.modifiedTime).getTime()
          );
        case "size":
          return parseFloat(b.size) - parseFloat(a.size);
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, sortBy]);

  const cycleSortBy = () => {
    const order: SortKey[] = ["modified", "name", "size"];
    const idx = order.indexOf(sortBy);
    setSortBy(order[(idx + 1) % order.length]);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drive</h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" />
            Wedding App Folder
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <Badge variant="secondary" className="gap-1.5 bg-green-50 text-green-700 border-green-200">
              <Cloud className="h-3.5 w-3.5" />
              Live from Google Drive
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5 bg-amber-50 text-amber-700 border-amber-200">
              <CloudOff className="h-3.5 w-3.5" />
              Mock Data
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            {files.length} files
          </Badge>
        </div>
      </div>

      {/* Error banner */}
      {error && !isLive && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">
            Google Drive not connected — showing sample data. To connect, add
            your Google Service Account credentials to the environment variables.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-shrink-0"
            onClick={fetchFiles}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={cycleSortBy}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "modified"
            ? "Modified"
            : sortBy === "name"
            ? "Name"
            : "Size"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={fetchFiles}
          disabled={isLoading}
          title="Refresh files"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading files from Google Drive...</p>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="group hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                if (file.webViewLink && file.webViewLink !== "#") {
                  window.open(file.webViewLink, "_blank");
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="w-full min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {getFileTypeLabel(file.mimeType)}
                      </Badge>
                      {file.size && file.size !== "0 B" && (
                        <span className="text-[10px] text-muted-foreground">
                          {file.size}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(parseISO(file.modifiedTime), "MMM d, yyyy")}
                    </p>
                  </div>
                  {file.webViewLink && file.webViewLink !== "#" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Drive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === "list" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground gap-4 px-2">
              <div className="col-span-1" />
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-12 gap-4 px-2 py-2.5 rounded-md hover:bg-muted/50 transition-colors items-center group cursor-pointer"
                onClick={() => {
                  if (file.webViewLink && file.webViewLink !== "#") {
                    window.open(file.webViewLink, "_blank");
                  }
                }}
              >
                <div className="col-span-1 flex justify-center">
                  {getFileIconSmall(file.mimeType)}
                </div>
                <div className="col-span-5">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                </div>
                <div className="col-span-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {getFileTypeLabel(file.mimeType)}
                  </Badge>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {format(parseISO(file.modifiedTime), "MMM d, yyyy")}
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">
                  {file.size && file.size !== "0 B" ? file.size : "—"}
                </div>
                <div className="col-span-1 flex justify-end">
                  {file.webViewLink && file.webViewLink !== "#" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? "No files match your search" : "No files in the folder"}
          </p>
        </div>
      )}
    </div>
  );
}
