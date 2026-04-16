/**
 * Google Calendar Integration (OAuth 2.0)
 *
 * Creates calendar events in the authenticated user's calendar
 * with Google Meet links and attendee invites.
 */

import { google } from "googleapis";
import { getAuthenticatedClient } from "./googleAuth";

/* ── Types ── */
export type CalendarEventResult = {
    meetLink: string;
    eventLink: string;
    eventId: string;
};

/* ── Create Calendar Event with Meet Link ── */
export async function createCalendarEvent(
    name: string,
    email: string,
    time: string
): Promise<CalendarEventResult> {
    /* Get authenticated OAuth2 client */
    const auth = await getAuthenticatedClient();
    const calendar = google.calendar({ version: "v3", auth });

    const startTime = new Date(time);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min meeting

    const event = {
        summary: `Meeting with ${name} — 100xSolutions`,
        description: `Consultation call booked via 100xSolutions chatbot.\n\nClient: ${name}\nEmail: ${email}`,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: "Asia/Kolkata",
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: "Asia/Kolkata",
        },

        /* Add the user as an attendee → they get an email invite */
        attendees: [{ email }],

        /* Generate Google Meet link */
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                conferenceSolutionKey: {
                    type: "hangoutsMeet",
                },
            },
        },

        /* Reminder for the organizer */
        reminders: {
            useDefault: false,
            overrides: [
                { method: "email", minutes: 30 },
                { method: "popup", minutes: 10 },
            ],
        },
    };

    const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: "all", // Sends email invite to attendees
    });

    /* Extract Meet link */
    let meetLink = response.data.hangoutLink;

    /* Fallback: check conferenceData entryPoints */
    if (!meetLink && response.data.conferenceData?.entryPoints) {
        const videoEntry = response.data.conferenceData.entryPoints.find(
            (ep) => ep.entryPointType === "video"
        );
        meetLink = videoEntry?.uri ?? null;
    }

    const eventLink = response.data.htmlLink;
    const eventId = response.data.id;

    if (!meetLink || !eventLink || !eventId) {
        console.error(
            "[Calendar] Missing data in response:",
            JSON.stringify(response.data, null, 2)
        );
        throw new Error("Failed to generate complete event data");
    }

    console.log(`[Calendar] ✅ Event created: ${meetLink}`);

    return { meetLink, eventLink, eventId };
}