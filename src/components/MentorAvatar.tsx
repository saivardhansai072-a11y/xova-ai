import { motion } from "framer-motion";

export type MentorState = "idle" | "listening" | "thinking" | "explaining" | "celebrating";

const stateColors: Record<MentorState, string> = {
  idle: "from-primary to-accent",
  listening: "from-mentor-listening to-primary",
  thinking: "from-mentor-thinking to-primary",
  explaining: "from-primary to-accent",
  celebrating: "from-mentor-celebrating to-primary",
};

const stateLabels: Record<MentorState, string> = {
  idle: "",
  listening: "Listening...",
  thinking: "Thinking...",
  explaining: "Explaining...",
  celebrating: "🎉 Great job!",
};

interface MentorAvatarProps {
  state: MentorState;
  size?: "sm" | "md" | "lg";
}

export default function MentorAvatar({ state, size = "md" }: MentorAvatarProps) {
  const sizes = { sm: 80, md: 160, lg: 240 };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: s, height: s }}>
        {/* Glow ring */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${stateColors[state]} opacity-30 blur-xl`}
          animate={{
            scale: state === "idle" ? [1, 1.1, 1] : [1, 1.2, 1],
            opacity: state === "idle" ? [0.2, 0.3, 0.2] : [0.3, 0.6, 0.3],
          }}
          transition={{ duration: state === "thinking" ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Avatar body */}
        <motion.div
          className={`relative w-full h-full rounded-full bg-gradient-to-br ${stateColors[state]} flex items-center justify-center overflow-hidden`}
          animate={state === "celebrating" ? { rotate: [0, -5, 5, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: state === "celebrating" ? Infinity : 0 }}
        >
          {/* Face */}
          <div className="relative">
            {/* Eyes */}
            <div className="flex gap-4">
              <motion.div
                className="w-3 h-3 rounded-full bg-primary-foreground"
                animate={{ scaleY: state === "listening" ? [1, 0.2, 1] : [1, 0.1, 1] }}
                transition={{
                  duration: state === "listening" ? 0.3 : 0.15,
                  repeat: Infinity,
                  repeatDelay: state === "listening" ? 1 : 3,
                }}
              />
              <motion.div
                className="w-3 h-3 rounded-full bg-primary-foreground"
                animate={{ scaleY: state === "listening" ? [1, 0.2, 1] : [1, 0.1, 1] }}
                transition={{
                  duration: state === "listening" ? 0.3 : 0.15,
                  repeat: Infinity,
                  repeatDelay: state === "listening" ? 1 : 3,
                }}
              />
            </div>

            {/* Mouth */}
            <motion.div
              className="mx-auto mt-3 bg-primary-foreground rounded-full"
              animate={
                state === "explaining"
                  ? { width: [12, 16, 12], height: [6, 10, 6] }
                  : state === "celebrating"
                  ? { width: 20, height: 10, borderRadius: "0 0 10px 10px" }
                  : { width: 12, height: 4 }
              }
              transition={{ duration: 0.3, repeat: state === "explaining" ? Infinity : 0 }}
              style={{ width: 12, height: 4 }}
            />
          </div>

          {/* Thinking dots */}
          {state === "thinking" && (
            <div className="absolute bottom-4 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {state !== "idle" && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground font-medium"
        >
          {stateLabels[state]}
        </motion.span>
      )}
    </div>
  );
}
