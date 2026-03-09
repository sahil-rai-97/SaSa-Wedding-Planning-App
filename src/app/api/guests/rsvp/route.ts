import { NextRequest, NextResponse } from "next/server";
import { appendRsvps, type RsvpSubmission } from "@/lib/sheetsService";

const ACCESS_CODE = "S&S_2026";

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

    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 }
      );
    }

    const groupId = crypto.randomUUID();
    const submissions: RsvpSubmission[] = [];

    // Primary guest submission
    submissions.push({
      groupId,
      fullName: body.fullName.trim(),
      email: body.email?.trim() ?? "",
      phone: body.phone.trim(),
      attending: body.attending,
      events: Array.isArray(body.events) ? body.events : [],
      busTransportation: body.busTransportation ?? "",
      dietaryRestrictions: body.dietaryRestrictions?.trim() ?? "",
      message: body.message?.trim() ?? "",
      songRequests: body.songRequests?.trim() ?? "",
      isAdditionalGuest: false,
      primaryGuestName: body.fullName.trim(),
    });

    // Additional guests submissions
    if (Array.isArray(body.additionalGuests)) {
      for (const guest of body.additionalGuests) {
        if (!guest.fullName?.trim()) continue; // Skip empty guest names
        if (!guest.phone?.trim()) {
          return NextResponse.json(
            { error: "WhatsApp number is required for each guest" },
            { status: 400 }
          );
        }

        submissions.push({
          groupId,
          fullName: guest.fullName.trim(),
          email: guest.email?.trim() ?? "",
          phone: guest.phone.trim(),
          attending: body.attending, // Apply primary guest's attending status
          events: Array.isArray(body.events) ? body.events : [], // Apply primary guest's events
          busTransportation: body.busTransportation ?? "", // Apply primary guest's bus transportation preference
          dietaryRestrictions: guest.dietaryRestrictions?.trim() ?? "",
          message: "", // Messages are attached to the primary guest
          songRequests: "", // Song requests are attached to the primary guest
          isAdditionalGuest: true,
          primaryGuestName: body.fullName.trim(),
        });
      }
    }

    await appendRsvps(submissions);

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
