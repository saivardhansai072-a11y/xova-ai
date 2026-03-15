import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { AICharacter } from "@/lib/characters";

interface Character3DProps {
  character: AICharacter;
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
  audioLevel?: number;
}

export default function Character3D({
  character,
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  size = "md",
  audioLevel = 0,
}: Character3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 100, damping: 20 });

  const sizes = { sm: 120, md: 180, lg: 260 };
  const s = sizes[size];

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(() => {
      blink();
      // Sometimes double blink
      if (Math.random() > 0.7) setTimeout(blink, 300);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  // Mouth sync with speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen(audioLevel > 0 ? audioLevel : Math.random() * 0.8 + 0.2);
    }, 80);
    return () => clearInterval(interval);
  }, [isSpeaking, audioLevel]);

  // Idle bobbing animation
  const [idleY, setIdleY] = useState(0);
  useEffect(() => {
    if (isDragging) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.02;
      setIdleY(Math.sin(t) * 3);
      if (!isThinking) {
        rotateY.set(Math.sin(t * 0.5) * 3);
        rotateX.set(Math.cos(t * 0.7) * 2);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, isThinking]);

  // Mouse/touch drag for rotation
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startRotY = rotateY.get();
    const startRotX = rotateX.get();

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      rotateY.set(startRotY + dx * 0.5);
      rotateX.set(Math.max(-30, Math.min(30, startRotX - dy * 0.5)));
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      // Spring back gently
      rotateY.set(0);
      rotateX.set(0);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, []);

  const glowIntensity = isSpeaking ? 0.6 : isListening ? 0.4 : isThinking ? 0.3 : 0.15;
  const emotionEmoji = isThinking ? "🤔" : isSpeaking ? "💬" : isListening ? "👂" : "";

  return (
    <div
      ref={containerRef}
      className="relative select-none cursor-grab active:cursor-grabbing"
      style={{ width: s, height: s + 40, perspective: 800 }}
      onPointerDown={handlePointerDown}
    >
      {/* Glow ring */}
      <motion.div
        className={`absolute rounded-full bg-gradient-to-br ${character.color}`}
        style={{
          width: s + 20,
          height: s + 20,
          left: -10,
          top: -10,
          filter: `blur(${s / 4}px)`,
        }}
        animate={{ opacity: [glowIntensity, glowIntensity + 0.15, glowIntensity], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main character container */}
      <motion.div
        className="relative w-full rounded-full overflow-hidden"
        style={{
          height: s,
          rotateX: springX,
          rotateY: springY,
          y: idleY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Character image */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden ring-4 ring-primary/20"
          style={{ boxShadow: `0 0 60px -10px ${character.glowColor}, 0 20px 40px -20px rgba(0,0,0,0.5)` }}
        >
          {character.image ? (
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${character.color} flex items-center justify-center`}>
              <span className="text-4xl font-bold text-foreground">{character.name.charAt(0)}</span>
            </div>
          )}

          {/* 3D lighting overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${135}deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)`,
            }}
            animate={{
              background: isDragging
                ? undefined
                : [
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
                    "linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)",
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
                  ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Eyes overlay - blink animation */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: s * 0.5, marginTop: -s * 0.08 }}>
              {/* Left eye */}
              <motion.div
                className="absolute bg-background/80 rounded-full"
                style={{
                  width: s * 0.08,
                  left: s * 0.08,
                  top: 0,
                }}
                animate={{
                  height: isBlinking ? 1 : s * 0.08,
                  opacity: isBlinking ? 0.8 : 0,
                }}
                transition={{ duration: 0.08 }}
              />
              {/* Right eye */}
              <motion.div
                className="absolute bg-background/80 rounded-full"
                style={{
                  width: s * 0.08,
                  right: s * 0.08,
                  top: 0,
                }}
                animate={{
                  height: isBlinking ? 1 : s * 0.08,
                  opacity: isBlinking ? 0.8 : 0,
                }}
                transition={{ duration: 0.08 }}
              />
            </div>
          </div>

          {/* Mouth animation overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: s * 0.18 }}>
              <motion.div
                className="bg-background/30 rounded-full"
                animate={{
                  width: [s * 0.06, s * 0.12 * (mouthOpen + 0.3), s * 0.06],
                  height: [s * 0.03, s * 0.08 * (mouthOpen + 0.2), s * 0.03],
                }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>

        {/* Thinking dots */}
        {isThinking && (
          <div className="absolute -right-2 top-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}

        {/* Listening pulse rings */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </motion.div>

      {/* Floating particles */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r ${character.color}`}
          animate={{
            y: [-10, -30 - i * 10, -10],
            x: [(i - 1.5) * 10, (i - 1.5) * 20, (i - 1.5) * 10],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.6 }}
          style={{ top: s * 0.3 + i * 15, left: s * 0.2 + i * 25 }}
        />
      ))}

      {/* State label */}
      {emotionEmoji && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 text-lg"
        >
          {emotionEmoji}
        </motion.div>
      )}

      {/* Name label */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-xs font-semibold text-foreground bg-card/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border">
          {character.name}
        </span>
      </motion.div>
    </div>
  );
}
