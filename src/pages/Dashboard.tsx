import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MessageCircle, Brain, Users, Briefcase, Compass, Rocket,
  Trophy, Target, Flame, Star, ChevronRight, Zap, TrendingUp,
  CheckCircle2, Clock
} from "lucide-react";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";

type DailyMission = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  target: number;
  current: number;
  link: string;
  color: string;
};

export default function DashboardPage() {
  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [streak, setStreak] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem("xova-progress");
    if (saved) {
      const progress = JSON.parse(saved);
      const total = Object.values(progress).reduce((a: number, b: any) => a + b.total, 0);
      const correct = Object.values(progress).reduce((a: number, b: any) => a + b.correct, 0);
      setTotalQuestions(total as number);
      setAccuracy(total > 0 ? Math.round((correct as number / (total as number)) * 100) : 0);
    }

    // Calculate streak
    const lastVisit = localStorage.getItem("xova-last-visit");
    const today = new Date().toDateString();
    const currentStreak = parseInt(localStorage.getItem("xova-streak") || "0");
    
    if (lastVisit === today) {
      setStreak(currentStreak);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastVisit === yesterday ? currentStreak + 1 : 1;
      setStreak(newStreak);
      localStorage.setItem("xova-streak", newStreak.toString());
      localStorage.setItem("xova-last-visit", today);
    }
  }, []);

  const missions: DailyMission[] = [
    { id: "1", title: "Solve 5 Aptitude Questions", description: "Sharpen your mind", icon: Brain, target: 5, current: Math.min(totalQuestions, 5), link: "/aptitude", color: "text-primary" },
    { id: "2", title: "Practice 1 Interview Question", description: "Prepare for success", icon: Briefcase, target: 1, current: 0, link: "/interview", color: "text-yellow-400" },
    { id: "3", title: "Chat with Your Mentor", description: "Learn something new", icon: MessageCircle, target: 1, current: 0, link: "/chat", color: "text-green-400" },
    { id: "4", title: "Explore a Career Path", description: "Plan your future", icon: Compass, target: 1, current: 0, link: "/career", color: "text-purple-400" },
  ];

  const quickAccess = [
    { icon: MessageCircle, label: "AI Chat", to: "/chat", color: "from-blue-500 to-cyan-400" },
    { icon: Brain, label: "Aptitude", to: "/aptitude", color: "from-yellow-500 to-orange-400" },
    { icon: Briefcase, label: "Interview", to: "/interview", color: "from-green-500 to-emerald-400" },
    { icon: Compass, label: "Career", to: "/career", color: "from-purple-500 to-pink-400" },
    { icon: Rocket, label: "Startup", to: "/startup", color: "from-red-500 to-orange-400" },
    { icon: Users, label: "Mentors", to: "/characters", color: "from-indigo-500 to-blue-400" },
  ];

  return (
    <div className="min-h-screen pb-24 md:pt-16 px-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/30" style={{ boxShadow: `0 0 30px -5px ${character?.glowColor || "rgba(59,130,246,0.4)"}` }}>
            {character?.image ? (
              <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">X</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back! 🔥
            </h1>
            <p className="text-sm text-muted-foreground">
              {character?.name || "XOVA"} is ready to help you learn today
            </p>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{streak}</span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: Trophy, label: "Streak", value: `${streak} days`, color: "text-orange-400" },
            { icon: Target, label: "Questions", value: totalQuestions.toString(), color: "text-primary" },
            { icon: TrendingUp, label: "Accuracy", value: `${accuracy}%`, color: "text-green-400" },
          ].map((stat, i) => (
            <div key={stat.label} className="surface-card p-4 text-center">
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Daily Missions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-foreground">Daily Missions</h2>
          </div>
          <div className="space-y-3">
            {missions.map((mission) => {
              const completed = mission.current >= mission.target;
              return (
                <Link key={mission.id} to={mission.link} className="surface-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors block">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${completed ? "bg-green-500/10" : "bg-secondary"}`}>
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <mission.icon className={`w-5 h-5 ${mission.color}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {mission.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{mission.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{mission.current}/{mission.target}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Access Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  to={item.to}
                  className="surface-card p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all group block"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mentor Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/mentor" className="surface-card p-6 flex items-center gap-4 hover:border-primary/30 transition-all block">
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/20" style={{ boxShadow: `0 0 40px -10px ${character?.glowColor}` }}>
              {character?.image ? (
                <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">X</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Talk to {character?.name || "XOVA"}</h3>
              <p className="text-sm text-muted-foreground">Voice conversation with your AI mentor</p>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Available now</span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
