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
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0.12);
  const [isDragging, setIsDragging] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 110, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 110, damping: 20 });

  const sizes = { sm: 120, md: 180, lg: 260 };
  const s = sizes[size];

  useEffect(() => {
    let mounted = true;

    const scheduleBlink = () => {
      const next = 1800 + Math.random() * 2600;
      const timer = window.setTimeout(() => {
        if (!mounted) return;
        setIsBlinking(true);
        window.setTimeout(() => mounted && setIsBlinking(false), 120);
        if (Math.random() > 0.75) {
          window.setTimeout(() => {
            if (!mounted) return;
            setIsBlinking(true);
            window.setTimeout(() => mounted && setIsBlinking(false), 110);
          }, 220);
        }
        scheduleBlink();
      }, next);
      return timer;
    };

    const timer = scheduleBlink();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0.12);
      return;
    }

    const timer = setInterval(() => {
      const dynamic = audioLevel > 0 ? audioLevel : 0.25 + Math.random() * 0.75;
      setMouthOpen(dynamic);
    }, 90);

    return () => clearInterval(timer);
  }, [isSpeaking, audioLevel]);

  useEffect(() => {
    if (isDragging) return;

    let frame = 0;
    let t = 0;

    const animate = () => {
      t += 0.016;
      if (!isThinking) {
        rotateY.set(Math.sin(t * 0.8) * 4);
        rotateX.set(Math.cos(t * 0.6) * 2.5);
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, isThinking, rotateX, rotateY]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startRotY = rotateY.get();
    const startRotX = rotateX.get();

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      rotateY.set(startRotY + dx * 0.48);
      rotateX.set(Math.max(-28, Math.min(28, startRotX - dy * 0.48)));
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

  return (
    <div
      className="relative select-none cursor-grab active:cursor-grabbing"
      style={{ width: s, height: s + 40, perspective: 900 }}
      onPointerDown={handlePointerDown}
    >
      <motion.div
        className={`absolute rounded-full bg-gradient-to-br ${character.color}`}
        style={{
          width: s + 24,
          height: s + 24,
          left: -12,
          top: -12,
          filter: `blur(${s / 4}px)`,
        }}
        animate={{
          opacity: isSpeaking ? [0.35, 0.6, 0.35] : isListening ? [0.28, 0.45, 0.28] : [0.2, 0.3, 0.2],
          scale: isThinking ? [1, 1.08, 1] : [1, 1.04, 1],
        }}
        transition={{ duration: isThinking ? 1.3 : 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative w-full rounded-full overflow-hidden"
        style={{
          height: s,
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: isListening ? [0, -4, 0] : [0, -2, 0],
          scale: isSpeaking ? [1, 1.02, 1] : 1,
          rotateZ: isThinking ? [0, -1, 1, 0] : 0,
        }}
        transition={{ duration: isThinking ? 1.1 : 2.6, repeat: Infinity }}
      >
        <div
          className="absolute inset-0 rounded-full overflow-hidden ring-4 ring-primary/20"
          style={{ boxShadow: `0 0 60px -10px ${character.glowColor}, 0 20px 40px -20px hsl(var(--background) / 0.7)` }}
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

          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.45, 0.6, 0.45],
            }}
            transition={{ duration: 3.4, repeat: Infinity }}
            style={{
              background: "linear-gradient(145deg, hsl(var(--foreground) / 0.12) 0%, transparent 48%, hsl(var(--background) / 0.35) 100%)",
            }}
          />

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-[42%] -translate-x-1/2 flex gap-6" style={{ width: s * 0.42 }}>
              {[0, 1].map((eye) => (
                <div key={eye} className="relative flex-1 flex justify-center">
                  <div className="relative w-6 h-6 rounded-full bg-background/65 border border-border/60 overflow-hidden">
                    <motion.div
                      className="absolute w-2.5 h-2.5 rounded-full bg-foreground"
                      animate={{
                        x: isListening ? [0, 1.6, 0] : isThinking ? [0, -1.2, 0] : [0, 0.8, 0],
                        y: isThinking ? [0, -1.2, 0] : [0, 0.4, 0],
                      }}
                      transition={{ duration: isThinking ? 0.9 : 1.6, repeat: Infinity }}
                      style={{ left: "50%", top: "50%", marginLeft: -5, marginTop: -5 }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-background/80"
                      animate={{ scaleY: isBlinking ? 1 : 0.04 }}
                      transition={{ duration: 0.09 }}
                      style={{ transformOrigin: "center" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute left-1/2 top-[67%] -translate-x-1/2">
              <motion.div
                className="bg-background/50 border border-border/50"
                style={{ transformOrigin: "center" }}
                animate={
                  isSpeaking
                    ? {
                        width: [s * 0.09, s * (0.1 + mouthOpen * 0.13), s * 0.09],
                        height: [s * 0.04, s * (0.06 + mouthOpen * 0.08), s * 0.04],
                        borderRadius: [999, 16, 999],
                      }
                    : isThinking
                    ? {
                        width: s * 0.1,
                        height: s * 0.03,
                        borderRadius: 999,
                      }
                    : {
                        width: s * 0.08,
                        height: s * 0.026,
                        borderRadius: 999,
                      }
                }
                transition={{ duration: isSpeaking ? 0.16 : 0.25, repeat: isSpeaking ? Infinity : 0 }}
              />
            </div>
          </div>
        </div>

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

        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.28], opacity: [0.45, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/25"
              animate={{ scale: [1, 1.45], opacity: [0.3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.45 }}
            />
          </>
        )}
      </motion.div>

      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        <span className="text-xs font-semibold text-foreground bg-card/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border">
          {character.name}
        </span>
      </motion.div>
    </div>
  );
}
