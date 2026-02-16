/**
 * Google Sheets Service for Wedding RSVPs
 *
 * Server-side only — uses the same Google Service Account as the Drive service.
 * Manages a "Wedding RSVPs" spreadsheet inside the configured Drive folder.
 *
 * This implementation uses two strategies:
 *  1. PRIMARY: Google Sheets API for reading/writing cell values (fast, atomic)
 *  2. FALLBACK: Google Drive API only — export CSV, modify, re-upload
 *     (used when the Sheets API is not enabled in the Cloud project)
 *
 * The spreadsheet is always CREATED via the Drive API to avoid requiring
 * the Sheets API just for initial setup.
 */

import { google } from "googleapis";
import { Readable } from "stream";

// ---------------------------------------------------------------------------
// Auth — reuses the same service account as driveService
// ---------------------------------------------------------------------------

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Missing Google service account credentials. " +
        "Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY."
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID env variable.");
  return id;
}

// ---------------------------------------------------------------------------
// Sheet management — creation uses Drive API only
// ---------------------------------------------------------------------------

const SHEET_NAME = "Wedding RSVPs";
const HEADERS = [
  "Timestamp",
  "Full Name",
  "Email",
  "Phone",
  "Attending",
  "Events",
  "Number of Guests",
  "Dietary Restrictions",
  "Plus One Name",
  "Plus One Dietary",
  "Message",
];

let cachedSheetId: string | null = null;

/**
 * Find or create the "Wedding RSVPs" spreadsheet in the Drive folder.
 * Creation uses the Drive API (upload CSV → auto-convert to Google Sheet)
 * so it works even when the Sheets API is not enabled.
 */
async function getOrCreateSheet(): Promise<string> {
  if (cachedSheetId) return cachedSheetId;

  const drive = getDrive();
  const folderId = getFolderId();

  // Search for existing spreadsheet in the folder
  const searchRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet' and name = '${SHEET_NAME}'`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  const existing = searchRes.data.files?.[0];
  if (existing?.id) {
    cachedSheetId = existing.id;
    return cachedSheetId;
  }

  // Create new spreadsheet using Drive API (CSV upload → Google Sheet conversion).
  // This avoids the Sheets API entirely for creation.
  const headerCsv = HEADERS.join(",") + "\n";

  const createRes = await drive.files.create({
    requestBody: {
      name: SHEET_NAME,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId],
    },
    media: {
      mimeType: "text/csv",
      body: Readable.from(Buffer.from(headerCsv)),
    },
    fields: "id",
  });

  const newId = createRes.data.id;
  if (!newId) throw new Error("Failed to create RSVP spreadsheet — no ID returned.");

  cachedSheetId = newId;
  return newId;
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface RsvpEntry {
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

export interface RsvpSubmission {
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

// ---------------------------------------------------------------------------
// Read — Drive API CSV export (no Sheets API needed)
// ---------------------------------------------------------------------------

/**
 * Read all RSVP entries from the Google Sheet.
 * Uses Drive API export-as-CSV so it works without the Sheets API.
 */
export async function readRsvps(): Promise<RsvpEntry[]> {
  const sheetId = await getOrCreateSheet();
  const drive = getDrive();

  const res = await drive.files.export({
    fileId: sheetId,
    mimeType: "text/csv",
  });

  const csvContent = String(res.data ?? "");
  if (!csvContent.trim()) return [];

  const lines = csvContent.split("\n").filter((line) => line.trim());

  // Skip header row
  const dataRows = lines.slice(1);

  return dataRows.map((line, idx) => {
    const row = parseCsvRow(line);
    return {
      row: idx + 2,
      timestamp: row[0] ?? "",
      fullName: row[1] ?? "",
      email: row[2] ?? "",
      phone: row[3] ?? "",
      attending: (row[4]?.toLowerCase() as "yes" | "no" | "maybe") || "maybe",
      events: row[5] ? row[5].split(", ").filter(Boolean) : [],
      numberOfGuests: parseInt(row[6] ?? "1", 10) || 1,
      dietaryRestrictions: row[7] ?? "",
      plusOneName: row[8] ?? "",
      plusOneDietary: row[9] ?? "",
      message: row[10] ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Write — Sheets API with Drive API fallback
// ---------------------------------------------------------------------------

function buildRowValues(data: RsvpSubmission): string[] {
  return [
    new Date().toISOString(),
    data.fullName,
    data.email,
    data.phone,
    data.attending,
    data.events.join(", "),
    data.numberOfGuests.toString(),
    data.dietaryRestrictions,
    data.plusOneName,
    data.plusOneDietary,
    data.message,
  ];
}

/**
 * Try to append via the Sheets API (fast, atomic, preserves formatting).
 * Returns true on success, false if the Sheets API is unavailable.
 */
async function appendViaSheetsApi(
  sheetId: string,
  values: string[]
): Promise<boolean> {
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // If the error is about permissions / API not enabled, return false so
    // the caller can fall back to the Drive API approach.
    if (
      msg.includes("not have permission") ||
      msg.includes("has not been used") ||
      msg.includes("is disabled") ||
      msg.includes("PERMISSION_DENIED") ||
      msg.includes("forbidden")
    ) {
      console.warn(
        "[sheetsService] Sheets API unavailable, falling back to Drive CSV:",
        msg
      );
      return false;
    }

    // For other errors (e.g. network), re-throw
    throw err;
  }
}

/**
 * Fallback: append a row by exporting CSV via Drive API, adding the row,
 * and re-uploading. Works without the Sheets API.
 */
async function appendViaDriveCsv(
  sheetId: string,
  values: string[]
): Promise<void> {
  const drive = getDrive();

  // Export current content as CSV
  const exportRes = await drive.files.export({
    fileId: sheetId,
    mimeType: "text/csv",
  });

  const currentCsv = String(exportRes.data ?? "");
  const newRow = values.map(escapeCsvField).join(",");

  // Append new row
  const updatedCsv = currentCsv.trimEnd() + "\n" + newRow + "\n";

  // Re-upload the CSV content (Drive converts it back to Sheet format)
  await drive.files.update({
    fileId: sheetId,
    media: {
      mimeType: "text/csv",
      body: Readable.from(Buffer.from(updatedCsv)),
    },
  });
}

/**
 * Append a new RSVP entry to the Google Sheet.
 * Tries the Sheets API first (fast), falls back to Drive CSV if unavailable.
 */
export async function appendRsvp(data: RsvpSubmission): Promise<void> {
  const sheetId = await getOrCreateSheet();
  const values = buildRowValues(data);

  // Try Sheets API first
  const success = await appendViaSheetsApi(sheetId, values);
  if (success) return;

  // Fallback to Drive CSV approach
  await appendViaDriveCsv(sheetId, values);
}

/**
 * Update an existing RSVP row in the Google Sheet.
 */
export async function updateRsvpRow(
  rowIndex: number,
  data: RsvpSubmission
): Promise<void> {
  const sheetId = await getOrCreateSheet();
  const values = buildRowValues(data);

  // Try Sheets API first
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A${rowIndex}:K${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return;
  } catch {
    // Fall through to Drive CSV approach
  }

  // Fallback: full CSV rewrite
  const drive = getDrive();
  const exportRes = await drive.files.export({
    fileId: sheetId,
    mimeType: "text/csv",
  });

  const currentCsv = String(exportRes.data ?? "");
  const lines = currentCsv.split("\n");

  // rowIndex is 1-based (row 1 = header), so lines index = rowIndex - 1
  const lineIdx = rowIndex - 1;
  if (lineIdx >= 0 && lineIdx < lines.length) {
    lines[lineIdx] = values.map(escapeCsvField).join(",");
  }

  const updatedCsv = lines.join("\n");

  await drive.files.update({
    fileId: sheetId,
    media: {
      mimeType: "text/csv",
      body: Readable.from(Buffer.from(updatedCsv)),
    },
  });
}
