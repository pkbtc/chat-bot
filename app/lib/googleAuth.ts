/**
 * Google OAuth 2.0 Authentication Module
 *
 * Handles:
 * - OAuth2 client creation
 * - Authorization URL generation
 * - Token exchange (auth code → tokens)
 * - Token storage in Supabase
 * - Auto-refresh of expired tokens
 */

import { google } from "googleapis";
import { supabase } from "./db";

/* ── Environment Variables ── */
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

/* ── Scopes needed ── */
const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
];

/* ── Create OAuth2 Client ── */
export function createOAuth2Client() {
    return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/* ── Generate Authorization URL ── */
export function getAuthUrl(): string {
    const oauth2Client = createOAuth2Client();

    return oauth2Client.generateAuthUrl({
        access_type: "offline", // Gets refresh_token
        prompt: "consent",      // Forces consent screen → always returns refresh_token
        scope: SCOPES,
    });
}

/* ── Exchange Auth Code for Tokens ── */
export async function exchangeCodeForTokens(code: string) {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    /* Store tokens in Supabase */
    await storeTokens(tokens);

    return tokens;
}

/* ── Token Storage (Supabase) ── */

/**
 * Store tokens in the `google_tokens` table.
 * We use a single row (id = 'primary') since this is for one admin account.
 */
async function storeTokens(tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
}) {
    // ⚠️ CRITICAL FIX: Ensure we never overwrite an existing refresh token with null/undefined
    const existing = await getStoredTokens();
    const finalRefreshToken = tokens.refresh_token ?? existing?.refresh_token;

    const { error } = await supabase.from("google_tokens").upsert(
        {
            id: "primary",
            access_token: tokens.access_token,
            refresh_token: finalRefreshToken,
            expiry_date: tokens.expiry_date,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (error) {
        console.error("[GoogleAuth] Failed to store tokens:", error);
        throw new Error("Failed to store OAuth tokens");
    }

    console.log("[GoogleAuth] ✅ Tokens stored successfully");
}

/**
 * Retrieve stored tokens from Supabase.
 */
async function getStoredTokens() {
    const { data, error } = await supabase
        .from("google_tokens")
        .select("*")
        .eq("id", "primary")
        .single();

    if (error || !data) {
        console.error("[GoogleAuth] No tokens found:", error?.message);
        return null;
    }

    return {
        access_token: data.access_token as string,
        refresh_token: data.refresh_token as string,
        expiry_date: data.expiry_date as number,
    };
}

/* ── Get Authenticated OAuth2 Client ── */

/**
 * Returns an OAuth2 client with valid tokens.
 * Auto-refreshes if the access token is expired.
 */
export async function getAuthenticatedClient() {
    const tokens = await getStoredTokens();

    if (!tokens || !tokens.refresh_token) {
        throw new Error(
            "Google OAuth not configured. Please visit /api/auth/google to authenticate."
        );
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);

    /* Check if access token is expired (with 5 min buffer) */
    const isExpired =
        tokens.expiry_date && tokens.expiry_date < Date.now() + 5 * 60 * 1000;

    if (isExpired) {
        console.log("[GoogleAuth] Access token expired, refreshing...");

        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            /* Store the refreshed tokens */
            await storeTokens({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token || tokens.refresh_token,
                expiry_date: credentials.expiry_date,
            });

            oauth2Client.setCredentials(credentials);
            console.log("[GoogleAuth] ✅ Token refreshed successfully");
        } catch (err) {
            console.error("[GoogleAuth] Token refresh failed:", err);
            throw new Error(
                "Token refresh failed. Please re-authenticate at /api/auth/google"
            );
        }
    }

    return oauth2Client;
}
