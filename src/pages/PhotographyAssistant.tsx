import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { trackEvent } from "../lib/analytics";
import "./photography-assistant.css";

type ChatMessage = {
  id: number;
  from: "visitor" | "studio";
  text: string;
};

export const whatsappUrl = (message: string) =>
  `https://wa.me/919885037928?text=${encodeURIComponent(message)}`;

function getAnswer(question: string) {
  const query = question.toLowerCase();

  if (/price|pricing|cost|package|budget|rate/.test(query)) {
    return "Pricing depends on your event plans and the coverage you need. Saleem can share a suitable quote once he knows a little about your celebration.";
  }
  if (/available|availability|date|book|booking/.test(query)) {
    return "To check a date, send Saleem your event date, event type, and venue. He can confirm availability directly.";
  }
  if (/where|location|hyderabad|travel|area|city/.test(query)) {
    return "Style Studio is based in Hyderabad and covers weddings, press assignments, corporate events, launches, and other events. Ask Saleem directly about your venue.";
  }
  if (/press|media|conference|launch|brand|corporate|promotion|promotional|business|product/.test(query)) {
    return "Yes. Style Studio covers press conferences, media briefings, interviews, product and brand launches, corporate events, and promotional assignments in Hyderabad. Saleem is a Press Club member and holds press accreditation; event access should be confirmed with the organiser.";
  }
  if (/wedding|marriage|ceremony|engagement|reception/.test(query)) {
    return "Style Studio welcomes weddings across all faiths and traditions, including Hindu, Muslim, Christian, Sikh, Buddhist, Jewish, Jain, interfaith, and other ceremonies. Share what you’re planning so Saleem can discuss the coverage with you.";
  }
  if (/birthday|party|anniversary|family|celebration|event/.test(query)) {
    return "Style Studio covers birthdays, anniversaries, family gatherings, cultural celebrations, press assignments, corporate events, and launches. Share what you’re planning so Saleem can discuss the coverage with you.";
  }
  if (/contact|call|phone|whatsapp|talk|person/.test(query)) {
    return "You can call or WhatsApp Saleem at +91 98850 37928.";
  }

  return "I can help with services, Hyderabad coverage, pricing, and checking a date. For a personal answer, message Saleem directly on WhatsApp.";
}

export function PhotographyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      from: "studio",
      text: "Hello! I’m Style Studio’s quick guide. Ask about weddings across faiths, birthdays, press coverage, brand events, Hyderabad service, pricing, or checking a date.",
    },
  ]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages, prefersReducedMotion]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), from: "visitor", text: trimmed },
      { id: Date.now() + 1, from: "studio", text: getAnswer(trimmed) },
    ]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  return (
    <div className="photo-assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="photo-chat-panel"
            aria-label="Style Studio quick guide"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <header className="photo-chat-header">
              <div className="photo-chat-avatar" aria-hidden="true">S</div>
              <div>
                <h2>Style Studio</h2>
                <p>Quick guide · Hyderabad</p>
              </div>
              <button
                className="photo-chat-close"
                type="button"
                aria-label="Close chat"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="photo-chat-disclaimer">
              Instant guided replies. Saleem will personally confirm services, dates, and event access.
            </div>

            <div className="photo-chat-messages" aria-live="polite">
              {messages.map((message) => (
                <p
                  className={`photo-chat-message is-${message.from}`}
                  key={message.id}
                >
                  {message.text}
                </p>
              ))}
              <div ref={messageEndRef} />
            </div>

            <div className="photo-chat-suggestions" aria-label="Suggested questions">
              {["Do you cover birthdays?", "Do you cover press events?", "How do I check a date?"].map(
                (question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ),
              )}
            </div>

            <form className="photo-chat-form" onSubmit={handleSubmit}>
              <label className="photo-sr-only" htmlFor="photo-chat-input">Ask Style Studio</label>
              <input
                id="photo-chat-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your question..."
                autoComplete="off"
              />
              <button type="submit" disabled={!draft.trim()} aria-label="Send message">
                ↑
              </button>
            </form>

            <a
              className="photo-chat-whatsapp"
              onClick={() => trackEvent("contact_whatsapp", { source: "chat_assistant" })}
              href={whatsappUrl("Hello Saleem, I found Style Studio through your website and would like to enquire about photography.")}
              target="_blank"
              rel="noreferrer"
            >
              Continue on WhatsApp <span aria-hidden="true">↗</span>
            </a>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        className={`photo-chat-launcher${isOpen ? " is-open" : ""}`}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close Style Studio guide" : "Chat with Style Studio"}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <span aria-hidden="true">×</span> : <><span className="photo-chat-launcher-icon" aria-hidden="true">✦</span><span>Ask us</span></>}
      </button>
    </div>
  );
}
