import ChatWidget from "@/app/components/ChatWidget";

export const metadata = {
  title: "100x Chat Widget",
  description: "AI assistant by 100xSolutions",
};

/**
 * This page is rendered inside an iframe on external websites.
 * It shows only the chat widget — no navigation or extra chrome.
 */
export default function WidgetPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950">
      <ChatWidget />
    </main>
  );
}
