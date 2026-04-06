import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { AICharacter } from "@/lib/characters";

// Working public Ready Player Me demo avatars with distinct appearances
const RPM_AVATARS: Record<string, string> = {
  goku: "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit&textureAtlas=1024",
  naruto: "https://models.readyplayer.me/638df693d72bffc6fa17457c.glb?morphTargets=ARKit&textureAtlas=1024",
  luffy: "https://models.readyplayer.me/632d65e99b4c6a4352a9b8db.glb?morphTargets=ARKit&textureAtlas=1024",
  hinata: "https://models.readyplayer.me/639a1b51d72bffc6fa1e5d3a.glb?morphTargets=ARKit&textureAtlas=1024",
  mikasa: "https://models.readyplayer.me/63f5c8a30e72c63d7c393e2b.glb?morphTargets=ARKit&textureAtlas=1024",
  suzume: "https://models.readyplayer.me/63f5c9120e72c63d7c393f1c.glb?morphTargets=ARKit&textureAtlas=1024",
};

const DEFAULT_AVATAR = "https://models.readyplayer.me/638df693d72bffc6fa17457c.glb?morphTargets=ARKit&textureAtlas=1024";

type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

interface Avatar3DProps {
  character: AICharacter;
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

function AvatarModel({
  url,
  state,
  audioElement,
  onError,
}: {
  url: string;
  state: AvatarState;
  audioElement?: HTMLAudioElement | null;
  onError: () => void;
}) {
  const gltf = useGLTF(url, undefined, undefined, (err) => {
    console.warn("GLB load failed:", err);
    onError();
  });
  const scene = gltf?.scene;
  const meshRefs = useRef<THREE.SkinnedMesh[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const mouthOpenRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!scene) return;
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          meshes.push(mesh);
        }
      }
    });
    meshRefs.current = meshes;
  }, [scene]);

  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

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

      sourceRef.current!.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    } catch {
      // Fallback to simulated mouth
    }
  }, []);

  useEffect(() => {
    if (!audioElement) {
      analyserRef.current = null;
      return;
    }
    connectAudio(audioElement);
    return () => {
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }
    };
  }, [audioElement, connectAudio]);

  const setMorphTarget = (name: string, value: number) => {
    meshRefs.current.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (dict && influences && dict[name] !== undefined) {
        influences[dict[name]] = value;
      }
    });
  };

  const resetMorphTargets = () => {
    meshRefs.current.forEach((mesh) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.fill(0);
      }
    });
  };

  useFrame((_, delta) => {
    if (!scene) return;
    timeRef.current += delta;
    const t = timeRef.current;

    resetMorphTargets();

    // Blink
    const blinkCycle = t % 4;
    if (blinkCycle > 3.8 && blinkCycle < 3.95) {
      setMorphTarget("eyeBlinkLeft", 1);
      setMorphTarget("eyeBlinkRight", 1);
    }

    // Audio level
    if (analyserRef.current && state === "speaking") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 4; i < 30; i++) sum += data[i];
      const audioLevel = Math.min(1, sum / (26 * 140));
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, audioLevel, 0.3);
    } else if (state === "speaking") {
      mouthOpenRef.current = 0.2 + Math.sin(t * 12) * 0.3 + Math.sin(t * 7) * 0.15;
    } else {
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, 0, 0.1);
    }

    const m = mouthOpenRef.current;

    if (m > 0.05) {
      setMorphTarget("jawOpen", m * 0.6);
      setMorphTarget("mouthOpen", m * 0.5);
      const visemePhase = Math.floor(t * 8) % 4;
      if (visemePhase === 0) setMorphTarget("mouthFunnel", m * 0.3);
      else if (visemePhase === 1) { setMorphTarget("mouthSmileLeft", m * 0.2); setMorphTarget("mouthSmileRight", m * 0.2); }
      else if (visemePhase === 2) setMorphTarget("mouthPucker", m * 0.3);
    }

    if (state === "celebrating") {
      setMorphTarget("mouthSmileLeft", 0.7);
      setMorphTarget("mouthSmileRight", 0.7);
    } else if (state === "thinking") {
      setMorphTarget("browInnerUp", 0.4 + Math.sin(t * 2) * 0.1);
      setMorphTarget("eyeLookUpLeft", 0.3);
      setMorphTarget("eyeLookUpRight", 0.3);
    } else if (state === "listening") {
      setMorphTarget("browInnerUp", 0.2);
      setMorphTarget("mouthSmileLeft", 0.15);
      setMorphTarget("mouthSmileRight", 0.15);
    }

    scene.rotation.y = Math.sin(t * 0.5) * 0.05;
    scene.rotation.x = Math.sin(t * 0.3) * 0.02;
  });

  if (!scene) return null;

  return (
    <primitive
      object={scene}
      scale={1.8}
      position={[0, -1.6, 0]}
      rotation={[0.05, 0, 0]}
    />
  );
}

function LoadingFallback({ size }: { size: number }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size * 1.2 }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
        <span className="text-[10px] text-muted-foreground">Loading 3D...</span>
      </div>
    </div>
  );
}

export default function Avatar3D({
  character,
  state = "idle",
  size = "md",
  audioElement,
}: Avatar3DProps) {
  const [loadError, setLoadError] = useState(false);
  const sizes = { sm: 120, md: 200, lg: 280 };
  const s = sizes[size];

  const avatarUrl = RPM_AVATARS[character.id] || DEFAULT_AVATAR;

  // On error, fall back to null (parent should show 2D avatar)
  if (loadError) {
    return (
      <div
        className="flex items-center justify-center surface-card rounded-2xl"
        style={{ width: s, height: s * 1.2 }}
      >
        <div className="text-center p-4">
          <p className="text-xs text-muted-foreground mb-1">3D model unavailable</p>
          <p className="text-[10px] text-muted-foreground">Using 2D avatar instead</p>
        </div>
      </div>
    );
  }

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
        style={{ width: s, height: s * 1.2, boxShadow: `0 0 30px -5px ${character.glowColor}` }}
        animate={{ y: state === "speaking" ? [0, -3, 0] : state === "celebrating" ? [0, -6, 0] : [0, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Canvas
          camera={{ position: [0, 0.2, 1.5], fov: 30 }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <directionalLight position={[-1, 1, -1]} intensity={0.4} />
          <pointLight position={[0, 0, 2]} intensity={0.5} color={character.glowColor} />
          <Suspense fallback={null}>
            <AvatarModel
              url={avatarUrl}
              state={state}
              audioElement={audioElement}
              onError={() => setLoadError(true)}
            />
          </Suspense>
        </Canvas>
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
