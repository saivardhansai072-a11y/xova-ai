import { useRef, useEffect, useState, useCallback, Component, ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

function CharacterCard({
  imageUrl,
  state,
  audioElement,
  glowColor,
}: {
  imageUrl: string;
  state: AvatarState;
  audioElement?: HTMLAudioElement | null;
  glowColor: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const intensityRef = useRef(0);
  const timeRef = useRef(0);

  const texture = useLoader(THREE.TextureLoader, imageUrl);

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
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Audio intensity
    if (analyserRef.current && state === "speaking") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 4; i < 30; i++) sum += data[i];
      intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, Math.min(1, sum / (26 * 140)), 0.3);
    } else if (state === "speaking") {
      intensityRef.current = 0.3 + Math.sin(t * 10) * 0.2 + Math.sin(t * 7) * 0.1;
    } else {
      intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, 0, 0.1);
    }

    const intensity = intensityRef.current;

    // Base gentle float
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.03;

    // State-based animations
    if (state === "speaking") {
      meshRef.current.rotation.y = Math.sin(t * 1.5) * 0.06;
      meshRef.current.rotation.z = Math.sin(t * 2) * 0.02;
      meshRef.current.scale.setScalar(1 + intensity * 0.04);
    } else if (state === "thinking") {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      meshRef.current.rotation.x = -0.05 + Math.sin(t * 0.8) * 0.03;
      meshRef.current.scale.setScalar(1);
    } else if (state === "listening") {
      meshRef.current.rotation.y = Math.sin(t * 0.7) * 0.04;
      meshRef.current.scale.set(1.02, 1.02, 1);
    } else if (state === "celebrating") {
      meshRef.current.position.y = Math.sin(t * 4) * 0.08;
      meshRef.current.rotation.z = Math.sin(t * 3) * 0.05;
      meshRef.current.scale.setScalar(1.03 + Math.sin(t * 5) * 0.02);
    } else {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.04;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.01;
      meshRef.current.scale.setScalar(1);
    }

    // Glow ring
    if (glowRef.current) {
      const baseGlow = state === "speaking" ? 0.6 + intensity * 0.4 :
                       state === "listening" ? 0.4 + Math.sin(t * 2) * 0.2 :
                       state === "celebrating" ? 0.5 + Math.sin(t * 4) * 0.3 :
                       0.15 + Math.sin(t * 1) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = baseGlow;
      const glowScale = 1.08 + (state === "speaking" ? intensity * 0.06 : Math.sin(t * 1.5) * 0.02);
      glowRef.current.scale.set(glowScale, glowScale, 1);
    }
  });

  // Parse glow color for Three.js
  const threeGlowColor = new THREE.Color(glowColor.replace(/rgba?\(([^)]+)\)/, (_, vals) => {
    const [r, g, b] = vals.split(",").map((v: string) => parseInt(v.trim()));
    return `rgb(${r},${g},${b})`;
  }));

  return (
    <group>
      {/* Glow ring behind character */}
      <mesh ref={glowRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[1.6, 2.0]} />
        <meshBasicMaterial
          color={threeGlowColor}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Character image on a rounded card */}
      <mesh ref={meshRef}>
        <planeGeometry args={[1.5, 1.9]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
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
  const [hasError, setHasError] = useState(false);
  const sizes = { sm: 120, md: 200, lg: 280 };
  const s = sizes[size];

  // Need a valid image to render
  if (!character.image || hasError) return null;

  return (
    <div className="relative flex flex-col items-center" style={{ width: s + 40 }}>
      {/* Glow effect */}
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

      {/* 3D Canvas with character image */}
      <motion.div
        className="relative rounded-2xl overflow-hidden border-2 border-border/50"
        style={{
          width: s, height: s * 1.2,
          boxShadow: `0 0 30px -5px ${character.glowColor}`,
        }}
        animate={{ y: state === "speaking" ? [0, -3, 0] : state === "celebrating" ? [0, -6, 0] : [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <CanvasErrorBoundary fallback={
          <div className="w-full h-full flex items-center justify-center">
            <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
          </div>
        }>
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 35 }}
            style={{ background: "transparent" }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            onError={() => setHasError(true)}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[2, 3, 3]} intensity={0.8} />
            <directionalLight position={[-2, 1, -1]} intensity={0.3} />
            <pointLight position={[0, 0, 3]} intensity={0.3} color={character.glowColor} />
            <CharacterCard
              imageUrl={character.image}
              state={state}
              audioElement={audioElement}
              glowColor={character.glowColor}
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
