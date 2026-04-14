import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/app/lib/ai";
import { supabase } from "@/app/lib/db";

/* ── OPTIONS handler (CORS preflight) ── */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    },
  });
}

/* ── POST /api/chat ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, history } = body as {
      message: string;
      sessionId?: string;
      history?: { role: "user" | "bot"; content: string }[];
    };

    /* Validate message */
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    /* Get AI response */
    const reply = await getAIResponse(message.trim(), history || []);

    /* Persist to Supabase */
    if (sessionId && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      try {
        await persistMessages(sessionId, message.trim(), reply);
      } catch (err) {
        console.error("[Chat API] Failed to persist messages:", err);
      }
    }

    return NextResponse.json(
      { reply, sessionId: sessionId || "" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    return NextResponse.json(
      {
        reply: "Something went wrong on our end. Please DM us on Instagram @100xsolutions.in — we reply fast! ⚡",
        error: "Internal server error",
      },
      { status: 200 }
    );
  }
}

/* ── Helper: persist messages to Supabase ── */
async function persistMessages(
  sessionId: string,
  userMessage: string,
  botReply: string
) {
  const now = new Date();

  /* Upsert session */
  const { error: sessionError } = await supabase
    .from("sessions")
    .upsert({ session_id: sessionId, updated_at: now.toISOString() }, { onConflict: "session_id" });

  if (sessionError) {
    console.error("[Chat API] Session upsert error:", sessionError);
    return;
  }

  /* Insert both messages */
  const { error: messagesError } = await supabase.from("messages").insert([
    {
      session_id: sessionId,
      role: "user",
      content: userMessage,
      timestamp: now.toISOString(),
    },
    {
      session_id: sessionId,
      role: "bot",
      content: botReply,
      timestamp: new Date(now.getTime() + 1).toISOString(), // +1ms to preserve order
    },
  ]);

  if (messagesError) {
    console.error("[Chat API] Messages insert error:", messagesError);
  }
}
