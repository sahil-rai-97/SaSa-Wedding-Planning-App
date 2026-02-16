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

    const userMessage = humanizeError(message);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

function humanizeError(msg: string): string {
  if (msg.includes("RSVP sheet not found")) {
    return (
      "The RSVP system is being set up. " +
      "Please try again shortly, or contact the couple directly."
    );
  }
  if (msg.includes("storage quota")) {
    return (
      "Google Drive storage issue. " +
      "Please contact the couple to let them know."
    );
  }
  if (
    msg.includes("not have permission") ||
    msg.includes("PERMISSION_DENIED")
  ) {
    return (
      "Google Drive permission issue. " +
      "Please contact the couple to let them know."
    );
  }
  if (msg.includes("Missing Google")) {
    return (
      "The RSVP system is not configured yet. " +
      "Please contact the couple directly."
    );
  }
  return "Something went wrong submitting your RSVP. Please try again.";
}
