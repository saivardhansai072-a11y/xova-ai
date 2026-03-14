import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Volume2, VolumeX } from "lucide-react";
import MentorAvatar, { MentorState } from "@/components/MentorAvatar";

type Message = { id: string; role: "user" | "mentor"; text: string };

const mentorResponses = [
  "That's a great question! Let me break it down for you. The key concept here is understanding the relationship between the variables involved.",
  "Excellent thinking! You're on the right track. Consider how this principle applies in different scenarios.",
  "Let me explain this step by step. First, we need to understand the foundation, then we can build upon it.",
  "I appreciate your curiosity! This topic connects to several important ideas. Let's explore them together.",
  "Good observation! Many students find this challenging at first. The trick is to visualize the problem differently.",
  "You're making great progress! Let's try approaching this from another angle to deepen your understanding.",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "mentor", text: "Hello! I'm XOVA, your AI mentor. Ask me anything and I'll help you learn. What topic would you like to explore today?" },
  ]);
  const [input, setInput] = useState("");
  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }, [ttsEnabled]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setMentorState("listening");

    setTimeout(() => {
      setMentorState("thinking");
      setTimeout(() => {
        const response = mentorResponses[Math.floor(Math.random() * mentorResponses.length)];
        const mentorMsg: Message = { id: (Date.now() + 1).toString(), role: "mentor", text: response };
        setMentorState("explaining");
        setMessages((prev) => [...prev, mentorMsg]);
        speak(response);
        setTimeout(() => setMentorState("idle"), 3000);
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen md:pt-14 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <MentorAvatar state={mentorState} size="sm" />
          <div>
            <h2 className="font-semibold text-foreground text-sm">XOVA Mentor</h2>
            <p className="text-xs text-muted-foreground capitalize">{mentorState === "idle" ? "Online" : mentorState}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setTtsEnabled(!ttsEnabled);
            if (ttsEnabled) window.speechSynthesis?.cancel();
          }}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "surface-card text-card-foreground rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {mentorState === "thinking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="surface-card px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-muted-foreground"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-card/50 backdrop-blur-md">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask XOVA anything..."
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
