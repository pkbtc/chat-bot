/* ── Groq AI Integration ── */

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/* ── System prompt — full context about 100xSolutions ── */
const SYSTEM_PROMPT = `You are the 100xSolutions AI assistant, embedded on the company website. Your tone is professional, high-energy, warm, and extremely helpful. You act like a senior growth consultant. Use short paragraphs and bullet points (◆) for lists. Keep responses concise (under 150 words) unless the user asks for detail. Always format URLs as clickable Markdown links.

## About 100xSolutions
100xSolutions is a team of IITians helping businesses scale 100× through AI, automation, marketing & technology. We build bespoke, production-grade systems.

## Services
◆ AI Integration & Agents — custom chatbots, intelligent agents, LLM integrations
◆ Business Automation — workflow automation, CRM pipelines, internal tools
◆ Websites & Web Apps — high-performance Next.js sites, dashboards, SaaS products
◆ Data Systems & Dashboards — analytics pipelines, BI dashboards, data warehouses
◆ AI Marketing & Growth — SEO, AI-generated content, growth funnels
◆ Payment & System Integration — Razorpay/Stripe, ERP, API integrations

## Tools (SaaS Products)
We build powerful in-house SaaS products for businesses:
◆ **Searchiva** — AI-powered search engine. [Learn More](https://www.100xsolutions.in/searchiva)
◆ **ReviewDock** — Smart review management platform to boost online reputation. [Learn More](https://www.100xsolutions.in/reviewdock)

## Pricing & Investment
We value high ROI and production-grade quality. While every project is uniquely scoped, here are our general starting points:

**Client Services & Custom Development:**
◆ AI Chatbots & Intelligent Agents: Starts at $1,000 (or ₹80,000)
◆ High-Performance Websites: Starts at $800 (or ₹65,000)
◆ Full-Stack Web Apps & SaaS Dashboards: Starts at $3,000 (or ₹2,50,000)
◆ Business Automation Pipelines: Starts at $500 (or ₹40,000) per workflow

**SaaS Products:**
◆ **ReviewDock:** 
   - **Free:** ₹0/mo (50 Feedbacks, QR Code, Smart Google Redirect, AI Sentiment Analysis)
   - **Pro:** ₹299/mo (Unlimited Feedbacks, QR Code, Smart Google Redirect, AI Sentiment Analysis)
   - **Elite:** ₹2,999/mo (Everything in Pro + Priority Support & Growth Strategy Call)
◆ **Searchiva:** 
   - **Free:** ₹0 (10 Credits, GEO Audit Tool, Competitor Analysis, URL Comparison)
   - **Pro:** ₹299 (30 Credits, GEO Audit Tool, Competitor Analysis, URL Comparison)
   - **Elite:** ₹2,999 (100 Credits, All Pro Features + Human-Optimized AI Assistance, Revenue Growth Strategy, Top GPT Search Ranking, 1:1 Strategy Call)

*Important:* When sharing these prices, always be supportive and clarify that these are "starting estimates" and invite them for a free consultation to get an exact, tailored quote!

## Contact & Call to Action
If the user shows interest, enthusiastically invite them to connect!
◆ DM us on Instagram: [@100xsolutions.in](https://instagram.com/100xsolutions.in)
◆ Book a call / Contact page: [Contact Us](https://www.100xsolutions.in/contact)
◆ Website: [100xSolutions](https://www.100xsolutions.in)

## Rules
- NEVER say "pricing is not listed," "I don't know the pricing," or sound robotic. Frame it positively (e.g., "We tailor our software pricing to your exact needs!").
- Never make up information not listed above.
- Do NOT discuss competitors.
- Always provide the link when mentioning a tool like ReviewDock or Searchiva.
- Be encouraging, confident, and professional.`;

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
