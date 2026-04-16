"use client";

import React, { useState, useEffect } from "react";

export default function InlineTimePicker({ onConfirm, isMobile }: { onConfirm: (val: string) => void, isMobile: boolean }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("10:00");

  // Generate next 7 days
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Make sure to select today by default
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(upcomingDays[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      const d = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onConfirm(d.toISOString());
    }
  };

  const currentMonthYear = selectedDate 
    ? selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div
      style={{
        padding: isMobile ? "0 12px 10px" : "0 14px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
        background: "var(--surface)",
      }}
    >
      <div style={{
          background: "var(--surface-light)",
          border: "1px solid var(--border-light)",
          padding: "16px",
      }}>
        {/* Fixed Month & Year display */}
        <div style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800,
          fontSize: 16,
          color: "var(--foreground)",
          marginBottom: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {currentMonthYear}
        </div>

        {/* Scrollable Day Chips */}
        <div style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none", // Firefox
          WebkitOverflowScrolling: "touch",
        }}>
          {upcomingDays.map((d, i) => {
            const isSelected = selectedDate?.toDateString() === d.toDateString();
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dateNum = d.getDate();
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 54,
                  height: 64,
                  background: isSelected ? "var(--primary)" : "var(--background)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  color: isSelected ? "var(--background)" : "var(--foreground)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>
                  {dayName}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800 }}>
                  {dateNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Time Input & Confirm */}
        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--foreground-subtle)", letterSpacing: "0.05em" }}>
              Selected Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 14,
                fontFamily: "inherit",
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={handleConfirm}
            style={{
               alignSelf: "flex-end",
               padding: "10px 20px",
               height: 41,
               background: "var(--primary)",
               color: "var(--background)",
               border: "none",
               fontFamily: '"JetBrains Mono", monospace',
               fontSize: 12,
               fontWeight: 700,
               textTransform: "uppercase",
               cursor: "pointer",
               transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
