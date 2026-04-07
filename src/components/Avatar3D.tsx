import { Component, ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { AICharacter } from "@/lib/characters";
import AvatarPortraitScene from "@/components/avatar3d/AvatarPortraitScene";
import { AvatarState, avatarSizeMap } from "@/components/avatar3d/utils";

interface Avatar3DProps {
  character: AICharacter;
  state?: AvatarState;
  size?: "sm" | "md" | "lg";
  audioElement?: HTMLAudioElement | null;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function AvatarFallback({
  character,
  state,
  width,
  height,
}: {
  character: AICharacter;
  state: AvatarState;
  width: number;
  height: number;
}) {
  const isActive = state === "speaking" || state === "listening";

  return (
    <div className="relative flex items-end justify-center" style={{ width, height }}>
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: width * 0.88,
          height: height * 0.78,
          left: "50%",
          top: height * 0.38,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle at 50% 42%, ${character.glowColor} 0%, transparent 72%)`,
          filter: `blur(${Math.round(width / 8)}px)`,
        }}
        animate={{
          opacity: isActive ? [0.55, 0.88, 0.55] : [0.25, 0.42, 0.25],
          scale: isActive ? [1, 1.08, 1] : [1, 1.03, 1],
        }}
        transition={{ duration: isActive ? 0.9 : 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.img
        src={character.image}
        alt={character.name}
        className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
        style={{ filter: `drop-shadow(0 24px 44px ${character.glowColor})` }}
        animate={{
          y: state === "speaking" ? [0, -5, 0] : state === "thinking" ? [0, -3, 0] : [0, -2, 0],
          scale: state === "speaking" ? [1, 1.02, 1] : [1, 1.01, 1],
        }}
        transition={{ duration: state === "speaking" ? 1 : 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.img
        src={character.image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
        style={{
          opacity: 0.18,
          filter: `blur(${Math.max(5, Math.round(width / 34))}px) drop-shadow(0 0 32px ${character.glowColor})`,
        }}
        animate={{
          x: [0, 6, 0],
          y: [0, -3, 0],
          scale: [1.01, 1.04, 1.01],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-foreground/15 blur-2xl"
        style={{
          width: width * 0.54,
          height: width * 0.14,
          bottom: height * 0.08,
        }}
      />
    </div>
  );
}

export default function Avatar3D({ character, state = "idle", size = "md", audioElement }: Avatar3DProps) {
  const avatarWidth = avatarSizeMap[size];
  const stageHeight = Math.round(avatarWidth * 1.28);

  if (!character.image) return null;

  return (
    <div className="relative flex flex-col items-center" style={{ width: avatarWidth + 64 }}>
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: avatarWidth + 58,
          height: avatarWidth + 58,
          left: "50%",
          top: avatarWidth * 0.54,
          x: "-50%",
          y: "-50%",
          background: `radial-gradient(circle at 50% 45%, ${character.glowColor} 0%, transparent 70%)`,
          filter: `blur(${Math.round(avatarWidth / 5)}px)`,
        }}
        animate={{
          opacity: state === "speaking" ? [0.45, 0.9, 0.45] : state === "thinking" ? [0.3, 0.6, 0.3] : [0.2, 0.42, 0.2],
          scale: state === "speaking" ? [1, 1.15, 1] : [1, 1.05, 1],
        }}
        transition={{ duration: state === "speaking" ? 0.8 : 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative"
        style={{
          width: avatarWidth,
          height: stageHeight,
        }}
        animate={{ y: state === "speaking" ? [0, -5, 0] : state === "thinking" ? [0, -3, 0] : [0, -2, 0] }}
        transition={{ duration: state === "speaking" ? 1 : 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <CanvasErrorBoundary fallback={<AvatarFallback character={character} state={state} width={avatarWidth} height={stageHeight} />}>
          <Canvas
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            camera={{ position: [0, 0.04, 3.4], fov: 28 }}
            style={{ background: "transparent" }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[2.6, 3.4, 3.2]} intensity={1.25} />
            <directionalLight position={[-2.4, 1.8, 2.2]} intensity={0.48} />
            <pointLight position={[0, 0.9, 2.4]} intensity={0.55} color={0xffffff} />

            <Suspense fallback={null}>
              <AvatarPortraitScene
                imageUrl={character.image}
                glowColor={character.glowColor}
                state={state}
                audioElement={audioElement}
              />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      </motion.div>

      {state === "thinking" && (
        <div className="absolute -right-1 top-2 flex gap-1 z-20">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="h-2.5 w-2.5 rounded-full bg-primary" animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      )}

      {state === "speaking" && (
        <div className="flex gap-[3px] mt-1.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div key={i} className="rounded-full" style={{ width: 3, backgroundColor: character.glowColor }} animate={{ height: [4, 9 + (i % 3) * 3, 4] }} transition={{ duration: 0.18, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }} />
          ))}
        </div>
      )}

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
