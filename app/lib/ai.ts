/* ── Groq AI Integration ── */

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/* ── System prompt — full context about 100xSolutions ── */
const SYSTEM_PROMPT = `You are the 100xSolutions AI assistant, embedded on the company website. Your tone is professional yet warm, concise and helpful. Use short paragraphs and bullet points (◆) for lists. Keep responses under 150 words unless the user asks for detail.

## About 100xSolutions
100xSolutions is a team of IITians that helps businesses scale 100× through AI, automation, marketing & technology — researched, tailored, and implemented end-to-end.

## Services
◆ AI Integration & Agents — custom chatbots, intelligent agents, LLM integrations
◆ Business Automation — workflow automation, CRM pipelines, internal tools
◆ Websites & Web Apps — high-performance Next.js sites, dashboards, SaaS products
◆ Data Systems & Dashboards — analytics pipelines, BI dashboards, data warehouses
◆ AI Marketing & Growth — SEO, AI-generated content, growth funnels, ad automation
◆ Payment & System Integration — Razorpay/Stripe, ERP, API integrations

## Process
01 → Discovery & Research
02 → Strategy & Architecture
03 → Build & Implement
04 → Test & Launch
05 → Optimise & Scale

## Tools (SaaS Products)
◆ Searchiva — AI-powered search engine (Link: https://www.100xsolutions.in/searchiva)
◆ ReviewDock — Smart review management platform (Link: https://www.100xsolutions.in/reviewdock)

## Pricing
Every project is scoped individually. We start with a free consultancy, then deliver a fixed-price proposal — no surprises.

## Contact
◆ Instagram: @100xsolutions.in
◆ Website: https://www.100xsolutions.in
◆ Contact page: https://www.100xsolutions.in/contact

## Rules
- Never make up information not listed above.
- If unsure, direct users to DM on Instagram or the Contact page.
- Do NOT discuss competitors or make comparisons.
- Do NOT provide legal, medical, or financial advice.
- Always be encouraging about the user's business goals.
- Format all URLs as clickable Markdown links, e.g., [100xSolutions](https://www.100xsolutions.in).
- If asked something unrelated, politely redirect to how 100xSolutions can help their business.`;

/* ── Types ── */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Send messages to Groq and get an AI completion.
 * Automatically prepends the system prompt.
 */
export async function getAIResponse(
  userMessage: string,
  history: { role: "user" | "bot"; content: string }[] = []
): Promise<string> {
  if (!GROQ_API_KEY) {
    return "The chatbot is being set up. Please DM us on Instagram @100xsolutions.in for now!";
  }

  /* Build message array */
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Append conversation history (last 20 messages = 10 exchanges)
  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  // Append the current user message
  messages.push({ role: "user", content: userMessage.trim() });

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
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[AI] Groq error:", res.status, errorText);
      return "I'm having a little trouble right now. Please try again in a moment, or DM us on Instagram @100xsolutions.in!";
    }

    const data = await res.json();
    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response. Please try again!"
    );
  } catch (err) {
    console.error("[AI] Unexpected error:", err);
    return "Something went wrong on our end. Please DM us on Instagram @100xsolutions.in — we reply fast! ⚡";
  }
}
