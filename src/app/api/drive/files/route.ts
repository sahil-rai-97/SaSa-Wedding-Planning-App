import { NextResponse } from "next/server";
import { listFiles } from "@/lib/driveService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const files = await listFiles();
    return NextResponse.json({ files });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Drive files";

    console.error("[api/drive/files] Error:", message);

    // Return a clear status so the client can fall back to mock data
    return NextResponse.json(
      { files: [], error: message },
      { status: 502 }
    );
  }
}
