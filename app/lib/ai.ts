/* ── Groq AI Integration ── */

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/* ── System prompt ── */
const SYSTEM_PROMPT = `You are the 100xSolutions AI assistant, embedded on the company website.

Tone:
- Professional, high-energy, warm
- Act like a senior growth consultant
- Use short paragraphs
- Use ◆ for bullet points
- Keep answers under 150 words unless needed

About 100xSolutions:
We are a team of IITians helping businesses scale 100× using AI, automation, marketing, and technology.

Services:
◆ AI Integration & Agents
◆ Business Automation
◆ Websites & Web Apps (Next.js, dashboards, SaaS)
◆ Data Systems & Dashboards
◆ AI Marketing & Growth
◆ Payment & System Integration

Tools:
◆ Searchiva → https://www.100xsolutions.in/searchiva
◆ ReviewDock → https://www.100xsolutions.in/reviewdock

Pricing Rule:
- Always suggest a FREE consultancy call first
- Then give SaaS pricing summary:
  ◆ ReviewDock: Free, ₹299/mo, ₹2,999/mo
  ◆ Searchiva: Free, ₹299/mo, ₹2,999/mo
- Ask user goals at end

Contact:
◆ Instagram: https://instagram.com/100xsolutions.in
◆ Contact: https://www.100xsolutions.in/contact

Rules:
- If user wants to book/demo/schedule → DO NOT answer normally
- Let system handle booking
- Never hallucinate
- Stay confident and helpful
`;

/* ── Types ── */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIResponse = {
  reply: string;
  type: "chat" | "booking";
};

/* ── Intent Detection ── */
async function detectIntent(
  message: string
): Promise<"booking" | "chat"> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Classify the user intent strictly as either 'booking' or 'chat'. Reply only one word.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0,
        max_tokens: 5,
      }),
    });

    const data = await res.json();
    const intent = data?.choices?.[0]?.message?.content
      ?.trim()
      .toLowerCase();

    if (intent === "booking") return "booking";
    return "chat";
  } catch (err) {
    console.error("[AI] Intent detection error:", err);
    return "chat";
  }
}

/* ── Main AI Response ── */
export async function getAIResponse(
  userMessage: string,
  history: { role: "user" | "bot"; content: string }[] = []
): Promise<AIResponse> {
  if (!GROQ_API_KEY) {
    return {
      reply:
        "Chatbot is being set up. Please DM us on Instagram @100xsolutions.in ⚡",
      type: "chat",
    };
  }

  /* 🔥 Step 1: Detect Intent */
  const intent = await detectIntent(userMessage);

  if (intent === "booking") {
    return {
      reply: "Great! Let's book a slot. What's your name?",
      type: "booking",
    };
  }

  /* 🔥 Step 2: Build Messages */
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  const recentHistory = history.slice(-20);

  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({
    role: "user",
    content: userMessage.trim(),
  });

  /* 🔥 Step 3: Call Groq */
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[AI] Groq error:", errorText);

      return {
        reply:
          "I'm having a little trouble right now. Please try again or DM us on Instagram ⚡",
        type: "chat",
      };
    }

    const data = await res.json();

    return {
      reply:
        data?.choices?.[0]?.message?.content?.trim() ||
        "Sorry, I couldn't generate a response.",
      type: "chat",
    };
  } catch (err) {
    console.error("[AI] Unexpected error:", err);

    return {
      reply:
        "Something went wrong. Please DM us on Instagram @100xsolutions.in ⚡",
      type: "chat",
    };
  }
}

/* ───────────────────────────────────────────── */
/* 🤖 AI AGENT (Extraction + Auto Booking) */
/* ───────────────────────────────────────────── */

export type AgentResponse = {
  intent: "booking" | "chat";
  name?: string;
  email?: string;
  time?: string;
  reply: string;
};

/**
 * AI Agent:
 * - Detect booking intent
 * - Extract name, email, time
 * - Return structured JSON
 */
export async function getAIAgentResponse(
  userMessage: string,
  history: { role: "user" | "bot"; content: string }[] = []
): Promise<AgentResponse> {
  try {
    const messages = [
      {
        role: "system",
        content: `
You are an AI agent for a company website.

Your job:
1. Detect if user wants to book a meeting/demo/call
2. Extract:
   - name
   - email
   - time (convert to ISO format if possible)

Rules:
- ALWAYS return valid JSON
- DO NOT include any text outside JSON
- If data missing → keep fields null
- If not booking → intent = "chat"

Output format:
{
  "intent": "booking" | "chat",
  "name": "string | null",
  "email": "string | null",
  "time": "ISO string | null",
  "reply": "short helpful reply"
}
        `,
      },

      ...history.slice(-10).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),

      {
        role: "user",
        content: userMessage,
      },
    ];

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages,
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Agent] Groq error:", errorText);

      return {
        intent: "chat",
        reply: "I'm having trouble understanding right now. Please try again.",
      };
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;

    /* 🔥 Safe JSON parsing */
    try {
      const parsed = JSON.parse(raw);

      return {
        intent: parsed.intent === "booking" ? "booking" : "chat",
        name: parsed.name || undefined,
        email: parsed.email || undefined,
        time: parsed.time || undefined,
        reply: parsed.reply || "Got it 👍",
      };
    } catch (err) {
      console.error("[Agent] JSON parse failed:", raw);

      return {
        intent: "chat",
        reply: raw || "Sorry, I couldn't understand properly.",
      };
    }
  } catch (err) {
    console.error("[Agent] Unexpected error:", err);

    return {
      intent: "chat",
      reply: "Something went wrong. Please try again.",
    };
  }
}