/**
 * GET /api/auth/callback
 *
 * Google redirects here after the user grants consent.
 * Exchanges the auth code for access + refresh tokens,
 * stores them in Supabase, and redirects to admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/app/lib/googleAuth";

export async function GET(req: NextRequest) {
    try {
        const code = req.nextUrl.searchParams.get("code");
        const error = req.nextUrl.searchParams.get("error");

        if (error) {
            console.error("[Auth Callback] User denied access:", error);
            return NextResponse.redirect(
                new URL("/admin?auth=denied", req.url)
            );
        }

        if (!code) {
            return NextResponse.json(
                { error: "No authorization code provided" },
                { status: 400 }
            );
        }

        /* Exchange code for tokens and store in Supabase */
        await exchangeCodeForTokens(code);

        console.log("[Auth Callback] ✅ OAuth setup complete");

        /* Redirect back to admin panel with success flag */
        return NextResponse.redirect(
            new URL("/admin?auth=success", req.url)
        );
    } catch (err) {
        console.error("[Auth Callback] Error:", err);
        return NextResponse.redirect(
            new URL("/admin?auth=error", req.url)
        );
    }
}
