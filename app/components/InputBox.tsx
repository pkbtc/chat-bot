"use client";

import React, { useState, useRef } from "react";

type InputBoxProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  isMobile: boolean;
};

export default function InputBox({
  onSend,
  disabled = false,
  isMobile,
}: InputBoxProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderTop: "1px solid var(--border)",
        padding: isMobile ? "10px 12px" : "12px 14px",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexShrink: 0,
        background: "var(--surface-elevated)",
        paddingBottom: isMobile
          ? "max(10px, env(safe-area-inset-bottom, 10px))"
          : "12px",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        autoComplete="off"
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: 1,
          background: "var(--surface)",
          border: `1px solid ${isFocused ? "var(--accent)" : "var(--border)"}`,
          padding: isMobile ? "12px 14px" : "10px 14px",
          fontSize: isMobile ? 16 : 13, /* 16px prevents iOS zoom */
          color: "var(--foreground)",
          fontFamily: "inherit",
          outline: "none",
          borderRadius: 0,
          transition: "border-color 0.15s",
          minWidth: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button
        type="submit"
        disabled={!canSend}
        style={{
          width: isMobile ? 44 : 40,
          height: isMobile ? 44 : 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: canSend ? "var(--primary)" : "var(--surface-light)",
          border: `2px solid ${canSend ? "var(--primary)" : "var(--border)"}`,
          color: canSend ? "var(--background)" : "var(--foreground-subtle)",
          cursor: canSend ? "pointer" : "not-allowed",
          transition: "all 0.15s",
          flexShrink: 0,
          borderRadius: 0,
          boxShadow: canSend
            ? "3px 3px 0px 0px var(--accent)"
            : "none",
        }}
        aria-label="Send message"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </form>
  );
}
