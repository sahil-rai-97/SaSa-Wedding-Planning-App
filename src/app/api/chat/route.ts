import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { listFiles, getFileContent } from "@/lib/driveService";

// ---------------------------------------------------------------------------
// Drive context cache (avoids re-fetching files on every chat message)
// ---------------------------------------------------------------------------

interface DriveCache {
  context: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let driveCache: DriveCache | null = null;

const MAX_CONTENT_PER_FILE = 8_000; // characters

async function getDriveContext(): Promise<string> {
  if (driveCache && Date.now() - driveCache.fetchedAt < CACHE_TTL_MS) {
    return driveCache.context;
  }

  try {
    const files = await listFiles();

    if (files.length === 0) {
      return "(No files found in the wedding Drive folder.)";
    }

    const fileEntries: string[] = [];

    for (const file of files) {
      try {
        let content = await getFileContent(file.id);
        if (content.startsWith("[Binary file")) {
          fileEntries.push(
            `- **${file.name}** (${file.mimeType}) — binary file, no text content available`
          );
          continue;
        }
        if (content.length > MAX_CONTENT_PER_FILE) {
          content = content.slice(0, MAX_CONTENT_PER_FILE) + "\n… (truncated)";
        }
        fileEntries.push(
          `### ${file.name}\nType: ${file.mimeType} | Modified: ${file.modifiedTime}\n\n${content}`
        );
      } catch {
        fileEntries.push(
          `- **${file.name}** (${file.mimeType}) — could not read content`
        );
      }
    }

    const context = fileEntries.join("\n\n---\n\n");
    driveCache = { context, fetchedAt: Date.now() };
    return context;
  } catch (error) {
    console.warn(
      "[api/chat] Could not fetch Drive files:",
      error instanceof Error ? error.message : error
    );
    return "(Google Drive is not configured or unavailable — no file context.)";
  }
}

// ---------------------------------------------------------------------------
// Task types (mirrors the client-side Task interface)
// ---------------------------------------------------------------------------

interface TaskData {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: string;
  owner: string;
  decoratorTopic: boolean;
  contextLog: string[];
}

function formatTasksContext(tasks: TaskData[]): string {
  if (!tasks || tasks.length === 0) {
    return "(No tasks found.)";
  }

  const statusGroups: Record<string, TaskData[]> = {};
  for (const task of tasks) {
    const status = task.status || "unknown";
    if (!statusGroups[status]) statusGroups[status] = [];
    statusGroups[status].push(task);
  }

  const statusLabels: Record<string, string> = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Done",
  };

  const sections: string[] = [];

  for (const [status, group] of Object.entries(statusGroups)) {
    const label = statusLabels[status] || status;
    const lines = group.map((t) => {
      let line = `- **${t.title}**`;
      line += ` [${t.category}]`;
      line += ` — Owner: ${t.owner}`;
      if (t.dueDate) line += ` | Due: ${t.dueDate}`;
      if (t.decoratorTopic) line += ` | 🎨 Decorator topic`;
      if (t.description) line += `\n  ${t.description}`;
      if (t.contextLog && t.contextLog.length > 0) {
        line += `\n  Notes: ${t.contextLog.join("; ")}`;
      }
      return line;
    });
    sections.push(`### ${label} (${group.length})\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  tasksContext: string,
  driveContext: string
): string {
  return `You are a helpful and friendly wedding planning AI assistant for Sahil & Saloni's wedding.

Key details:
- Wedding Date: April 26, 2026
- Venue: Old Mill Park Amphitheatre
- Events: Haldi, Mehendi, Ganesh Pooja + Wedding, Dinner / Hang, Night

You help with:
- Wedding planning questions and advice
- Task management suggestions
- Vendor coordination tips
- Timeline and schedule guidance
- Budget considerations
- Guest management

You have FULL access to the wedding task list and Google Drive files below. When asked about tasks, status, deadlines, owners, or progress, always answer using the ACTUAL task data provided — never guess or make up tasks.

Keep responses concise, warm, and practical. Use bold text (**like this**) for emphasis on key points.

---

## Wedding Tasks

Below is the current state of ALL wedding planning tasks, grouped by status. This is the live task data from the app.

${tasksContext}

---

## Google Drive Files

Below are the files from the wedding planning Google Drive folder. Use this information to answer questions about vendors, guests, budget, and other details in these documents.

${driveContext}`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = body.messages as {
      role: "user" | "assistant";
      content: string;
    }[];
    const tasks = (body.tasks ?? []) as TaskData[];

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build context from tasks and Drive files
    const tasksContext = formatTasksContext(tasks);
    const driveContext = await getDriveContext();
    const systemPrompt = buildSystemPrompt(tasksContext, driveContext);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert chat history to Gemini format
    const geminiHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood! I have access to all the wedding planning tasks and Google Drive files. I can see every task's status, owner, deadline, and category. How can I assist you?",
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ content: response });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate response";
    console.error("[api/chat] Error:", message);

    const status =
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid")
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
