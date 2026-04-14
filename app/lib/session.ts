import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "chatbot_session_id";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Get or create a session ID from cookies.
 * If no session exists, generates a new UUID v4.
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE_NAME);

  if (existing?.value) {
    return existing.value;
  }

  // Generate new session
  const sessionId = uuidv4();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none", // required for cross-origin iframe
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return sessionId;
}

/**
 * Extract session ID from a request header (for cross-origin scenarios
 * where cookies may not be sent). Falls back to cookie.
 */
export function getSessionIdFromHeader(
  headerSessionId?: string | null
): string {
  if (headerSessionId && headerSessionId.length > 0) {
    return headerSessionId;
  }
  return uuidv4(); // fallback: generate a new one
}
