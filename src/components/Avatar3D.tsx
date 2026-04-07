import { useRef, useEffect, useState, useCallback, Component, ReactNode, useMemo } from "react";
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

// Floating particles around the character
function Particles({ color, state }: { color: string; state: AvatarState }) {
  const count = state === "speaking" ? 30 : state === "celebrating" ? 40 : 15;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 3;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return arr;
  }, [count]);

  const threeColor = useMemo(() => {
    try {
      return new THREE.Color(color.replace(/rgba?\(([^)]+)\)/, (_, vals) => {
        const [r, g, b] = vals.split(",").map((v: string) => parseInt(v.trim()));
        return `rgb(${r},${g},${b})`;
      }));
    } catch { return new THREE.Color(0x6366f1); }
  }, [color]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const pos = geo.attributes.position;
    const speed = state === "speaking" ? 1.5 : state === "celebrating" ? 2 : 0.5;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      y += delta * speed * (0.3 + Math.sin(i) * 0.2);
      if (y > 1.5) y = -1.5;
      pos.setY(i, y);
      const x = pos.getX(i) + Math.sin(y * 2 + i) * delta * 0.15;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color={threeColor}
        size={0.03}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
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
  const auraRef = useRef<THREE.Mesh>(null);
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

  const threeGlowColor = useMemo(() => {
    try {
      return new THREE.Color(glowColor.replace(/rgba?\(([^)]+)\)/, (_, vals) => {
        const [r, g, b] = vals.split(",").map((v: string) => parseInt(v.trim()));
        return `rgb(${r},${g},${b})`;
      }));
    } catch { return new THREE.Color(0x6366f1); }
  }, [glowColor]);

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
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.04;

    if (state === "speaking") {
      meshRef.current.rotation.y = Math.sin(t * 1.5) * 0.08;
      meshRef.current.rotation.z = Math.sin(t * 2) * 0.03;
      meshRef.current.scale.setScalar(1 + intensity * 0.06);
    } else if (state === "thinking") {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.12;
      meshRef.current.rotation.x = -0.06 + Math.sin(t * 0.8) * 0.04;
      meshRef.current.scale.setScalar(1);
    } else if (state === "listening") {
      meshRef.current.rotation.y = Math.sin(t * 0.7) * 0.05;
      meshRef.current.scale.set(1.03, 1.03, 1);
    } else if (state === "celebrating") {
      meshRef.current.position.y = Math.sin(t * 4) * 0.1;
      meshRef.current.rotation.z = Math.sin(t * 3) * 0.06;
      meshRef.current.scale.setScalar(1.04 + Math.sin(t * 5) * 0.03);
    } else {
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.04;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.015;
      meshRef.current.scale.setScalar(1);
    }

    // Glow ring
    if (glowRef.current) {
      const baseGlow = state === "speaking" ? 0.5 + intensity * 0.5 :
                       state === "listening" ? 0.35 + Math.sin(t * 2) * 0.2 :
                       state === "celebrating" ? 0.5 + Math.sin(t * 4) * 0.3 :
                       state === "thinking" ? 0.3 + Math.sin(t * 1.5) * 0.15 :
                       0.15 + Math.sin(t * 1) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = baseGlow;
      const gs = 1.12 + (state === "speaking" ? intensity * 0.08 : Math.sin(t * 1.5) * 0.03);
      glowRef.current.scale.set(gs, gs, 1);
      glowRef.current.rotation.z = t * 0.1;
    }

    // Aura outer ring
    if (auraRef.current) {
      const ao = state === "speaking" ? 0.2 + intensity * 0.3 :
                 state === "celebrating" ? 0.3 : 0.08;
      (auraRef.current.material as THREE.MeshBasicMaterial).opacity = ao;
      const as2 = 1.25 + Math.sin(t * 0.7) * 0.05;
      auraRef.current.scale.set(as2, as2, 1);
      auraRef.current.rotation.z = -t * 0.05;
    }
  });

  return (
    <group>
      {/* Outer aura */}
      <mesh ref={auraRef} position={[0, 0, -0.04]}>
        <ringGeometry args={[0.85, 1.1, 32]} />
        <meshBasicMaterial color={threeGlowColor} transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[1.7, 2.1]} />
        <meshBasicMaterial color={threeGlowColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Character image */}
      <mesh ref={meshRef}>
        <planeGeometry args={[1.5, 1.9]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          roughness={0.2}
          metalness={0.15}
          emissive={threeGlowColor}
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
}

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function Avatar3D({ character, state = "idle", size = "md", audioElement }: Avatar3DProps) {
  const [hasError, setHasError] = useState(false);
  const sizes = { sm: 120, md: 200, lg: 280 };
  const s = sizes[size];

  if (!character.image || hasError) return null;

  return (
    <div className="relative flex flex-col items-center" style={{ width: s + 40 }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s + 40, height: s + 40,
          left: "50%", top: s / 2,
          x: "-50%", y: "-50%",
          background: `radial-gradient(circle, ${character.glowColor} 0%, transparent 65%)`,
          filter: `blur(${s / 5}px)`,
        }}
        animate={{
          opacity: state === "speaking" ? [0.5, 0.95, 0.5] : state === "celebrating" ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
          scale: state === "speaking" ? [1, 1.2, 1] : [1, 1.06, 1],
        }}
        transition={{ duration: state === "speaking" ? 0.5 : 2, repeat: Infinity }}
      />

      {/* Listening pulse rings */}
      {state === "listening" && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/25 pointer-events-none"
          style={{ width: s + 20, height: s + 20, left: "50%", top: s / 2, x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.5 + i * 0.15], opacity: [0.35, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      {/* 3D Canvas */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: s, height: s * 1.2,
          boxShadow: `0 0 40px -5px ${character.glowColor}, 0 0 80px -20px ${character.glowColor}`,
          border: `2px solid ${character.glowColor.replace("0.4", "0.2")}`,
        }}
        animate={{ y: state === "speaking" ? [0, -4, 0] : state === "celebrating" ? [0, -8, 0] : [0, -2, 0] }}
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
            <ambientLight intensity={0.85} />
            <directionalLight position={[2, 3, 3]} intensity={0.9} />
            <directionalLight position={[-2, 1, -1]} intensity={0.35} color="#a5b4fc" />
            <pointLight position={[0, -1, 2]} intensity={0.5} color={character.glowColor} />
            <pointLight position={[0, 1, 2]} intensity={0.3} color="#ffffff" />
            <CharacterCard
              imageUrl={character.image}
              state={state}
              audioElement={audioElement}
              glowColor={character.glowColor}
            />
            <Particles color={character.glowColor} state={state} />
          </Canvas>
        </CanvasErrorBoundary>
      </motion.div>

      {/* Thinking dots */}
      {state === "thinking" && (
        <div className="absolute -right-2 top-2 flex gap-1 z-20">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-primary" animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      )}

      {/* Audio bars */}
      {state === "speaking" && (
        <div className="flex gap-[3px] mt-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <motion.div key={i} className="rounded-full" style={{ width: 3, backgroundColor: character.glowColor }} animate={{ height: [3, 10 + Math.random() * 10, 3] }} transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.03 }} />
          ))}
        </div>
      )}

      {/* Name badge */}
      <motion.div className="mt-2 text-center" animate={{ y: [0, -1, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <span className="text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3 py-1 rounded-full border border-border shadow-lg">
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
