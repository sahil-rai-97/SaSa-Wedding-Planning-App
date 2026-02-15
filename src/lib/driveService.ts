/**
 * Google Drive API Service Utility
 *
 * Server-side only — uses a Google Service Account to access a
 * designated "Wedding App" folder in Google Drive.
 *
 * Environment variables required:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – service account email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – private key (PEM, with \n line breaks)
 *   GOOGLE_DRIVE_FOLDER_ID        – ID of the "Wedding App" folder
 */

import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!email || !key || !folderId) {
    throw new Error(
      "Missing Google Drive environment variables. " +
        "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, and GOOGLE_DRIVE_FOLDER_ID."
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDrive(): drive_v3.Drive {
  return google.drive({ version: "v3", auth: getAuth() });
}

function getFolderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID!;
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  iconLink: string;
  webViewLink: string;
  thumbnailLink?: string;
}

/**
 * List all files inside the designated "Wedding App" folder.
 */
export async function listFiles(): Promise<DriveFileMetadata[]> {
  const drive = getDrive();
  const folderId = getFolderId();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields:
      "files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink)",
    orderBy: "modifiedTime desc",
    pageSize: 100,
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: formatFileSize(Number(f.size ?? 0)),
    iconLink: f.iconLink ?? "",
    webViewLink: f.webViewLink ?? "#",
    thumbnailLink: f.thumbnailLink ?? undefined,
  }));
}

/**
 * Get metadata for a single file by ID.
 */
export async function getFile(fileId: string): Promise<DriveFileMetadata> {
  const drive = getDrive();

  const res = await drive.files.get({
    fileId,
    fields:
      "id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink",
  });

  const f = res.data;
  return {
    id: f.id ?? "",
    name: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: formatFileSize(Number(f.size ?? 0)),
    iconLink: f.iconLink ?? "",
    webViewLink: f.webViewLink ?? "#",
    thumbnailLink: f.thumbnailLink ?? undefined,
  };
}

/**
 * Download a file's content as text (useful for context in AI prompts).
 * Works with Google Docs, Sheets (exported as plain text), and plain text files.
 */
export async function getFileContent(fileId: string): Promise<string> {
  const drive = getDrive();

  // First check the file type
  const meta = await drive.files.get({
    fileId,
    fields: "mimeType",
  });

  const mimeType = meta.data.mimeType ?? "";

  // For Google Docs, export as plain text
  if (mimeType === "application/vnd.google-apps.document") {
    const res = await drive.files.export({
      fileId,
      mimeType: "text/plain",
    });
    return String(res.data);
  }

  // For Google Sheets, export as CSV
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const res = await drive.files.export({
      fileId,
      mimeType: "text/csv",
    });
    return String(res.data);
  }

  // For Google Slides, export as plain text
  if (mimeType === "application/vnd.google-apps.presentation") {
    const res = await drive.files.export({
      fileId,
      mimeType: "text/plain",
    });
    return String(res.data);
  }

  // For regular text-based files, download directly
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  ) {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" }
    );
    return String(res.data);
  }

  return `[Binary file — cannot extract text content for mimeType: ${mimeType}]`;
}

/**
 * Upload a file to the Wedding App folder.
 */
export async function uploadFile(
  name: string,
  mimeType: string,
  body: NodeJS.ReadableStream | Buffer | string
): Promise<DriveFileMetadata> {
  const drive = getDrive();
  const folderId = getFolderId();
  const readable =
    typeof body === "string" || Buffer.isBuffer(body)
      ? Readable.from(typeof body === "string" ? Buffer.from(body) : body)
      : body;

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields:
      "id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink",
  });

  const f = res.data;
  return {
    id: f.id ?? "",
    name: f.name ?? name,
    mimeType: f.mimeType ?? mimeType,
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: formatFileSize(Number(f.size ?? 0)),
    iconLink: f.iconLink ?? "",
    webViewLink: f.webViewLink ?? "#",
    thumbnailLink: f.thumbnailLink ?? undefined,
  };
}

/**
 * Delete a file from Drive.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({ fileId });
}

/**
 * Search for files by name within the Wedding App folder.
 */
export async function searchFiles(
  query: string
): Promise<DriveFileMetadata[]> {
  const drive = getDrive();
  const folderId = getFolderId();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and name contains '${query.replace(/'/g, "\\'")}'`,
    fields:
      "files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink)",
    orderBy: "modifiedTime desc",
    pageSize: 50,
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
    size: formatFileSize(Number(f.size ?? 0)),
    iconLink: f.iconLink ?? "",
    webViewLink: f.webViewLink ?? "#",
    thumbnailLink: f.thumbnailLink ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
