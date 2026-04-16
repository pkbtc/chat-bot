import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Basic password protection check
    const adminPass = req.headers.get("x-admin-password");
    if (
      process.env.ADMIN_PASSWORD &&
      adminPass !== process.env.ADMIN_PASSWORD
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("time", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Admin Bookings API] Error fetching bookings:", error);
      return NextResponse.json({ error: "DB Error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("[Admin Bookings API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
