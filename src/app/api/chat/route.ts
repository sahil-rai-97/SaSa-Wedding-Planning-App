import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a helpful and friendly wedding planning AI assistant for Sahil & Saloni's wedding.

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

Keep responses concise, warm, and practical. Use bold text (**like this**) for emphasis on key points.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const { messages } = (await request.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert chat history to Gemini format
    const geminiHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood! I'm ready to help with Sahil & Saloni's wedding planning. How can I assist you?",
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

    // Provide a clear status code so the client can differentiate errors
    const status =
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid")
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
