import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Briefcase, Code, Users as UsersIcon, Rocket, ArrowLeft, Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Video, StopCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import { streamChat, ChatMessage } from "@/lib/ai-stream";
import { speakText, stopTTS, onTTSAudioChange } from "@/lib/tts-player";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";
import { toast } from "sonner";
import { useChatHistory } from "@/hooks/useChatHistory";

type InterviewType = { id: string; label: string; icon: React.ElementType; prompt: string; color: string };

const interviewTypes: InterviewType[] = [
  { id: "hr", label: "HR Interview", icon: Briefcase, prompt: "You are conducting an HR interview. Ask one behavioral question at a time, wait for the answer, evaluate it with a score out of 10, give feedback, then ask the next question.", color: "from-blue-500 to-cyan-400" },
  { id: "technical", label: "Technical", icon: Code, prompt: "You are conducting a technical interview. Ask one programming/DSA question at a time, wait for the answer, evaluate it with a score out of 10, give feedback, then ask the next question.", color: "from-green-500 to-emerald-400" },
  { id: "behavioral", label: "Behavioral", icon: UsersIcon, prompt: "You are conducting a behavioral interview using the STAR method. Ask one question at a time, wait for the answer, evaluate using STAR framework, score out of 10, then ask next.", color: "from-purple-500 to-pink-400" },
  { id: "startup", label: "Startup", icon: Rocket, prompt: "You are conducting a startup interview about product thinking, growth, and entrepreneurship. Ask one question at a time, evaluate, score out of 10, then ask next.", color: "from-orange-500 to-red-400" },
];

type DisplayMessage = { id: string; role: "user" | "assistant"; content: string };

export default function InterviewPage() {
  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [micEnabled, setMicEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [avatarState, setAvatarState] = useState<"idle" | "speaking" | "listening" | "thinking">("idle");
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const mode = selectedType ? `interview-${selectedType.id}` : "interview-general";
  const characterId = character?.id || "naruto";
  const { messages: savedMessages, saveMessage, loaded } = useChatHistory(characterId, mode);

  // TTS audio tracking
  useEffect(() => {
    const unsub = onTTSAudioChange((audio) => {
      setTtsAudio(audio);
      setAvatarState(audio ? "speaking" : "idle");
    });
    return () => { unsub(); stopTTS(); };
  }, []);

  const startMic = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported."); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setInput(prev => (prev + " " + finalTranscript).trim());
    };
    recognition.onerror = (e: any) => { if (e.error !== "no-speech") toast.error("Mic error: " + e.error); };
    recognition.onend = () => { if (micEnabled) try { recognition.start(); } catch {} };
    recognitionRef.current = recognition;
    recognition.start();
    setMicEnabled(true);
    setIsRecording(true);
  }, [micEnabled]);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.onend = null; recognitionRef.current.stop(); recognitionRef.current = null; }
    setMicEnabled(false);
    setIsRecording(false);
  }, []);

  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraEnabled(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      mediaStreamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraEnabled(true);
      setCameraError("");
    } catch { setCameraError("Camera access denied."); setCameraEnabled(false); }
  }, []);

  // Video recording
  const startVideoRecording = useCallback(() => {
    if (!mediaStreamRef.current) { toast.error("Enable camera first"); return; }
    // Get audio stream too
    navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
      const combined = new MediaStream([...mediaStreamRef.current!.getTracks(), ...audioStream.getTracks()]);
      const recorder = new MediaRecorder(combined, { mimeType: "video/webm" });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Interview recording saved!");
        audioStream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
    }).catch(() => toast.error("Microphone access needed for recording"));
  }, []);

  const stopVideoRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecordingVideo(false);
  }, []);

  useEffect(() => { return () => { stopCamera(); stopMic(); stopTTS(); }; }, [stopCamera, stopMic]);

  useEffect(() => {
    if (!selectedType || !loaded) return;
    if (savedMessages.length > 0) { setMessages(savedMessages); return; }
    const welcomeMsg = `Welcome to **${selectedType.label} Practice**! 🎯\n\nI'm ${character?.name || "your mentor"} and I'll be your interviewer today.\n\n${cameraEnabled ? "📸 Camera is on — I can see you.\n\n" : ""}🎤 Use the mic button to speak your answers, or type them.\n\nSay **"Start"** when you're ready!`;
    setMessages([{ id: "start", role: "assistant", content: welcomeMsg }]);
  }, [selectedType, loaded, savedMessages]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const captureCameraFrame = () => {
    if (!cameraEnabled || !videoRef.current) return undefined;
    const v = videoRef.current;
    if (!v.videoWidth || !v.videoHeight) return undefined;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.7);
  };

  const startInterview = (type: InterviewType) => { setSelectedType(type); setMessages([]); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !input.trim() || isStreaming) return;
    stopTTS();

    const userMsg: DisplayMessage = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setAvatarState("listening");
    void saveMessage("user", userMsg.content);

    const cameraFrame = captureCameraFrame();
    const chatHistory: ChatMessage[] = newMessages.map(m => ({ role: m.role, content: m.content }));
    const contextualMessages: ChatMessage[] = [{ role: "user", content: selectedType.prompt }, ...chatHistory];

    let assistantContent = "";
    setTimeout(() => setAvatarState("thinking"), 300);

    await streamChat({
      messages: contextualMessages,
      mode: "interview",
      characterPersonality: character?.personality,
      cameraFrame,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-"))
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent }];
        });
      },
      onDone: () => {
        setIsStreaming(false);
        if (assistantContent) {
          void saveMessage("assistant", assistantContent);
          if (ttsEnabled) void speakText(assistantContent, character?.voiceId);
          else setAvatarState("idle");
        } else setAvatarState("idle");
      },
      onError: (error) => { setIsStreaming(false); setAvatarState("idle"); toast.error(error); },
    });
  };

  const answeredCount = messages.filter(m => m.role === "user").length;
  const progressPercent = Math.min(100, Math.round((answeredCount / 5) * 100));

  if (!selectedType) {
    return (
      <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Interview Practice</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            {character?.name || "Your mentor"} will interview you. Enable camera for visual feedback and mic to speak.
          </p>
          <div className="flex justify-center mb-6">
            {character && <AnimatedAvatar character={character} state="idle" size="md" />}
          </div>
          <div className="flex gap-3 justify-center mb-6">
            <button onClick={() => cameraEnabled ? stopCamera() : startCamera()}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${cameraEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
              {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              {cameraEnabled ? "Camera On" : "Enable Camera"}
            </button>
            <button onClick={() => micEnabled ? stopMic() : startMic()}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${micEnabled ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"}`}>
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {micEnabled ? "Mic On" : "Enable Mic"}
            </button>
          </div>
          {cameraEnabled && (
            <div className="surface-card p-2 mb-6 max-w-xs mx-auto">
              <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover rounded-lg bg-secondary" style={{ transform: "scaleX(-1)" }} />
            </div>
          )}
          {cameraError && <p className="text-xs text-destructive text-center mb-4">{cameraError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {interviewTypes.map((type, i) => (
              <motion.button key={type.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                onClick={() => startInterview(type)} className="surface-card p-6 text-left hover:border-primary/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">{type.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">Practice with AI feedback & voice</p>
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
        <button onClick={() => { setSelectedType(null); setMessages([]); stopCamera(); stopMic(); stopTTS(); }} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-shrink-0">
          {character && <AnimatedAvatar character={character} state={avatarState} size="sm" audioElement={ttsAudio} />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm truncate">{selectedType.label} — {character?.name || "XOVA"}</h1>
          <p className="text-xs text-muted-foreground">{answeredCount} answers · {progressPercent}% complete</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`p-1.5 rounded-lg text-xs transition-colors ${ttsEnabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => micEnabled ? stopMic() : startMic()} className={`p-1.5 rounded-lg text-xs transition-colors ${micEnabled ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"}`}>
            {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => cameraEnabled ? stopCamera() : startCamera()} className={`p-1.5 rounded-lg text-xs transition-colors ${cameraEnabled ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
            {cameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>
          {cameraEnabled && (
            <button onClick={() => isRecordingVideo ? stopVideoRecording() : startVideoRecording()}
              className={`p-1.5 rounded-lg text-xs transition-colors ${isRecordingVideo ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-foreground"}`}>
              {isRecordingVideo ? <StopCircle className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border bg-card/40">
        <div className="w-full h-1.5 bg-secondary rounded-full">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {cameraEnabled && (
          <div className="surface-card p-2 mb-3 max-w-sm mx-auto">
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover rounded-lg bg-secondary" style={{ transform: "scaleX(-1)" }} />
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              {isRecordingVideo ? "🔴 Recording..." : "Your camera — AI sees snapshots with each answer"}
            </p>
          </div>
        )}
        {!cameraEnabled && <video ref={videoRef} className="hidden" />}

        {isRecording && (
          <motion.div className="flex items-center justify-center gap-2 py-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Listening... speak your answer</span>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
              {msg.role === "assistant" && character && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 ring-1 ring-primary/20">
                  {character.image ? (
                    <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${character.color} flex items-center justify-center`}>
                      <span className="text-xs font-bold text-foreground">{character.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-[80%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "surface-card text-card-foreground rounded-bl-md"}`}>
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
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type or speak your answer..." disabled={isStreaming}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isStreaming} className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
