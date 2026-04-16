/**
 * POST /api/book
 *
 * Books a meeting:
 * 1. Validates input (name, email, time)
 * 2. Checks slot availability in Supabase
 * 3. Creates Google Calendar event with Meet link (via OAuth)
 * 4. Stores booking in Supabase
 * 5. Returns meet link + event link
 */

import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/app/lib/googleCalendar";
import { supabase } from "@/app/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { name, email, time } = await req.json();

        /* Validation */
        if (!name || !email || !time) {
            return NextResponse.json(
                { success: false, message: "Missing fields: name, email, and time are required" },
                { status: 400 }
            );
        }

        /* Check slot availability */
        const { data: existing } = await supabase
            .from("bookings")
            .select("id")
            .eq("time", time);

        if (existing && existing.length > 0) {
            return NextResponse.json({
                success: false,
                message: "This slot is already booked. Please choose a different time.",
            });
        }

        /* Create Calendar event with Meet link */
        const { meetLink, eventLink, eventId } = await createCalendarEvent(
            name,
            email,
            time
        );

        /* Save booking to Supabase */
        const { error: dbError } = await supabase.from("bookings").insert([
            {
                name,
                email,
                time,
                meet_link: meetLink,
                event_link: eventLink,
                event_id: eventId,
            },
        ]);

        if (dbError) {
            console.error("[Book API] DB insert error:", dbError);
            // Event was created but DB save failed — still return success
        }

        return NextResponse.json({
            success: true,
            meetLink,
            eventLink,
        });
    } catch (err) {
        console.error("[BOOK API ERROR]:", err);

        const message =
            err instanceof Error && err.message.includes("OAuth")
                ? "Google Calendar not connected. Admin needs to authenticate at /api/auth/google"
                : "Booking failed. Please try again.";

        return NextResponse.json({
            success: false,
            message,
        });
    }
}