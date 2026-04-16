import { google } from "googleapis";
import { createPrivateKey } from "crypto";

/**
 * Convert a private key to PKCS#8 format for OpenSSL 3.x compatibility.
 * Google service account keys use PKCS#1 format which Node.js 17+
 * (OpenSSL 3.0) rejects by default.
 */
function toPKCS8(pem: string): string {
    try {
        // Ensure escaped \n literals become real newlines
        const normalizedPem = pem.replace(/\\n/g, "\n");
        const key = createPrivateKey({ key: normalizedPem, format: "pem" });
        return key.export({ type: "pkcs8", format: "pem" }) as string;
    } catch {
        // If conversion fails, return the original key as-is
        return pem;
    }
}

/* ── Create Calendar Event & return event link ── */
export async function createCalendarEvent(time: string): Promise<string> {
    try {
        const credentials = JSON.parse(
            process.env.GOOGLE_CREDENTIALS as string
        );

        /* Fix private key format for OpenSSL 3.x */
        if (credentials.private_key) {
            credentials.private_key = toPKCS8(credentials.private_key);
        }

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ["https://www.googleapis.com/auth/calendar"],
            subject: process.env.GOOGLE_CALENDAR_USER_EMAIL,
        });

        const calendar = google.calendar({ version: "v3", auth });

        const startTime = new Date(time);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min meeting

        const event = {
            summary: "Meeting with 100xSolutions",
            description: "Consultation call booked via chatbot",
            start: {
                dateTime: startTime.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: "Asia/Kolkata",
            },
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
        });

        const eventLink = response.data.htmlLink;

        if (!eventLink) {
            throw new Error("Calendar event link not generated");
        }

        return eventLink;
    } catch (error) {
        console.error("[Google Calendar Error]:", error);
        throw new Error("Failed to create calendar event");
    }
}