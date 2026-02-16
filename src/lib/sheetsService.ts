/**
 * Google Sheets Service for Wedding RSVPs
 *
 * Server-side only — uses the same Google Service Account as the Drive service.
 * Manages a "Wedding RSVPs" spreadsheet inside the configured Drive folder.
 *
 * The sheet is auto-created with headers if it doesn't already exist.
 */

import { google, sheets_v4 } from "googleapis";

// ---------------------------------------------------------------------------
// Auth
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
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

function getFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID env variable.");
  return id;
}

// ---------------------------------------------------------------------------
// Sheet management
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
 * Returns the spreadsheet ID.
 */
async function getOrCreateSheet(): Promise<string> {
  if (cachedSheetId) return cachedSheetId;

  const drive = getDrive();
  const folderId = getFolderId();

  // Search for existing spreadsheet
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

  // Create new spreadsheet
  const sheets = getSheets();
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SHEET_NAME },
      sheets: [
        {
          properties: { title: "RSVPs" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: { textFormat: { bold: true } },
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const newId = createRes.data.spreadsheetId!;

  // Move the sheet into the Wedding folder
  await drive.files.update({
    fileId: newId,
    addParents: folderId,
    removeParents: "root",
    fields: "id, parents",
  });

  cachedSheetId = newId;
  return newId;
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
// Read / Write
// ---------------------------------------------------------------------------

/**
 * Read all RSVP entries from the Google Sheet.
 */
export async function readRsvps(): Promise<RsvpEntry[]> {
  const sheetId = await getOrCreateSheet();
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "RSVPs!A2:K",
  });

  const rows = res.data.values ?? [];

  return rows.map((row, idx) => ({
    row: idx + 2, // 1-indexed, skip header
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
  }));
}

/**
 * Append a new RSVP entry to the Google Sheet.
 */
export async function appendRsvp(data: RsvpSubmission): Promise<void> {
  const sheetId = await getOrCreateSheet();
  const sheets = getSheets();

  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "RSVPs!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,
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
        ],
      ],
    },
  });
}

/**
 * Update an existing RSVP row in the Google Sheet.
 */
export async function updateRsvpRow(
  rowIndex: number,
  data: RsvpSubmission
): Promise<void> {
  const sheetId = await getOrCreateSheet();
  const sheets = getSheets();

  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `RSVPs!A${rowIndex}:K${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,
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
        ],
      ],
    },
  });
}
