import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Basic password protection check (if ADMIN_PASSWORD is set in env)
    const adminPass = req.headers.get("x-admin-password");
    if (
      process.env.ADMIN_PASSWORD &&
      adminPass !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("session_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100); // Fetch latest 100 sessions

    if (error) {
      console.error("[Admin API] Error fetching sessions:", error);
      return NextResponse.json({ error: "DB Error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (err) {
    console.error("[Admin API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
