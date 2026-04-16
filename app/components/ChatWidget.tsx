"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import MessageList from "./MessageList";
import InputBox from "./InputBox";

/* ── Types ── */
type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
};

type QuickReply = {
  label: string;
  value: string;
};

type BookingStep = "name" | "email" | "time" | "confirm" | null;

type BookingData = {
  name: string;
  email: string;
  time: string;
};

const QUICK_REPLIES: QuickReply[] = [
  { label: "Our Services", value: "Tell me about your services" },
  { label: "Pricing", value: "How does your pricing work?" },
  { label: "Book a Call", value: "I want to book a consultation call" },
  { label: "Contact Us", value: "How can I contact you?" },
];

/* ── Helpers ── */
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("chatbot_session_id");
  if (!sid) {
    sid =
      crypto.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("chatbot_session_id", sid);
  }
  return sid;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parse a user-provided date/time string into an ISO string.
 * Supports:
 *   - "tomorrow 3pm", "tomorrow 15:00"
 *   - "2026-04-20 14:00"
 *   - "20 April 3:30 PM"
 *   - Relative: "today 5pm"
 * Returns null if unparseable.
 */
function parseDateTime(input: string): string | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  /* ── "tomorrow" handling ── */
  const tomorrowMatch = lower.match(
    /^tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i
  );
  if (tomorrowMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    let hours = parseInt(tomorrowMatch[1]);
    const minutes = parseInt(tomorrowMatch[2] || "0");
    const ampm = tomorrowMatch[3]?.toLowerCase();
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    if (!ampm && hours < 8) hours += 12; // assume PM for small numbers
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  /* ── "today" handling ── */
  const todayMatch = lower.match(
    /^today\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i
  );
  if (todayMatch) {
    const d = new Date(now);
    let hours = parseInt(todayMatch[1]);
    const minutes = parseInt(todayMatch[2] || "0");
    const ampm = todayMatch[3]?.toLowerCase();
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    if (!ampm && hours < 8) hours += 12;
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  /* ── Try native Date parse as fallback ── */
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime()) && parsed.getTime() > now.getTime()) {
    return parsed.toISOString();
  }

  return null;
}

function formatReadableTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/* ── Component ── */
export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome-msg",
      role: "bot",
      text: "Hey! 👋 I'm the 100xSolutions Assistant.\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  /* ── Booking state machine ── */
  const [bookingStep, setBookingStep] = useState<BookingStep>(null);
  const [bookingData, setBookingData] = useState<BookingData>({
    name: "",
    email: "",
    time: "",
  });

  /* Initialize session */
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  /* ── Add bot message helper ── */
  const addBotMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: "bot",
        text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  /* ── Handle booking step ── */
  const handleBookingInput = useCallback(
    async (text: string) => {
      /* cancel */
      if (text.toLowerCase() === "cancel") {
        setBookingStep(null);
        setBookingData({ name: "", email: "", time: "" });
        addBotMessage(
          "Booking cancelled. No worries! ✌️\nLet me know if you need anything else."
        );
        return;
      }

      switch (bookingStep) {
        case "name": {
          if (text.trim().length < 2) {
            addBotMessage("Please enter your full name (at least 2 characters).");
            return;
          }
          setBookingData((prev) => ({ ...prev, name: text.trim() }));
          setBookingStep("email");
          addBotMessage(
            `Thanks, **${text.trim()}**! 👍\n\nNow, what's your email address? 📧`
          );
          break;
        }

        case "email": {
          if (!isValidEmail(text.trim())) {
            addBotMessage(
              "That doesn't look like a valid email. Please try again.\nExample: yourname@email.com"
            );
            return;
          }
          setBookingData((prev) => ({ ...prev, email: text.trim() }));
          setBookingStep("time");
          addBotMessage(
            `Got it! ✅\n\nWhen would you like to book the call? 📅\n\nYou can say something like:\n◆ "Tomorrow 3pm"\n◆ "Today 5:30 PM"\n◆ "2026-04-20 14:00"`
          );
          break;
        }

        case "time": {
          const parsed = parseDateTime(text.trim());
          if (!parsed) {
            addBotMessage(
              "I couldn't understand that time. Please try again.\n\nExamples:\n◆ \"Tomorrow 3pm\"\n◆ \"Today 5:30 PM\"\n◆ \"2026-04-20 14:00\""
            );
            return;
          }

          const readableTime = formatReadableTime(parsed);
          setBookingData((prev) => ({ ...prev, time: parsed }));
          setBookingStep("confirm");
          addBotMessage(
            `Here's your booking summary:\n\n◆ **Name:** ${bookingData.name}\n◆ **Email:** ${bookingData.email}\n◆ **Time:** ${readableTime}\n\nType **"yes"** to confirm or **"cancel"** to abort.`
          );
          break;
        }

        case "confirm": {
          const answer = text.trim().toLowerCase();
          if (
            answer === "yes" ||
            answer === "y" ||
            answer === "confirm" ||
            answer === "ok" ||
            answer === "sure"
          ) {
            setIsTyping(true);
            try {
              const apiUrl =
                (typeof window !== "undefined"
                  ? window.location.origin
                  : "") + "/api/book";

              const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: bookingData.name,
                  email: bookingData.email,
                  time: bookingData.time,
                }),
              });

              const data = await res.json();

              if (data.success && (data.meetLink || data.eventLink)) {
                const links = [];
                if (data.meetLink) links.push(`◆ **Google Meet:** [Join Meeting](${data.meetLink})`);
                if (data.eventLink) links.push(`◆ **Calendar Event:** [View Event](${data.eventLink})`);

                addBotMessage(
                  `🎉 **Booking Confirmed!**\n\nYour consultation call is booked.\n\n◆ **Time:** ${formatReadableTime(
                    bookingData.time
                  )}\n${links.join("\n")}\n\nA calendar invite has been sent to your email. See you there! 🚀`
                );
              } else {
                addBotMessage(
                  `❌ Sorry, couldn't complete the booking: ${
                    data.message || "Please try again."
                  }\n\nYou can DM us on Instagram @100xsolutions.in for instant help! ⚡`
                );
              }
            } catch {
              addBotMessage(
                "❌ Something went wrong while booking. Please check your connection or DM us on Instagram @100xsolutions.in! ⚡"
              );
            } finally {
              setIsTyping(false);
              setBookingStep(null);
              setBookingData({ name: "", email: "", time: "" });
            }
          } else if (answer === "no" || answer === "n") {
            setBookingStep(null);
            setBookingData({ name: "", email: "", time: "" });
            addBotMessage(
              "Booking cancelled. No worries! ✌️\nLet me know if you need anything else."
            );
          } else {
            addBotMessage(
              'Please type **"yes"** to confirm or **"cancel"** to abort.'
            );
          }
          break;
        }
      }
    },
    [bookingStep, bookingData, addBotMessage]
  );

  /* ── Send message handler ── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      /* ── If we're in booking mode, handle deterministically ── */
      if (bookingStep) {
        await handleBookingInput(text.trim());
        return;
      }

      /* ── Normal chat flow ── */
      setIsTyping(true);

      try {
        const apiUrl =
          (typeof window !== "undefined" ? window.location.origin : "") +
          "/api/chat";

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            sessionId,
            history: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.text,
            })),
          }),
        });

        const data = await res.json();

        /* 🔥 If AI detected booking intent, start booking flow */
        if (data.type === "booking") {
          setBookingStep("name");
          addBotMessage(
            "Great! Let's book a free consultation call. 🗓️\n\nFirst, **what's your name?**\n\n_(Type \"cancel\" anytime to abort)_"
          );
        } else {
          const botMsg: Message = {
            id: generateId(),
            role: "bot",
            text:
              data.reply ||
              "Sorry, something went wrong. Please try again or DM us on Instagram @100xsolutions.in!",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "bot",
            text: "Couldn't reach the server. Please check your connection or DM us on Instagram @100xsolutions.in!",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, sessionId, bookingStep, handleBookingInput, addBotMessage]
  );

  /* ── Placeholder text changes depending on booking step ── */
  const getPlaceholder = (): string => {
    switch (bookingStep) {
      case "name":
        return "Enter your name...";
      case "email":
        return "Enter your email...";
      case "time":
        return "e.g. Tomorrow 3pm...";
      case "confirm":
        return 'Type "yes" to confirm...';
      default:
        return "Type a message...";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--surface)",
        color: "var(--foreground)",
        overflow: "hidden",
        fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "var(--surface-elevated)",
          borderBottom: "1px solid var(--border)",
          padding: isMobile ? "16px" : "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          paddingTop: isMobile
            ? "max(16px, env(safe-area-inset-top, 16px))"
            : "14px",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--background)"
            strokeWidth="2.5"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800,
              fontSize: isMobile ? 15 : 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--foreground)",
              lineHeight: 1.2,
            }}
          >
            100xSolutions Assistant
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: bookingStep ? "var(--primary)" : "var(--accent)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: bookingStep ? "var(--primary)" : "var(--primary)",
                display: "inline-block",
                borderRadius: 0,
                animation: "blink 1s step-end infinite",
              }}
            />
            {bookingStep ? "📅 Booking Mode" : "Online (24/7 support)"}
          </div>
        </div>

        {/* Cancel booking button */}
        {bookingStep && (
          <button
            onClick={() => {
              setBookingStep(null);
              setBookingData({ name: "", email: "", time: "" });
              addBotMessage(
                "Booking cancelled. No worries! ✌️\nLet me know if you need anything else."
              );
            }}
            style={{
              padding: "6px 12px",
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--border-light)",
              cursor: "pointer",
              borderRadius: 0,
              transition: "all 0.15s",
            }}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        isMobile={isMobile}
        scrollRef={scrollRef}
      />

      {/* ── Quick Replies (shown only at start) ── */}
      {messages.length <= 2 && !isTyping && !bookingStep && (
        <div
          style={{
            padding: isMobile ? "0 12px 10px" : "0 14px 10px",
            display: "flex",
            flexWrap: "wrap",
            gap: isMobile ? 8 : 6,
            flexShrink: 0,
          }}
        >
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr.value}
              onClick={() => sendMessage(qr.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
                e.currentTarget.style.background = "rgba(102,242,9,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.color = "var(--foreground-muted)";
                e.currentTarget.style.background = "var(--surface-light)";
              }}
              style={{
                padding: isMobile ? "10px 14px" : "6px 12px",
                fontSize: isMobile ? 12 : 11,
                fontFamily: '"JetBrains Mono", monospace',
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "var(--surface-light)",
                color: "var(--foreground-muted)",
                border: "1px solid var(--border-light)",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 0,
                ...(isMobile
                  ? { flex: "1 1 calc(50% - 4px)", minWidth: 0 }
                  : {}),
              }}
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Booking Progress Indicator ── */}
      {bookingStep && (
        <div
          style={{
            padding: "8px 14px",
            display: "flex",
            gap: 4,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
          }}
        >
          {(["name", "email", "time", "confirm"] as const).map((step, i) => {
            const steps = ["name", "email", "time", "confirm"];
            const currentIdx = steps.indexOf(bookingStep);
            const isCompleted = i < currentIdx;
            const isCurrent = step === bookingStep;
            return (
              <React.Fragment key={step}>
                <div
                  style={{
                    width: isMobile ? 28 : 24,
                    height: isMobile ? 28 : 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    border: `2px solid ${
                      isCompleted
                        ? "var(--primary)"
                        : isCurrent
                          ? "var(--accent)"
                          : "var(--border)"
                    }`,
                    background: isCompleted
                      ? "var(--primary)"
                      : "transparent",
                    color: isCompleted
                      ? "var(--background)"
                      : isCurrent
                        ? "var(--accent)"
                        : "var(--foreground-subtle)",
                  }}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                {i < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: isCompleted
                        ? "var(--primary)"
                        : "var(--border)",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Input ── */}
      <InputBox
        onSend={sendMessage}
        disabled={isTyping}
        isMobile={isMobile}
        placeholder={getPlaceholder()}
      />

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "6px 14px",
          textAlign: "center",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--foreground-subtle)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        Powered by 100xSolutions
      </div>
    </div>
  );
}
