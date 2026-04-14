import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/db";

/* ── OPTIONS handler (CORS preflight) ── */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    },
  });
}

/* ── GET /api/history?sessionId=xxx ── */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
      return NextResponse.json({ messages: [], sessionId }, { status: 200 });
    }

    /* Fetch messages sorted by timestamp, limit to last 100 */
    const { data: messages, error } = await supabase
      .from("messages")
      .select("role, content, timestamp")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[History API] Supabase Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch history", messages: [] },
        { status: 500 }
      );
    }

    // Map `content` -> `text` if frontend expects it, or keep `content` 
    // depending on the db schema mapping
    const mappedMessages = messages?.map(m => ({
      role: m.role,
      text: m.content, // mapped text for frontend compatibility
      timestamp: m.timestamp
    })) || [];

    return NextResponse.json({ messages: mappedMessages, sessionId }, { status: 200 });
  } catch (err) {
    console.error("[History API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch history", messages: [] },
      { status: 500 }
    );
  }
}
