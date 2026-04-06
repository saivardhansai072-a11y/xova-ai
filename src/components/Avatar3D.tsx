import { useRef, useEffect, useState, useCallback, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { AICharacter } from "@/lib/characters";

type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

interface Avatar3DProps {
  character: AICharacter;
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

// Character color mapping for procedural avatars
const CHARACTER_COLORS: Record<string, { skin: string; hair: string; eyes: string; accent: string }> = {
  goku: { skin: "#FFD5A6", hair: "#1A1A1A", eyes: "#2D1B0E", accent: "#FF8C00" },
  naruto: { skin: "#FFD5A6", hair: "#FFB347", eyes: "#4A90D9", accent: "#FF6B35" },
  luffy: { skin: "#FFD5A6", hair: "#1A1A1A", eyes: "#3D2B1F", accent: "#CC0000" },
  hinata: { skin: "#FFE4D0", hair: "#191970", eyes: "#E8D5FF", accent: "#9370DB" },
  mikasa: { skin: "#FFE4D0", hair: "#1A1A1A", eyes: "#4A4A4A", accent: "#8B0000" },
  suzume: { skin: "#FFE4D0", hair: "#5D3A1A", eyes: "#8B4513", accent: "#FF69B4" },
};

const DEFAULT_COLORS = { skin: "#FFD5A6", hair: "#333333", eyes: "#2D1B0E", accent: "#4A90D9" };

function ProceduralAvatar({
  characterId,
  state,
  audioElement,
}: {
  characterId: string;
  state: AvatarState;
  audioElement?: HTMLAudioElement | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const mouthOpenRef = useRef(0);
  const timeRef = useRef(0);

  const colors = CHARACTER_COLORS[characterId] || DEFAULT_COLORS;

  // Audio analysis
  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (lastAudioRef.current !== audio) {
        if (sourceRef.current) try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = ctx.createMediaElementSource(audio);
        lastAudioRef.current = audio;
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      sourceRef.current!.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    } catch {}
  }, []);

  useEffect(() => {
    if (!audioElement) { analyserRef.current = null; return; }
    connectAudio(audioElement);
    return () => {
      if (analyserRef.current) try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    };
  }, [audioElement, connectAudio]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Gentle sway
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.02;

    // Breathing
    const breathe = 1 + Math.sin(t * 1.5) * 0.01;
    groupRef.current.scale.set(breathe, breathe, breathe);

    // Audio-driven mouth
    if (analyserRef.current && state === "speaking") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 4; i < 30; i++) sum += data[i];
      const level = Math.min(1, sum / (26 * 140));
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, level, 0.3);
    } else if (state === "speaking") {
      mouthOpenRef.current = 0.3 + Math.sin(t * 12) * 0.3 + Math.sin(t * 7) * 0.15;
    } else {
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, 0, 0.15);
    }

    // Mouth animation
    if (mouthRef.current) {
      const m = Math.max(0, mouthOpenRef.current);
      mouthRef.current.scale.y = 0.3 + m * 2;
      mouthRef.current.scale.x = 1 + m * 0.3;
    }

    // Blink
    const blinkCycle = t % 3.5;
    const blink = blinkCycle > 3.2 && blinkCycle < 3.35;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink ? 0.1 : 1;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink ? 0.1 : 1;

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      if (state === "thinking") {
        leftBrowRef.current.position.y = 0.55 + Math.sin(t * 2) * 0.03;
        rightBrowRef.current.position.y = 0.55 + Math.sin(t * 2) * 0.03;
        leftBrowRef.current.rotation.z = 0.15;
        rightBrowRef.current.rotation.z = -0.15;
      } else if (state === "listening") {
        leftBrowRef.current.position.y = 0.58;
        rightBrowRef.current.position.y = 0.58;
        leftBrowRef.current.rotation.z = 0.05;
        rightBrowRef.current.rotation.z = -0.05;
      } else if (state === "celebrating") {
        leftBrowRef.current.position.y = 0.6;
        rightBrowRef.current.position.y = 0.6;
        leftBrowRef.current.rotation.z = -0.1;
        rightBrowRef.current.rotation.z = 0.1;
      } else {
        leftBrowRef.current.position.y = 0.52;
        rightBrowRef.current.position.y = 0.52;
        leftBrowRef.current.rotation.z = 0;
        rightBrowRef.current.rotation.z = 0;
      }
    }

    // Thinking: look up
    if (state === "thinking" && groupRef.current) {
      groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.05 - 0.05;
    } else if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.02;
    }

    // Celebrating: bob
    if (state === "celebrating" && groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 4) * 0.08;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={colors.skin} roughness={0.6} />
      </mesh>

      {/* Hair - top */}
      <mesh position={[0, 0.55, -0.05]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={colors.hair} roughness={0.8} />
      </mesh>

      {/* Hair - back */}
      <mesh position={[0, 0.2, -0.35]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={colors.hair} roughness={0.8} />
      </mesh>

      {/* Character-specific hair accents */}
      {characterId === "goku" && (
        <>
          <mesh position={[0, 0.95, -0.1]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.15, 0.5, 8]} />
            <meshStandardMaterial color={colors.hair} roughness={0.8} />
          </mesh>
          <mesh position={[0.2, 0.85, -0.05]} rotation={[0.2, 0, -0.3]}>
            <coneGeometry args={[0.12, 0.4, 8]} />
            <meshStandardMaterial color={colors.hair} roughness={0.8} />
          </mesh>
          <mesh position={[-0.2, 0.85, -0.05]} rotation={[0.2, 0, 0.3]}>
            <coneGeometry args={[0.12, 0.4, 8]} />
            <meshStandardMaterial color={colors.hair} roughness={0.8} />
          </mesh>
        </>
      )}
      {characterId === "naruto" && (
        <>
          {[-0.25, -0.12, 0, 0.12, 0.25].map((x, i) => (
            <mesh key={i} position={[x, 0.8 + Math.abs(x) * 0.3, -0.05]} rotation={[0.2, 0, x * 0.5]}>
              <coneGeometry args={[0.08, 0.3, 6]} />
              <meshStandardMaterial color={colors.hair} roughness={0.8} />
            </mesh>
          ))}
        </>
      )}

      {/* Eyes */}
      <group position={[0, 0.2, 0.42]}>
        {/* Left eye white */}
        <mesh position={[-0.16, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Left pupil */}
        <mesh ref={leftEyeRef} position={[-0.16, 0, 0.05]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.2} />
        </mesh>
        {/* Left eye shine */}
        <mesh position={[-0.13, 0.03, 0.09]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
        </mesh>

        {/* Right eye white */}
        <mesh position={[0.16, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Right pupil */}
        <mesh ref={rightEyeRef} position={[0.16, 0, 0.05]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.2} />
        </mesh>
        {/* Right eye shine */}
        <mesh position={[0.19, 0.03, 0.09]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh ref={leftBrowRef} position={[-0.16, 0.52, 0.43]}>
        <boxGeometry args={[0.14, 0.025, 0.02]} />
        <meshStandardMaterial color={colors.hair} roughness={0.8} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.16, 0.52, 0.43]}>
        <boxGeometry args={[0.14, 0.025, 0.02]} />
        <meshStandardMaterial color={colors.hair} roughness={0.8} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.08, 0.52]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={colors.skin} roughness={0.7} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.08, 0.48]}>
        <sphereGeometry args={[0.06, 16, 8]} />
        <meshStandardMaterial color="#CC4444" roughness={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.2, 16]} />
        <meshStandardMaterial color={colors.skin} roughness={0.6} />
      </mesh>

      {/* Shoulders / Body top */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[0.9, 0.35, 0.45]} />
        <meshStandardMaterial color={colors.accent} roughness={0.5} />
      </mesh>

      {/* Character-specific details */}
      {characterId === "naruto" && (
        <mesh position={[0, -0.02, 0.5]}>
          <boxGeometry args={[0.35, 0.015, 0.01]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      )}
      {characterId === "mikasa" && (
        <mesh position={[0, -0.55, 0.22]}>
          <boxGeometry args={[0.85, 0.05, 0.02]} />
          <meshStandardMaterial color="#8B0000" />
        </mesh>
      )}
    </group>
  );
}

// Error boundary for Canvas crashes
class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function Avatar3D({
  character,
  state = "idle",
  size = "md",
  audioElement,
}: Avatar3DProps) {
  const [canvasError, setCanvasError] = useState(false);
  const sizes = { sm: 120, md: 200, lg: 280 };
  const s = sizes[size];

  if (canvasError) return null;

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
          opacity: state === "speaking" ? [0.5, 0.9, 0.5] : [0.2, 0.4, 0.2],
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

      {/* 3D Canvas */}
      <motion.div
        className="relative rounded-2xl overflow-hidden border-2 border-border/50"
        style={{
          width: s, height: s * 1.2,
          boxShadow: `0 0 30px -5px ${character.glowColor}`,
          background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)`,
        }}
        animate={{ y: state === "speaking" ? [0, -3, 0] : state === "celebrating" ? [0, -6, 0] : [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <CanvasErrorBoundary fallback={<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">3D unavailable</div>}>
          <Canvas
            camera={{ position: [0, 0, 2.2], fov: 35 }}
            style={{ background: "transparent" }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 3, 3]} intensity={1} />
            <directionalLight position={[-2, 1, -1]} intensity={0.3} />
            <pointLight position={[0, 0, 3]} intensity={0.4} color={character.glowColor} />
            <ProceduralAvatar
              characterId={character.id}
              state={state}
              audioElement={audioElement}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </motion.div>

      {/* Thinking dots */}
      {state === "thinking" && (
        <div className="absolute -right-1 top-1 flex gap-1 z-20">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      )}

      {/* Audio bars */}
      {state === "speaking" && (
        <div className="flex gap-[2px] mt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i} className="rounded-full" style={{ width: 3, backgroundColor: character.glowColor }} animate={{ height: [3, 8 + Math.random() * 8, 3] }} transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.04 }} />
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
