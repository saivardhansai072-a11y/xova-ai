import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Users } from "lucide-react";
import Character3D from "@/components/Character3D";
import MentorAvatar, { MentorState } from "@/components/MentorAvatar";
import { streamChat, ChatMessage, speakWithElevenLabs, browserSpeak } from "@/lib/ai-stream";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function MentorPage() {
  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [subtitle, setSubtitle] = useState(
    character?.greeting || "Tap the microphone or type to start a conversation with your mentor."
  );
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const speak = async (text: string) => {
    if (!ttsEnabled) return;
    setMentorState("explaining");
    try {
      await speakWithElevenLabs(text);
    } catch {
      browserSpeak(text);
    }
    setMentorState("idle");
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported. Please type your question.");
      return;
    }
    if (isListening) { setIsListening(false); setMentorState("idle"); return; }
    setIsListening(true);
    setMentorState("listening");
    setSubtitle("Listening... speak now.");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => { setIsListening(false); processInput(event.results[0][0].transcript); };
    recognition.onerror = () => { setIsListening(false); setMentorState("idle"); setSubtitle("Couldn't hear you. Try again."); };
    recognition.onend = () => setIsListening(false);
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
      characterPersonality: character?.personality,
      onDelta: (chunk) => { response += chunk; setMentorState("explaining"); setSubtitle(response); },
      onDone: () => { setIsProcessing(false); setChatHistory((prev) => [...prev, { role: "assistant", content: response }]); speak(response); },
      onError: (error) => { setIsProcessing(false); setMentorState("idle"); setSubtitle("Sorry, something went wrong."); toast.error(error); },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) { processInput(inputText.trim()); setInputText(""); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 md:pt-16">
      <div className="max-w-lg w-full flex flex-col items-center text-center">
        {/* 3D Character */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {character ? (
            <Character3D
              character={character}
              isSpeaking={mentorState === "explaining"}
              isListening={mentorState === "listening"}
              isThinking={mentorState === "thinking"}
              size="lg"
            />
          ) : (
            <MentorAvatar state={mentorState} size="lg" />
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground mt-2">{character?.anime || "AI Mentor"}</p>

        {/* State indicator */}
        <div className="mt-2 flex items-center gap-2">
          {(["idle", "listening", "thinking", "explaining", "celebrating"] as MentorState[]).map((s) => (
            <motion.div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${mentorState === s ? "bg-primary" : "bg-muted"}`}
              animate={mentorState === s ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 capitalize">{mentorState}</p>

        {/* Response */}
        <motion.div
          key={subtitle.slice(0, 50)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 surface-card p-5 w-full max-h-60 overflow-y-auto text-left"
        >
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
            <ReactMarkdown>{subtitle}</ReactMarkdown>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="mt-5 flex items-center gap-4">
          <button onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) window.speechSynthesis?.cancel(); }} className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={toggleListening} disabled={isProcessing} className={`p-5 rounded-full transition-all ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"} disabled:opacity-40`}>
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <Link to="/characters" className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Users className="w-5 h-5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 w-full flex gap-2">
          <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={`Ask ${character?.name || "XOVA"}...`} disabled={isProcessing} className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50" />
          <button type="submit" disabled={!inputText.trim() || isProcessing} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">Ask</button>
        </form>

        <p className="text-[10px] text-muted-foreground mt-3">Drag the character to rotate · Voice powered by ElevenLabs</p>
      </div>
    </div>
  );
}
