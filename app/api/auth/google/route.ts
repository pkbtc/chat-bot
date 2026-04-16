/**
 * GET /api/auth/google
 *
 * Redirects admin to Google OAuth consent screen.
 * After consent, Google redirects back to /api/auth/callback.
 */

import { NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/googleAuth";

export async function GET() {
    try {
        const url = getAuthUrl();
        return NextResponse.redirect(url);
    } catch (error) {
        console.error("[Auth Google] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate auth URL" },
            { status: 500 }
        );
    }
}
