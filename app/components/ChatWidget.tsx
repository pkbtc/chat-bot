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

const QUICK_REPLIES: QuickReply[] = [
  { label: "Our Services", value: "Tell me about your services" },
  { label: "Pricing", value: "How does your pricing work?" },
  { label: "Our Process", value: "What is your process?" },
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

/* ── Component ── */
export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome-msg",
      role: "bot",
      text: "Hey! 👋 I'm the 100x assistant.\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
        const botMsg: Message = {
          id: generateId(),
          role: "bot",
          text:
            data.reply ||
            "Sorry, something went wrong. Please try again or DM us on Instagram @100xsolutions.in!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
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
    [isTyping, messages, sessionId]
  );

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
            100x Assistant
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--accent)",
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
                background: "var(--primary)",
                display: "inline-block",
                borderRadius: 0,
                animation: "blink 1s step-end infinite",
              }}
            />
            Online — Typically instant
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        isMobile={isMobile}
        scrollRef={scrollRef}
      />

      {/* ── Quick Replies (shown only at start) ── */}
      {messages.length <= 2 && !isTyping && (
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

      {/* ── Input ── */}
      <InputBox onSend={sendMessage} disabled={isTyping} isMobile={isMobile} />

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
