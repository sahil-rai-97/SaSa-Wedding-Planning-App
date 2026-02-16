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
    return NextResponse.json({ guests: [], error: message }, { status: 502 });
  }
}
