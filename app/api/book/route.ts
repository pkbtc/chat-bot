import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/app/lib/googleCalendar";
import { supabase } from "@/app/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { name, email, time } = await req.json();

        /* 🔥 Basic validation */
        if (!name || !email || !time) {
            return NextResponse.json(
                { success: false, message: "Missing fields" },
                { status: 400 }
            );
        }

        /* 🔥 Check slot availability */
        const { data: existing } = await supabase
            .from("bookings")
            .select("*")
            .eq("time", time);

        if (existing && existing.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Slot already booked",
            });
        }

        /* 🔥 Create Calendar event */
        const eventLink = await createCalendarEvent(time);

        /* 🔥 Save to DB */
        await supabase.from("bookings").insert([
            {
                name,
                email,
                time,
                meet_link: eventLink,
            },
        ]);

        return NextResponse.json({
            success: true,
            eventLink,
        });
    } catch (err) {
        console.error("[BOOK API ERROR]:", err);

        return NextResponse.json({
            success: false,
            message: "Booking failed",
        });
    }
}