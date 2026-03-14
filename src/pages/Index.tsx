import { motion } from "framer-motion";
import { MessageCircle, Brain, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MentorAvatar from "@/components/MentorAvatar";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Mentor",
    desc: "Have natural conversations with your personal AI tutor",
    to: "/chat",
  },
  {
    icon: Brain,
    title: "Aptitude Training",
    desc: "Sharpen your skills with adaptive question banks",
    to: "/aptitude",
  },
  {
    icon: Zap,
    title: "Real-time Feedback",
    desc: "Get instant explanations and emotional support",
    to: "/chat",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-24 md:pt-16">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <MentorAvatar state="idle" size="lg" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-4xl md:text-5xl font-bold tracking-tight text-foreground"
        >
          Meet <span className="text-gradient-primary">XOVA</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-lg text-muted-foreground max-w-md"
        >
          Your AI mentor that thinks, listens, and adapts — like a real tutor, but always available.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity glow-primary"
          >
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 grid gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to={f.to} className="surface-card p-5 block hover:border-primary/30 transition-colors group">
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
              <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary transition-colors" />
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Stats */}
      <section className="max-w-3xl mx-auto px-6 mt-12">
        <div className="surface-card p-6 flex justify-around text-center">
          {[
            { value: "24/7", label: "Availability" },
            { value: "∞", label: "Patience" },
            { value: "< 1s", label: "Response Time" },
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
