import { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
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
  const [isDragging, setIsDragging] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 110, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 110, damping: 20 });

  const sizes = { sm: 100, md: 160, lg: 220 };
  const s = sizes[size];

  // Idle floating animation
  useEffect(() => {
    if (isDragging) return;
    let frame = 0;
    let t = 0;
    const animate = () => {
      t += 0.016;
      rotateY.set(Math.sin(t * 0.8) * 4);
      rotateX.set(Math.cos(t * 0.6) * 2.5);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, rotateX, rotateY]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startRotY = rotateY.get();
    const startRotX = rotateX.get();
    const handleMove = (ev: PointerEvent) => {
      rotateY.set(startRotY + (ev.clientX - startX) * 0.48);
      rotateX.set(Math.max(-28, Math.min(28, startRotX - (ev.clientY - startY) * 0.48)));
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      rotateY.set(0);
      rotateX.set(0);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [rotateX, rotateY]);

  const state = isSpeaking ? "speaking" : isListening ? "listening" : isThinking ? "thinking" : "idle";

  return (
    <div
      className="relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center"
      style={{ width: s + 40, perspective: 900 }}
      onPointerDown={handlePointerDown}
    >
      {/* Glow background */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: s + 30,
          height: s + 30,
          left: "50%",
          top: s / 2 - 15,
          x: "-50%",
          y: "-50%",
          background: `radial-gradient(circle, ${character.glowColor} 0%, transparent 70%)`,
          filter: `blur(${s / 5}px)`,
        }}
        animate={{
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : isListening ? [0.3, 0.55, 0.3] : isThinking ? [0.3, 0.5, 0.3] : [0.2, 0.35, 0.2],
          scale: isSpeaking ? [1, 1.12, 1] : isThinking ? [1, 1.08, 1] : [1, 1.04, 1],
        }}
        transition={{ duration: isSpeaking ? 0.8 : 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Listening pulse rings */}
      {isListening && (
        <>
          <motion.div
            className="absolute rounded-full border-2 border-primary/40"
            style={{ width: s + 20, height: s + 20, left: "50%", top: s / 2, x: "-50%", y: "-50%" }}
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full border-2 border-primary/25"
            style={{ width: s + 20, height: s + 20, left: "50%", top: s / 2, x: "-50%", y: "-50%" }}
            animate={{ scale: [1, 1.5], opacity: [0.35, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
          />
        </>
      )}

      {/* Main character image with 3D rotation */}
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: s,
          height: s,
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: isListening ? [0, -5, 0] : isSpeaking ? [0, -3, 0] : [0, -2, 0],
          scale: isSpeaking ? [1, 1.03, 1] : 1,
          rotateZ: isThinking ? [0, -2, 2, 0] : 0,
        }}
        transition={{ duration: isThinking ? 1.2 : 2.6, repeat: Infinity }}
      >
        {/* Ring border */}
        <motion.div
          className="absolute inset-0 rounded-full z-10 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 3px ${character.glowColor}, 0 0 30px -5px ${character.glowColor}`,
          }}
          animate={{
            opacity: isSpeaking ? [0.7, 1, 0.7] : [0.5, 0.7, 0.5],
          }}
          transition={{ duration: isSpeaking ? 0.4 : 2, repeat: Infinity }}
        />

        {/* Character image */}
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

        {/* Subtle lighting overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background: "linear-gradient(145deg, hsl(var(--foreground) / 0.08) 0%, transparent 50%, hsl(var(--background) / 0.25) 100%)",
          }}
        />

        {/* Speaking mouth indicator bar at bottom */}
        {isSpeaking && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-[2px] pb-2 z-20">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 3,
                  backgroundColor: character.glowColor,
                }}
                animate={{
                  height: [4, 8 + (audioLevel > 0 ? audioLevel * 12 : Math.random() * 10), 4],
                }}
                transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -right-1 top-1 flex gap-1 z-20">
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

      {/* Character name + state */}
      <motion.div
        className="mt-2 text-center"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        <span className="text-xs font-semibold text-foreground bg-card/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-border">
          {character.name}
          {state !== "idle" && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              {state === "speaking" ? "🗣️" : state === "listening" ? "👂" : "💭"}
            </span>
          )}
        </span>
      </motion.div>
    </div>
  );
}
