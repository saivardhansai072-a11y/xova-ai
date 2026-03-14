import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import MentorAvatar, { MentorState } from "@/components/MentorAvatar";
import { streamChat, ChatMessage } from "@/lib/ai-stream";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function MentorPage() {
  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [subtitle, setSubtitle] = useState("Tap the microphone or type to start a conversation with XOVA.");
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const speak = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~\[\]()>]/g, "");
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.95;
    u.pitch = 1.05;
    u.onstart = () => setMentorState("explaining");
    u.onend = () => setMentorState("idle");
    window.speechSynthesis.speak(u);
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setMentorState("idle");
      return;
    }

    setIsListening(true);
    setMentorState("listening");
    setSubtitle("Listening... speak now.");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      processInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setMentorState("idle");
      setSubtitle("Couldn't hear you. Try again or type your question.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processInput = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    setMentorState("thinking");
    setSubtitle("Thinking...");

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: text }];
    setChatHistory(newHistory);

    let response = "";

    await streamChat({
      messages: newHistory,
      onDelta: (chunk) => {
        response += chunk;
        setMentorState("explaining");
        setSubtitle(response);
      },
      onDone: () => {
        setIsProcessing(false);
        setChatHistory((prev) => [...prev, { role: "assistant", content: response }]);
        speak(response);
      },
      onError: (error) => {
        setIsProcessing(false);
        setMentorState("idle");
        setSubtitle("Sorry, something went wrong. Please try again.");
        toast.error(error);
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      processInput(inputText.trim());
      setInputText("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 md:pt-16">
      <div className="max-w-lg w-full flex flex-col items-center text-center">
        {/* Mentor Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <MentorAvatar state={mentorState} size="lg" />
        </motion.div>

        {/* State indicator */}
        <div className="mt-4 flex items-center gap-2">
          {(["idle", "listening", "thinking", "explaining", "celebrating"] as MentorState[]).map((s) => (
            <motion.div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                mentorState === s ? "bg-primary" : "bg-muted"
              }`}
              animate={mentorState === s ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{mentorState}</p>

        {/* Subtitle / Response */}
        <motion.div
          key={subtitle.slice(0, 50)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 surface-card p-5 w-full max-h-60 overflow-y-auto text-left"
        >
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
            <ReactMarkdown>{subtitle}</ReactMarkdown>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled) window.speechSynthesis?.cancel();
            }}
            className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`p-5 rounded-full transition-all ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
            } disabled:opacity-40`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="w-11" /> {/* Spacer */}
        </div>

        {/* Text input fallback */}
        <form onSubmit={handleSubmit} className="mt-4 w-full flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or type your question here..."
            disabled={isProcessing}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
