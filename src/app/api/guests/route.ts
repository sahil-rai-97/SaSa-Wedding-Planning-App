import { NextResponse } from "next/server";
import { readRsvps } from "@/lib/sheetsService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guests = await readRsvps();
    return NextResponse.json({ guests });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch guests";
    console.error("[api/guests] Error:", message);

    let userMessage = message;
    if (message.includes("RSVP sheet not found")) {
      userMessage =
        'No "Wedding RSVPs" spreadsheet found in your Drive folder. ' +
        "Create a Google Sheet with that name and add these column headers in row 1: " +
        "Timestamp, Full Name, Email, Phone, Attending, Events, " +
        "Number of Guests, Dietary Restrictions, Plus One Name, " +
        "Plus One Dietary, Message. " +
        "Or set the GOOGLE_RSVP_SHEET_ID env var to an existing sheet ID.";
    } else if (
      message.includes("not have permission") ||
      message.includes("PERMISSION_DENIED")
    ) {
      userMessage =
        "Google Drive permission error. Make sure the Drive folder is shared " +
        "with the service account email as an Editor (not just Viewer).";
    } else if (message.includes("Missing Google")) {
      userMessage =
        "Google service account credentials are not configured. " +
        "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, " +
        "and GOOGLE_DRIVE_FOLDER_ID in your environment variables.";
    }

    return NextResponse.json(
      { guests: [], error: userMessage },
      { status: 502 }
    );
  }
}
