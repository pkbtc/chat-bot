"use client";

import React, { useState, useEffect } from "react";

type Session = {
  session_id: string;
  updated_at: string;
};

type Message = {
  role: "user" | "bot";
  text: string;
  timestamp: string;
};

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const fetchSessions = async (pass: string) => {
    setLoadingSessions(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sessions", {
        headers: { "x-admin-password": pass },
      });
      if (res.status === 401) {
        setError("Invalid password");
        setIsAuthenticated(false);
        setLoadingSessions(false);
        return;
      }
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Failed to load sessions");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingSessions(false);
  };

  const fetchMessages = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/history?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingMessages(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(password);
  };

  /* ── 1. LOGIN SCREEN ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
        <div className="bg-slate-900 border border-slate-700 p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-[#66f209] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-widest uppercase">Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-3 text-sm focus:border-[#00f0ff] outline-none"
            />
            {error && <p className="text-[#ff3333] text-xs font-mono">{error}</p>}
            <button
              type="submit"
              disabled={loadingSessions}
              className="w-full bg-[#66f209] text-black font-bold p-3 uppercase tracking-widest hover:translate-x-0.5 hover:translate-y-0.5 shadow-[4px_4px_0_0_#00f0ff] transition-all"
            >
              {loadingSessions ? "Loading..." : "Enter"}
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-500 font-mono">
            * If no password is set in .env.local, just click Enter.
          </p>
        </div>
      </div>
    );
  }

  /* ── 2. DASHBOARD ── */
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#66f209] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h1 className="font-bold tracking-widest uppercase">100x Chat Admin</h1>
        </div>
        <button 
          onClick={() => fetchSessions(password)}
          className="text-xs font-mono text-[#00f0ff] border border-[#00f0ff] hover:bg-[#00f0ff]/10 px-3 py-1.5 transition-colors"
        >
          REFRESH
        </button>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar: Sessions List */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Recent Sessions ({sessions.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => fetchMessages(s.session_id)}
                className={`w-full text-left p-4 border-b border-slate-800/50 transition-colors hover:bg-slate-800 ${
                  selectedSession === s.session_id ? 'bg-slate-800 border-l-4 border-l-[#66f209]' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="text-xs font-mono text-slate-300 truncate mb-1">
                  ID: {s.session_id.split('-')[0]}...
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {new Date(s.updated_at).toLocaleString()}
                </div>
              </button>
            ))}
            {sessions.length === 0 && !loadingSessions && (
              <div className="p-4 text-xs text-slate-500 font-mono">No sessions found.</div>
            )}
          </div>
        </div>

        {/* Main Content: Messages View */}
        <div className="flex-1 bg-slate-950 flex flex-col h-full">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
                <h2 className="text-sm font-bold text-slate-200">Conversation View</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Session: {selectedSession}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {loadingMessages ? (
                  <div className="text-sm text-slate-500 font-mono animate-pulse">Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] font-mono text-slate-500 mb-1 tracking-wider uppercase">
                        {msg.role === 'user' ? 'Visitor' : '100x Bot'}
                      </div>
                      <div 
                        className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-[#66f209] text-black font-medium border border-[#66f209]' 
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <pre className="font-sans whitespace-pre-wrap">{msg.text}</pre>
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 font-mono">No messages logged for this session.</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-600 font-mono">
              Select a session from the left to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
