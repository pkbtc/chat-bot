export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        {/* Logo */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-8 shadow-2xl shadow-cyan-500/20">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
          100x Chatbot
        </h1>
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          AI-powered assistant by{" "}
          <a
            href="https://www.100xsolutions.in"
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            100xSolutions
          </a>
          . Embed a smart chatbot into any website with a single line of code.
        </p>

        {/* Embed Instructions */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 text-left backdrop-blur-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="text-cyan-400">{"<>"}</span> Embed Instructions
          </h2>

          <p className="text-sm text-slate-400 mb-3">
            Add this script tag to your website, right before the closing{" "}
            <code className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400 text-xs">
              {"</body>"}
            </code>{" "}
            tag:
          </p>

          <div className="bg-slate-950 border border-slate-700/50 rounded-xl p-4 overflow-x-auto">
            <code className="text-sm text-emerald-400 font-mono whitespace-pre">
              {`<script src="https://yourdomain.com/widget.js"></script>`}
            </code>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Replace <span className="text-cyan-400/70">yourdomain.com</span>{" "}
            with the URL where this chatbot app is deployed.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            {
              icon: "⚡",
              title: "Instant AI",
              desc: "Powered by Groq for sub-second responses",
            },
            {
              icon: "🔒",
              title: "Sandboxed",
              desc: "iframe isolation — zero CSS conflicts",
            },
            {
              icon: "💾",
              title: "Persistent",
              desc: "MongoDB-backed chat history with sessions",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 text-center"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
