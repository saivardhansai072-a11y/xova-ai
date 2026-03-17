import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Volume2, VolumeX, Trash2, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { MentorState } from "@/components/MentorAvatar";
import { streamChat, ChatMessage, speakWithElevenLabs, browserSpeak } from "@/lib/ai-stream";
import { getSelectedCharacterId, getCharacterById, AICharacter } from "@/lib/characters";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useChatHistory } from "@/hooks/useChatHistory";

type DisplayMessage = { id: string; role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const character = useMemo<AICharacter | undefined>(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const characterId = character?.id || "naruto";
  const { messages: savedMessages, saveMessage, clearHistory, loaded } = useChatHistory(characterId, "chat");

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [isStreaming, setIsStreaming] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) return;

    if (savedMessages.length > 0) {
      setMessages(savedMessages);
      return;
    }

    setMessages([{
      id: "welcome",
      role: "assistant",
      content: character?.greeting || "Hello! I'm XOVA. What would you like to learn today?",
    }]);
  }, [loaded, savedMessages, character?.greeting]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled || !text.trim()) return;

    setMentorState("explaining");
    try {
      await speakWithElevenLabs(text, character?.voiceId);
    } catch {
      browserSpeak(text);
    } finally {
      setMentorState("idle");
    }
  }, [ttsEnabled, character?.voiceId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: DisplayMessage = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setMentorState("listening");

    void saveMessage("user", userMsg.content);

    const chatHistory: ChatMessage[] = newMessages.map((m) => ({ role: m.role, content: m.content }));
    let assistantContent = "";

    setTimeout(() => setMentorState("thinking"), 400);

    await streamChat({
      messages: chatHistory,
      characterPersonality: character?.personality,
      onDelta: (chunk) => {
        setMentorState("explaining");
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => {
        setIsStreaming(false);
        if (assistantContent) {
          void speak(assistantContent);
          void saveMessage("assistant", assistantContent);
        } else {
          setMentorState("idle");
        }
      },
      onError: (error) => {
        setIsStreaming(false);
        setMentorState("idle");
        toast.error(error);
      },
    });
  };

  const clearChat = async () => {
    await clearHistory();
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: character?.greeting || "Chat cleared! What would you like to learn?",
    }]);
  };

  return (
    <div className="flex flex-col h-screen md:pt-14 pb-20 md:pb-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 flex-shrink-0">
            {character?.image ? (
              <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${character?.color || "from-primary to-accent"} flex items-center justify-center`}>
                <span className="text-sm font-bold text-foreground">{character?.name?.charAt(0) || "X"}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">{character?.name || "XOVA"}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {isStreaming ? mentorState : "Online"} · {character?.anime || "AI Mentor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/characters" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Switch character">
            <Users className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) window.speechSynthesis?.cancel();
            }}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={clearChat} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

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
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                  {character?.image ? (
                    <img src={character.image} alt="AI avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${character?.color || "from-primary to-accent"} flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-foreground">{character?.name?.charAt(0) || "X"}</span>
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "surface-card text-card-foreground rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&_strong]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded [&_pre]:bg-secondary [&_pre]:p-3 [&_pre]:rounded-lg">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && mentorState === "thinking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-7 h-7 mr-2 flex-shrink-0" />
            <div className="surface-card px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-card/50 backdrop-blur-md">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${character?.name || "XOVA"} anything...`}
            disabled={isStreaming}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || isStreaming} className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
