import { NextRequest, NextResponse } from "next/server";
import { appendRsvp, type RsvpSubmission } from "@/lib/sheetsService";

const ACCESS_CODE = "SaSa Wedding";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate access code
    if (body.accessCode !== ACCESS_CODE) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.fullName?.trim()) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!body.attending) {
      return NextResponse.json(
        { error: "Please indicate whether you are attending" },
        { status: 400 }
      );
    }

    const submission: RsvpSubmission = {
      fullName: body.fullName.trim(),
      email: body.email?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      attending: body.attending,
      events: Array.isArray(body.events) ? body.events : [],
      numberOfGuests: parseInt(body.numberOfGuests ?? "1", 10) || 1,
      dietaryRestrictions: body.dietaryRestrictions?.trim() ?? "",
      plusOneName: body.plusOneName?.trim() ?? "",
      plusOneDietary: body.plusOneDietary?.trim() ?? "",
      message: body.message?.trim() ?? "",
    };

    await appendRsvp(submission);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit RSVP";
    console.error("[api/guests/rsvp] Error:", message);

    // Provide actionable guidance for common Google API errors
    let userMessage = message;
    if (
      message.includes("not have permission") ||
      message.includes("PERMISSION_DENIED")
    ) {
      userMessage =
        "Google Drive permission error. Make sure the Drive folder is shared " +
        "with the service account email as an Editor (not just Viewer).";
    } else if (
      message.includes("has not been used") ||
      message.includes("is disabled")
    ) {
      userMessage =
        "A required Google API is not enabled. Enable the Google Drive API " +
        "and (optionally) the Google Sheets API in your Google Cloud Console.";
    } else if (message.includes("Missing Google")) {
      userMessage =
        "Google service account credentials are not configured. " +
        "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY, " +
        "and GOOGLE_DRIVE_FOLDER_ID in your environment variables.";
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
