import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { AICharacter } from "@/lib/characters";

// Ready Player Me default avatar URLs (free, no API key needed)
const RPM_AVATARS: Record<string, string> = {
  goku: "https://models.readyplayer.me/6460d95f9ae8cb4e3c79de6a.glb?morphTargets=ARKit&textureAtlas=1024",
  naruto: "https://models.readyplayer.me/6460d95f9ae8cb4e3c79de6a.glb?morphTargets=ARKit&textureAtlas=1024",
  luffy: "https://models.readyplayer.me/6460d95f9ae8cb4e3c79de6a.glb?morphTargets=ARKit&textureAtlas=1024",
  hinata: "https://models.readyplayer.me/64180f12c23b2b9d0890dc43.glb?morphTargets=ARKit&textureAtlas=1024",
  mikasa: "https://models.readyplayer.me/64180f12c23b2b9d0890dc43.glb?morphTargets=ARKit&textureAtlas=1024",
  suzume: "https://models.readyplayer.me/64180f12c23b2b9d0890dc43.glb?morphTargets=ARKit&textureAtlas=1024",
};

const DEFAULT_AVATAR = "https://models.readyplayer.me/6460d95f9ae8cb4e3c79de6a.glb?morphTargets=ARKit&textureAtlas=1024";

type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

interface Avatar3DProps {
  character: AICharacter;
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

// Viseme mapping for ARKit blend shapes
const VISEME_MAP: Record<string, string[]> = {
  idle: ["mouthClose"],
  A: ["jawOpen", "mouthOpen"],
  E: ["mouthSmileLeft", "mouthSmileRight", "jawOpen"],
  I: ["mouthSmileLeft", "mouthSmileRight"],
  O: ["mouthFunnel", "jawOpen"],
  U: ["mouthPucker", "jawOpen"],
};

function AvatarModel({
  url,
  state,
  audioElement,
  glowColor,
}: {
  url: string;
  state: AvatarState;
  audioElement?: HTMLAudioElement | null;
  glowColor: string;
}) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);
  const meshRefs = useRef<THREE.SkinnedMesh[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const mouthOpenRef = useRef(0);
  const timeRef = useRef(0);

  // Find skinned meshes with morph targets
  useEffect(() => {
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

  // Play first animation if available
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction?.reset().fadeIn(0.5).play();
    }
  }, [actions]);

  // Audio analyser for lip sync
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

      sourceRef.current.connect(analyser);
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

  // Set morph target value by name
  const setMorphTarget = (name: string, value: number) => {
    meshRefs.current.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (dict && influences && dict[name] !== undefined) {
        influences[dict[name]] = value;
      }
    });
  };

  // Reset all morph targets
  const resetMorphTargets = () => {
    meshRefs.current.forEach((mesh) => {
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.fill(0);
      }
    });
  };

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Reset morph targets each frame
    resetMorphTargets();

    // Blink
    const blinkCycle = t % 4;
    if (blinkCycle > 3.8 && blinkCycle < 3.95) {
      setMorphTarget("eyeBlinkLeft", 1);
      setMorphTarget("eyeBlinkRight", 1);
    }

    // Get audio level
    let audioLevel = 0;
    if (analyserRef.current && state === "speaking") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 4; i < 30; i++) sum += data[i];
      audioLevel = Math.min(1, sum / (26 * 140));
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, audioLevel, 0.3);
    } else if (state === "speaking") {
      // Simulated when no audio element
      mouthOpenRef.current = 0.2 + Math.sin(t * 12) * 0.3 + Math.sin(t * 7) * 0.15;
    } else {
      mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, 0, 0.1);
    }

    const m = mouthOpenRef.current;

    // Apply lip sync
    if (m > 0.05) {
      setMorphTarget("jawOpen", m * 0.6);
      setMorphTarget("mouthOpen", m * 0.5);
      // Cycle through visemes for more realistic speech
      const visemePhase = Math.floor(t * 8) % 4;
      if (visemePhase === 0) {
        setMorphTarget("mouthFunnel", m * 0.3);
      } else if (visemePhase === 1) {
        setMorphTarget("mouthSmileLeft", m * 0.2);
        setMorphTarget("mouthSmileRight", m * 0.2);
      } else if (visemePhase === 2) {
        setMorphTarget("mouthPucker", m * 0.3);
      }
    }

    // Expressions based on state
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

    // Subtle idle movement - head sway
    scene.rotation.y = Math.sin(t * 0.5) * 0.05;
    scene.rotation.x = Math.sin(t * 0.3) * 0.02;
  });

  return (
    <primitive
      object={scene}
      scale={1.8}
      position={[0, -1.6, 0]}
      rotation={[0.05, 0, 0]}
    />
  );
}

function LoadingFallback({ character }: { character: AICharacter }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <div
          className="w-20 h-20 rounded-full animate-pulse"
          style={{ background: `linear-gradient(135deg, ${character.glowColor}, transparent)` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
          {character.name.charAt(0)}
        </span>
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

  if (loadError) {
    // Fallback to importing the original AnimatedAvatar
    return null;
  }

  return (
    <div className="relative flex flex-col items-center" style={{ width: s + 40 }}>
      {/* Glow effect */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: s + 30,
          height: s + 30,
          left: "50%",
          top: s / 2,
          x: "-50%",
          y: "-50%",
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
          width: s,
          height: s * 1.2,
          boxShadow: `0 0 30px -5px ${character.glowColor}`,
        }}
        animate={{
          y: state === "speaking" ? [0, -3, 0] : state === "celebrating" ? [0, -6, 0] : [0, -2, 0],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Canvas
          camera={{ position: [0, 0.2, 1.5], fov: 30 }}
          style={{ background: "transparent" }}
          onError={() => setLoadError(true)}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <directionalLight position={[-1, 1, -1]} intensity={0.4} />
          <pointLight
            position={[0, 0, 2]}
            intensity={0.5}
            color={character.glowColor}
          />
          <Suspense fallback={null}>
            <AvatarModel
              url={avatarUrl}
              state={state}
              audioElement={audioElement}
              glowColor={character.glowColor}
            />
          </Suspense>
        </Canvas>
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

      {/* Audio bars when speaking */}
      {state === "speaking" && (
        <div className="flex gap-[2px] mt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{ width: 3, backgroundColor: character.glowColor }}
              animate={{ height: [3, 8 + Math.random() * 8, 3] }}
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
