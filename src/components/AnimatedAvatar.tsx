import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AICharacter } from "@/lib/characters";

type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

interface AnimatedAvatarProps {
  character: AICharacter;
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

export default function AnimatedAvatar({
  character,
  state = "idle",
  size = "md",
  audioElement,
}: AnimatedAvatarProps) {
  const [blinkState, setBlinkState] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [eyeEmotion, setEyeEmotion] = useState<"normal" | "happy" | "surprised" | "focused">("normal");
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);

  const sizes = { sm: 80, md: 140, lg: 200 };
  const s = sizes[size];

  // Blinking
  useEffect(() => {
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    };
    const interval = setInterval(() => {
      blink();
      // Double blink sometimes
      if (Math.random() > 0.7) setTimeout(blink, 300);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Emotion based on state
  useEffect(() => {
    switch (state) {
      case "speaking": setEyeEmotion("normal"); break;
      case "listening": setEyeEmotion("focused"); break;
      case "thinking": setEyeEmotion("focused"); break;
      case "celebrating": setEyeEmotion("happy"); break;
      default: setEyeEmotion("normal");
    }
  }, [state]);

  // Audio analysis for mouth sync
  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // Each HTMLAudioElement can only have one MediaElementSource — recreate when element changes
      if (lastAudioRef.current !== audio) {
        if (sourceRef.current) {
          try { sourceRef.current.disconnect(); } catch {}
        }
        sourceRef.current = ctx.createMediaElementSource(audio);
        lastAudioRef.current = audio;
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;

      sourceRef.current.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        // Focus on speech frequencies (300-3000Hz range, roughly bins 5-40 for 256 fft at 44.1kHz)
        let sum = 0;
        const start = 4, end = 30;
        for (let i = start; i < end; i++) sum += data[i];
        const avg = sum / (end - start);
        const normalized = Math.min(1, avg / 140);
        setMouthOpen(normalized);
        animFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      // Fallback: simulate mouth movement
    }
  }, []);

  useEffect(() => {
    if (!audioElement) {
      setMouthOpen(0);
      return;
    }
    connectAudio(audioElement);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch {}
        analyserRef.current = null;
      }
    };
  }, [audioElement, connectAudio]);

  // Simulated mouth when speaking without audio element
  useEffect(() => {
    if (state !== "speaking" || audioElement) return;
    const interval = setInterval(() => {
      setMouthOpen(0.2 + Math.random() * 0.6);
    }, 100);
    return () => { clearInterval(interval); setMouthOpen(0); };
  }, [state, audioElement]);

  const eyeHeight = blinkState ? 1 : (eyeEmotion === "happy" ? 8 : eyeEmotion === "surprised" ? 14 : 10);
  const eyeWidth = eyeEmotion === "surprised" ? 12 : 10;
  const eyeRadius = eyeEmotion === "happy" ? "50% 50% 0 0" : "50%";

  // Mouth shape
  const mouthHeight = 2 + mouthOpen * 14;
  const mouthWidth = 12 + mouthOpen * 8;
  const mouthRadius = mouthOpen > 0.3 ? "50%" : "0 0 50% 50%";

  return (
    <div className="relative flex flex-col items-center" style={{ width: s + 40 }}>
      {/* Glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s + 30, height: s + 30,
          left: "50%", top: s / 2,
          x: "-50%", y: "-50%",
          background: `radial-gradient(circle, ${character.glowColor} 0%, transparent 70%)`,
          filter: `blur(${s / 6}px)`,
        }}
        animate={{
          opacity: state === "speaking" ? [0.5, 0.9, 0.5] : state === "celebrating" ? [0.6, 1, 0.6] : [0.2, 0.4, 0.2],
          scale: state === "speaking" ? [1, 1.15, 1] : [1, 1.05, 1],
        }}
        transition={{ duration: state === "speaking" ? 0.6 : 2, repeat: Infinity }}
      />

      {/* Pulse rings for listening */}
      {state === "listening" && [0, 1].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-primary/30 pointer-events-none"
          style={{ width: s + 20, height: s + 20, left: "50%", top: s / 2, x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.4 + i * 0.15], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}

      {/* Character container */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{ width: s, height: s }}
        animate={{
          y: state === "speaking" ? [0, -3, 0] : state === "celebrating" ? [0, -8, 0] : state === "listening" ? [0, -4, 0] : [0, -2, 0],
          scale: state === "celebrating" ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: state === "celebrating" ? 0.5 : 2.5, repeat: Infinity }}
      >
        {/* Ring border */}
        <motion.div
          className="absolute inset-0 rounded-full z-10 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 3px ${character.glowColor}, 0 0 25px -5px ${character.glowColor}` }}
          animate={{ opacity: state === "speaking" ? [0.6, 1, 0.6] : [0.4, 0.7, 0.4] }}
          transition={{ duration: state === "speaking" ? 0.5 : 2, repeat: Infinity }}
        />

        {/* Character image */}
        {character.image ? (
          <img src={character.image} alt={character.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${character.color} flex items-center justify-center`}>
            <span className="text-4xl font-bold text-foreground">{character.name.charAt(0)}</span>
          </div>
        )}

        {/* Face overlay - eyes and mouth */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none z-20">
          {/* Eyes */}
          <div className="flex gap-[18%] mb-[8%]" style={{ marginBottom: `${s * 0.28}px` }}>
            {[0, 1].map(i => (
              <motion.div
                key={i}
                style={{
                  width: eyeWidth,
                  height: eyeHeight,
                  borderRadius: eyeRadius,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                }}
                animate={state === "thinking" ? { x: [0, i === 0 ? -2 : 2, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ))}
          </div>

          {/* Mouth */}
          <motion.div
            style={{
              width: mouthWidth,
              height: mouthHeight,
              borderRadius: mouthRadius,
              backgroundColor: state === "speaking" || mouthOpen > 0.1 ? "rgba(180,50,50,0.85)" : "rgba(180,50,50,0.6)",
              marginBottom: `${s * 0.12}px`,
              boxShadow: mouthOpen > 0.3 ? "inset 0 2px 4px rgba(0,0,0,0.3)" : "none",
            }}
            transition={{ duration: 0.05 }}
          />
        </div>

        {/* Celebrating sparkles */}
        {state === "celebrating" && (
          <>
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="absolute text-yellow-400 text-xs pointer-events-none z-30"
                style={{
                  left: `${15 + i * 17}%`,
                  top: `${10 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              >
                ✨
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* Thinking dots */}
      {state === "thinking" && (
        <div className="absolute -right-1 top-1 flex gap-1 z-20">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* Audio level bars when speaking */}
      {state === "speaking" && (
        <div className="flex gap-[2px] mt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 3, backgroundColor: character.glowColor }}
              animate={{
                height: [3, 4 + mouthOpen * 14 + Math.random() * 4, 3],
              }}
              transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.04 }}
            />
          ))}
        </div>
      )}

      {/* Name badge */}
      <motion.div className="mt-1.5 text-center" animate={{ y: [0, -1, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <span className="text-xs font-semibold text-foreground bg-card/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-border">
          {character.name}
          {state !== "idle" && (
            <span className="ml-1 text-[10px]">
              {state === "speaking" ? "🗣️" : state === "listening" ? "👂" : state === "thinking" ? "💭" : state === "celebrating" ? "🎉" : ""}
            </span>
          )}
        </span>
      </motion.div>
    </div>
  );
}
