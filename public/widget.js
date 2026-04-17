/**
 * 100x Chatbot — Embeddable Widget Script
 *
 * Usage: <script src="https://yourdomain.com/widget.js"></script>
 *
 * This script injects a floating chat button and an iframe-based
 * chat window into any website. The iframe points to the /widget
 * page of the chatbot Next.js app, providing full CSS isolation.
 *
 * Design: matches the 100xSolutions brutalist / industrial aesthetic.
 */
(function () {
  "use strict";

  /* ── Config ── */
  var WIDGET_BASE_URL =
    document.currentScript?.getAttribute("data-url") ||
    document.currentScript?.src.replace(/\/widget\.js(\?.*)?$/, "") ||
    "https://chat-bot-jet-iota.vercel.app";

  var WIDGET_PAGE_URL = WIDGET_BASE_URL + "/widget";

  /* Prevent double-init */
  if (window.__100xChatbotLoaded) return;
  window.__100xChatbotLoaded = true;

  /* ── State ── */
  var isOpen = false;

  /* ── Create Styles — brutalist / industrial, matching 100xSolutions ── */
  var style = document.createElement("style");
  style.textContent = [
    /* Trigger button — square, lime green, hard shadow */
    "#__100x-chatbot-trigger {",
    "  position: fixed;",
    "  bottom: 24px;",
    "  right: 24px;",
    "  width: 56px;",
    "  height: 56px;",
    "  border-radius: 0;",
    "  background: #66f209;",
    "  border: 2px solid #66f209;",
    "  cursor: pointer;",
    "  z-index: 2147483646;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  box-shadow: 4px 4px 0px 0px #00f0ff;",
    "  transition: all 0.2s ease;",
    "  outline: none;",
    "  color: #000000;",
    "}",

    "#__100x-chatbot-trigger:hover {",
    "  transform: translate(2px, 2px);",
    "  box-shadow: 0px 0px 0px 0px #00f0ff;",
    "}",

    "#__100x-chatbot-trigger:active {",
    "  transform: translate(3px, 3px);",
    "}",

    "#__100x-chatbot-trigger svg {",
    "  width: 24px;",
    "  height: 24px;",
    "  fill: none;",
    "  stroke: #000000;",
    "  stroke-width: 2;",
    "}",

    "#__100x-chatbot-trigger.open svg.chat-icon { display: none; }",
    "#__100x-chatbot-trigger.open svg.close-icon { display: block; }",
    "#__100x-chatbot-trigger:not(.open) svg.chat-icon { display: block; }",
    "#__100x-chatbot-trigger:not(.open) svg.close-icon { display: none; }",

    /* Unread badge — red square */
    "#__100x-chatbot-badge {",
    "  position: absolute;",
    "  top: -4px;",
    "  right: -4px;",
    "  width: 16px;",
    "  height: 16px;",
    "  background: #ff3333;",
    "  border-radius: 0;",
    "  display: none;",
    "  align-items: center;",
    "  justify-content: center;",
    "  font-family: monospace;",
    "  font-size: 9px;",
    "  font-weight: 700;",
    "  color: white;",
    "}",

    /* Chat window — square, bordered, hard shadow */
    "#__100x-chatbot-frame-wrapper {",
    "  position: fixed;",
    "  bottom: 92px;",
    "  right: 24px;",
    "  width: 380px;",
    "  height: 520px;",
    "  max-width: calc(100vw - 32px);",
    "  max-height: calc(100vh - 140px);",
    "  border-radius: 0;",
    "  overflow: hidden;",
    "  z-index: 2147483647;",
    "  opacity: 0;",
    "  transform: translateY(16px);",
    "  pointer-events: none;",
    "  transition: opacity 0.2s ease, transform 0.2s ease;",
    "  box-shadow: 8px 8px 0px 0px rgba(0,240,255,0.15);",
    "  border: 1px solid #132440;",
    "}",

    "#__100x-chatbot-frame-wrapper.open {",
    "  opacity: 1;",
    "  transform: translateY(0);",
    "  pointer-events: auto;",
    "}",

    "#__100x-chatbot-frame {",
    "  width: 100%;",
    "  height: 100%;",
    "  border: none;",
    "  border-radius: 0;",
    "  background: #030812;",
    "}",

    /* Mobile responsive — full-screen takeover */
    "@media (max-width: 640px) {",
    "  #__100x-chatbot-trigger {",
    "    bottom: 16px;",
    "    right: 16px;",
    "    width: 50px;",
    "    height: 50px;",
    "    box-shadow: 3px 3px 0px 0px #00f0ff;",
    "  }",
    "  #__100x-chatbot-trigger svg {",
    "    width: 22px;",
    "    height: 22px;",
    "  }",
    "  #__100x-chatbot-frame-wrapper {",
    "    bottom: 0;",
    "    right: 0;",
    "    left: 0;",
    "    top: 0;",
    "    width: 100%;",
    "    height: 100%;",
    "    max-width: 100%;",
    "    max-height: 100%;",
    "    border-radius: 0;",
    "    border: none;",
    "    box-shadow: none;",
    "  }",
    "  #__100x-chatbot-frame-wrapper.open ~ #__100x-chatbot-trigger {",
    "    display: none;",
    "  }",
    "}",

    /* Blinking animation for online dot */
    "@keyframes __100x-blink {",
    "  0%, 100% { opacity: 1; }",
    "  50% { opacity: 0; }",
    "}",
  ].join("\n");

  document.head.appendChild(style);

  /* ── Create Trigger Button ── */
  var trigger = document.createElement("button");
  trigger.id = "__100x-chatbot-trigger";
  trigger.setAttribute("aria-label", "Open chat");
  trigger.innerHTML = [
    '<span id="__100x-chatbot-badge">!</span>',
    '<svg class="chat-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">',
    '  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    "</svg>",
    '<svg class="close-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">',
    '  <path d="M18 6L6 18M6 6l12 12"/>',
    "</svg>",
  ].join("");
  document.body.appendChild(trigger);

  /* ── Create iframe wrapper ── */
  var wrapper = document.createElement("div");
  wrapper.id = "__100x-chatbot-frame-wrapper";

  var iframe = document.createElement("iframe");
  iframe.id = "__100x-chatbot-frame";
  iframe.title = "100x Chatbot";
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("allow", "clipboard-read; clipboard-write");

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);

  var pendingMessage = null;
  iframe.addEventListener("load", function () {
    if (pendingMessage && iframe.contentWindow) {
      iframe.contentWindow.postMessage(pendingMessage, "*");
      pendingMessage = null;
    }
  });

  /* ── API for host website to open chat programmatically ── */
  window.addEventListener("100x:open-chat", function (e) {
    var detail = e.detail || {};
    var msgObj = detail.message ? {
      type: "__100x_chatbot_open",
      message: detail.message,
      send: detail.send
    } : null;

    if (!isOpen) {
      isOpen = true;
      trigger.classList.add("open");
      trigger.setAttribute("aria-label", "Close chat");
      wrapper.classList.add("open");

      if (!iframe.src) {
        if (msgObj) pendingMessage = msgObj;
        iframe.src = WIDGET_PAGE_URL;
      } else {
        if (msgObj && iframe.contentWindow) {
          iframe.contentWindow.postMessage(msgObj, "*");
        }
      }
    } else {
      if (msgObj && iframe.contentWindow) {
        iframe.contentWindow.postMessage(msgObj, "*");
      }
    }
  });

  /* ── Toggle handler ── */
  trigger.addEventListener("click", function () {
    isOpen = !isOpen;

    if (isOpen) {
      trigger.classList.add("open");
      trigger.setAttribute("aria-label", "Close chat");
      wrapper.classList.add("open");

      /* Lazy-load iframe src on first open */
      if (!iframe.src) {
        iframe.src = WIDGET_PAGE_URL;
      }
    } else {
      trigger.classList.remove("open");
      trigger.setAttribute("aria-label", "Open chat");
      wrapper.classList.remove("open");
    }
  });

  /* ── Listen for close message from iframe ── */
  window.addEventListener("message", function (e) {
    if (e.data === "__100x_chatbot_close") {
      isOpen = false;
      trigger.classList.remove("open");
      trigger.setAttribute("aria-label", "Open chat");
      wrapper.classList.remove("open");
    }
  });
})();
