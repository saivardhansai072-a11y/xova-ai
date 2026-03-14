import { motion } from "framer-motion";
import { MessageCircle, Brain, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { defaultCharacters } from "@/lib/characters";

const features = [
  { icon: Users, title: "Choose Your Mentor", desc: "Pick from 6 anime characters or create your own", to: "/characters" },
  { icon: MessageCircle, title: "AI Chat", desc: "Have conversations with your anime mentor", to: "/chat" },
  { icon: Brain, title: "Aptitude Training", desc: "Sharpen your skills across 4 categories", to: "/aptitude" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-24 md:pt-16">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-16 pb-12 px-6 text-center">
        {/* Character showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex -space-x-4 mb-6"
        >
          {defaultCharacters.slice(0, 6).map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-3 ring-background"
              style={{ zIndex: 6 - i, boxShadow: `0 4px 20px -4px ${char.glowColor}` }}
            >
              <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-2 mb-4"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary font-medium">AI Mentor Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
        >
          Learn with <span className="text-gradient-primary">XOVA</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-4 text-lg text-muted-foreground max-w-md"
        >
          Choose your favorite anime character as your AI mentor. 3D characters with unique personalities that guide your learning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 flex gap-3"
        >
          <Link
            to="/characters"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity glow-primary"
          >
            Choose Mentor <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            Start Chat
          </Link>
        </motion.div>
      </section>

      {/* Character cards preview */}
      <section className="max-w-4xl mx-auto px-6 mb-12">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {defaultCharacters.map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
            >
              <Link
                to="/characters"
                className="surface-card p-4 block w-36 flex-shrink-0 hover:border-primary/30 transition-all group"
              >
                <div
                  className="w-20 h-20 mx-auto rounded-xl overflow-hidden mb-2"
                  style={{ boxShadow: `0 8px 25px -8px ${char.glowColor}` }}
                >
                  <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-foreground text-center text-sm">{char.name}</h3>
                <p className="text-[10px] text-muted-foreground text-center">{char.anime}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 grid gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 + i * 0.1, duration: 0.5 }}
          >
            <Link to={f.to} className="surface-card p-5 block hover:border-primary/30 transition-colors group">
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Stats */}
      <section className="max-w-3xl mx-auto px-6 mt-12">
        <div className="surface-card p-6 flex justify-around text-center">
          {[
            { value: "6+", label: "AI Characters" },
            { value: "∞", label: "Custom Mentors" },
            { value: "< 1s", label: "AI Response" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
