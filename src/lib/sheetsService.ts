/**
 * Google Sheets Service for Wedding RSVPs
 *
 * Server-side only — uses the same Google Service Account as the Drive service.
 * Reads and writes to a "Wedding RSVPs" Google Sheet that must be created
 * by the user (not the service account, which has no Drive storage quota).
 *
 * Setup:
 *   1. Create a Google Sheet named "Wedding RSVPs" inside your wedding Drive folder
 *   2. Add these column headers in row 1:
 *      Timestamp | Group ID | Full Name | Email | Phone | Attending | Events |
 *      Bus Transportation | Dietary Restrictions | Message | Song Requests |
 *      Is Additional Guest | Primary Guest Name
 *   3. The service account already has access via the shared folder
 *
 * Alternatively, set the GOOGLE_RSVP_SHEET_ID env var to the spreadsheet ID
 * to skip the auto-discovery step.
 *
 * Reading uses Drive API CSV export. Writing tries the Sheets API first,
 * then falls back to Drive API CSV re-upload if the Sheets API is not enabled.
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
// Sheet discovery
// ---------------------------------------------------------------------------

const SHEET_NAME = "Wedding RSVPs";
const HEADERS = [
  "Timestamp",
  "Group ID",
  "Full Name",
  "Email",
  "Phone",
  "Attending",
  "Events",
  "Bus Transportation",
  "Dietary Restrictions",
  "Message",
  "Song Requests",
  "Is Additional Guest",
  "Primary Guest Name",
];

let cachedSheetId: string | null = null;

/**
 * Find the "Wedding RSVPs" spreadsheet. Does NOT auto-create it
 * (the service account has no Drive storage quota).
 *
 * Resolution order:
 *   1. GOOGLE_RSVP_SHEET_ID env var (explicit override)
 *   2. Search the configured Drive folder for a sheet named "Wedding RSVPs"
 *
 * Throws with a helpful setup message if the sheet cannot be found.
 */
async function findSheet(): Promise<string> {
  if (cachedSheetId) return cachedSheetId;

  // 1. Explicit env var override
  const envId = process.env.GOOGLE_RSVP_SHEET_ID;
  if (envId) {
    cachedSheetId = envId;
    return cachedSheetId;
  }

  // 2. Search the Drive folder by name
  const drive = getDrive();
  const folderId = getFolderId();

  const searchRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet' and name = '${SHEET_NAME}'`,
    fields: "files(id, name)",
    pageSize: 5,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existing = searchRes.data.files?.[0];
  if (existing?.id) {
    cachedSheetId = existing.id;
    return cachedSheetId;
  }

  // Not found — throw with setup instructions
  throw new Error(
    `RSVP sheet not found. Please create a Google Sheet named "${SHEET_NAME}" ` +
      `in your wedding Drive folder with these column headers in row 1:\n` +
      HEADERS.join(" | ") +
      `\n\nAlternatively, set the GOOGLE_RSVP_SHEET_ID environment variable ` +
      `to an existing spreadsheet ID.`
  );
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
  groupId: string;
  fullName: string;
  email: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  events: string[];
  busTransportation: string;
  dietaryRestrictions: string;
  message: string;
  songRequests: string;
  isAdditionalGuest: boolean;
  primaryGuestName: string;
}

export interface RsvpSubmission {
  groupId: string;
  fullName: string;
  email: string;
  phone: string;
  attending: "yes" | "no" | "maybe";
  events: string[];
  busTransportation: string;
  dietaryRestrictions: string;
  message: string;
  songRequests: string;
  isAdditionalGuest: boolean;
  primaryGuestName: string;
}

// ---------------------------------------------------------------------------
// Read — Drive API CSV export (no Sheets API needed)
// ---------------------------------------------------------------------------

/**
 * Read all RSVP entries from the Google Sheet.
 * Uses Drive API export-as-CSV so it works without the Sheets API.
 */
export async function readRsvps(): Promise<RsvpEntry[]> {
  const sheetId = await findSheet();
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
      groupId: row[1] ?? "",
      fullName: row[2] ?? "",
      email: row[3] ?? "",
      phone: row[4] ?? "",
      attending: (row[5]?.toLowerCase() as "yes" | "no" | "maybe") || "maybe",
      events: row[6] ? row[6].split(", ").filter(Boolean) : [],
      busTransportation: row[7] ?? "",
      dietaryRestrictions: row[8] ?? "",
      message: row[9] ?? "",
      songRequests: row[10] ?? "",
      isAdditionalGuest: (row[11] ?? "").toLowerCase() === "true",
      primaryGuestName: row[12] ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Write — Sheets API with Drive API fallback
// ---------------------------------------------------------------------------

function buildRowValues(data: RsvpSubmission, timestamp: string): string[] {
  return [
    timestamp,
    data.groupId,
    data.fullName,
    data.email,
    data.phone,
    data.attending,
    data.events.join(", "),
    data.busTransportation,
    data.dietaryRestrictions,
    data.message,
    data.songRequests ?? "",
    data.isAdditionalGuest ? "TRUE" : "FALSE",
    data.primaryGuestName,
  ];
}

/**
 * Try to append via the Sheets API (fast, atomic, preserves formatting).
 * Returns true on success, false if the Sheets API is unavailable.
 */
async function appendViaSheetsApi(
  sheetId: string,
  valuesMatrix: string[][]
): Promise<boolean> {
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: valuesMatrix },
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
      msg.includes("forbidden") ||
      msg.includes("storage quota")
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
 * Fallback: append rows by exporting CSV via Drive API, adding the rows,
 * and re-uploading. Works without the Sheets API.
 */
async function appendViaDriveCsv(
  sheetId: string,
  valuesMatrix: string[][]
): Promise<void> {
  const drive = getDrive();

  // Export current content as CSV
  const exportRes = await drive.files.export({
    fileId: sheetId,
    mimeType: "text/csv",
  });

  const currentCsv = String(exportRes.data ?? "");
  const newRows = valuesMatrix.map(row => row.map(escapeCsvField).join(",")).join("\n");

  // Append new rows
  const updatedCsv = currentCsv.trimEnd() + "\n" + newRows + "\n";

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
 * Append new RSVP entries to the Google Sheet.
 * Tries the Sheets API first (fast), falls back to Drive CSV if unavailable.
 */
export async function appendRsvps(submissions: RsvpSubmission[]): Promise<void> {
  if (submissions.length === 0) return;
  const sheetId = await findSheet();
  const timestamp = new Date().toISOString();
  const valuesMatrix = submissions.map(sub => buildRowValues(sub, timestamp));

  // Try Sheets API first
  const success = await appendViaSheetsApi(sheetId, valuesMatrix);
  if (success) return;

  // Fallback to Drive CSV approach
  await appendViaDriveCsv(sheetId, valuesMatrix);
}

/**
 * Update an existing RSVP row in the Google Sheet.
 */
export async function updateRsvpRow(
  rowIndex: number,
  data: RsvpSubmission
): Promise<void> {
  const sheetId = await findSheet();
  const timestamp = new Date().toISOString();
  const values = buildRowValues(data, timestamp);

  // Try Sheets API first
  try {
    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A${rowIndex}:M${rowIndex}`,
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
