"use client";

import React from "react";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
};

/* ── Markdown-lite parser (links, bold) — matches original ChatBot.tsx ── */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const linkRegex =
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
    const parts: { type: string; content: string; url?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: line.substring(lastIndex, match.index),
        });
      }
      let url = match[2] || match[3];
      let display = match[1] || match[3];
      if (!match[1] && (url.endsWith(".") || url.endsWith(","))) {
        url = url.slice(0, -1);
        display = url;
        linkRegex.lastIndex--;
      }
      parts.push({ type: "link", content: display, url });
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push({ type: "text", content: line.substring(lastIndex) });
    }

    return (
      <span key={i}>
        {parts.map((p, pIdx) => {
          if (p.type === "link") {
            return (
              <a
                key={pIdx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline", fontWeight: 800 }}
              >
                {p.content}
              </a>
            );
          }
          const boldParts = p.content.split(/\*\*(.*?)\*\*/g);
          return (
            <span key={pIdx}>
              {boldParts.map((bp, bIdx) => {
                if (bIdx % 2 === 1)
                  return (
                    <strong key={bIdx} style={{ fontWeight: 800 }}>
                      {bp}
                    </strong>
                  );
                return <span key={bIdx}>{bp}</span>;
              })}
            </span>
          );
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type MessageListProps = {
  messages: Message[];
  isTyping: boolean;
  isMobile: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

export default function MessageList({
  messages,
  isTyping,
  isMobile,
  scrollRef,
}: MessageListProps) {
  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: isMobile ? "16px 12px" : "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="animate-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
          }}
        >
          {/* Message Bubble */}
          <div
            style={{
              maxWidth: isMobile ? "90%" : "85%",
              padding: isMobile ? "12px 14px" : "10px 14px",
              fontSize: isMobile ? 14 : 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              borderRadius: 0,
              ...(msg.role === "user"
                ? {
                    background: "var(--primary)",
                    color: "var(--background)",
                    fontWeight: 600,
                    border: "1px solid var(--primary)",
                  }
                : {
                    background: "var(--surface-light)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }),
            }}
          >
            {renderMarkdown(msg.text)}
          </div>

          {/* Timestamp */}
          <span
            suppressHydrationWarning
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--foreground-subtle)",
              marginTop: 4,
              paddingInline: 2,
            }}
          >
            {formatTime(msg.timestamp)}
          </span>
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div
          className="animate-in"
          style={{ display: "flex", alignItems: "flex-start" }}
        >
          <div
            style={{
              background: "var(--surface-light)",
              border: "1px solid var(--border)",
              padding: "10px 16px",
              display: "flex",
              gap: 5,
              alignItems: "center",
              borderRadius: 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--accent)",
                  display: "block",
                  borderRadius: 0,
                  animation: `typing-dot 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
