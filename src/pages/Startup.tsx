import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Rocket, Lightbulb, TrendingUp, Target, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { streamChat, ChatMessage } from "@/lib/ai-stream";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";
import { toast } from "sonner";

type StartupTopic = { id: string; label: string; icon: React.ElementType; starter: string; color: string };

const startupTopics: StartupTopic[] = [
  { id: "idea", label: "Validate My Idea", icon: Lightbulb, starter: "I have a startup idea. Help me validate it by asking me key questions about the problem, target audience, and market.", color: "from-yellow-500 to-orange-400" },
  { id: "mvp", label: "Build an MVP", icon: Target, starter: "Guide me on how to build a Minimum Viable Product. What should I focus on and what to skip?", color: "from-blue-500 to-cyan-400" },
  { id: "growth", label: "Growth Strategy", icon: TrendingUp, starter: "Help me create a growth strategy for my startup. What are the best channels and tactics?", color: "from-green-500 to-emerald-400" },
  { id: "pitch", label: "Pitch Deck Help", icon: Rocket, starter: "Help me create a compelling pitch deck. What slides do I need and what should each contain?", color: "from-purple-500 to-pink-400" },
];

type DisplayMessage = { id: string; role: "user" | "assistant"; content: string };

export default function StartupPage() {
  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const startTopic = async (topic: StartupTopic) => {
    setStarted(true);
    const userMsg: DisplayMessage = { id: "user-start", role: "user", content: topic.starter };
    setMessages([userMsg]);
    setIsStreaming(true);

    let assistantContent = "";
    await streamChat({
      messages: [{ role: "user", content: topic.starter }],
      mode: "startup",
      characterPersonality: character?.personality,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => { setIsStreaming(false); toast.error(error); },
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: DisplayMessage = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const chatHistory: ChatMessage[] = newMessages.map((m) => ({ role: m.role, content: m.content }));
    let assistantContent = "";

    await streamChat({
      messages: chatHistory,
      mode: "startup",
      characterPersonality: character?.personality,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => { setIsStreaming(false); toast.error(error); },
    });
  };

  if (!started) {
    return (
      <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Startup Mentor</h1>
          </div>
          <p className="text-muted-foreground mb-8">Get AI-powered guidance for your startup journey.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {startupTopics.map((topic, i) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => startTopic(topic)}
                className="surface-card p-6 text-left hover:border-primary/30 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-3`}>
                  <topic.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">{topic.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">AI-powered guidance</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen md:pt-14 pb-20 md:pb-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md">
        <button onClick={() => { setStarted(false); setMessages([]); }} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-semibold text-foreground text-sm">Startup Mentor</h1>
          <p className="text-xs text-muted-foreground">With {character?.name || "XOVA"}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "surface-card text-card-foreground rounded-bl-md"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&_strong]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-card/50 backdrop-blur-md">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your startup..." disabled={isStreaming} className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isStreaming} className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
