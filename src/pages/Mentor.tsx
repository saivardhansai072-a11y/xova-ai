import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Users, Box, CircleDot } from "lucide-react";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import { streamChat, ChatMessage } from "@/lib/ai-stream";
import { speakText, stopTTS, onTTSAudioChange } from "@/lib/tts-player";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Avatar3D = lazy(() => import("@/components/Avatar3D"));

export default function MentorPage() {
  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [avatarState, setAvatarState] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [subtitle, setSubtitle] = useState(character?.greeting || "Tap the microphone or type to start a conversation with your mentor.");
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = onTTSAudioChange((audio) => {
      setTtsAudio(audio);
      setAvatarState(audio ? "speaking" : "idle");
    });
    return () => { unsub(); stopTTS(); };
  }, []);

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported."); return; }
    if (isListening) { setIsListening(false); setAvatarState("idle"); return; }

    setIsListening(true);
    setAvatarState("listening");
    setSubtitle("Listening... speak now.");

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => { setIsListening(false); processInput(e.results[0][0].transcript); };
    recognition.onerror = () => { setIsListening(false); setAvatarState("idle"); setSubtitle("Couldn't hear you. Try again."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const processInput = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    stopTTS();
    setIsProcessing(true);
    setAvatarState("thinking");
    setSubtitle("Thinking...");

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: text }];
    setChatHistory(newHistory);
    let response = "";

    await streamChat({
      messages: newHistory,
      characterPersonality: character?.personality,
      onDelta: (chunk) => { response += chunk; setSubtitle(response); },
      onDone: () => {
        setIsProcessing(false);
        setChatHistory((prev) => [...prev, { role: "assistant", content: response }]);
        if (ttsEnabled && response) void speakText(response, character?.voiceId);
        else setAvatarState("idle");
      },
      onError: (error) => {
        setIsProcessing(false);
        setAvatarState("idle");
        setSubtitle("Sorry, something went wrong.");
        toast.error(error);
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) { processInput(inputText.trim()); setInputText(""); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 md:pt-16">
      <div className="max-w-lg w-full flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          {character && (
            <AnimatedAvatar character={character} state={avatarState} size="lg" audioElement={ttsAudio} />
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground mt-2">{character?.anime || "AI Mentor"}</p>

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

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={() => { setTtsEnabled(!ttsEnabled); if (ttsEnabled) stopTTS(); }}
            className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`p-5 rounded-full transition-all ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground hover:opacity-90"} disabled:opacity-40`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <Link to="/characters" className="p-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Users className="w-5 h-5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 w-full flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${character?.name || "XOVA"}...`}
            disabled={isProcessing}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
          />
          <button type="submit" disabled={!inputText.trim() || isProcessing} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
