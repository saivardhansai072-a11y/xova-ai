import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MessageCircle, Brain, Users, Briefcase, Compass, Rocket,
  Trophy, Target, Flame, Star, ChevronRight, Zap, TrendingUp,
  CheckCircle2, Clock, Mic, Code
} from "lucide-react";
import { getSelectedCharacterId, getCharacterById } from "@/lib/characters";
import { useAuth } from "@/contexts/AuthContext";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { useProfile } from "@/hooks/useProfile";
import { useActivityProgress } from "@/hooks/useActivityProgress";
import { getDailyMissions, getMissionProgress } from "@/lib/daily-missions";
import { DashboardSkeleton } from "@/components/PageSkeleton";

const iconMap: Record<string, React.ElementType> = {
  Brain, Briefcase, MessageCircle, Compass, Rocket, Mic, Code,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { progress } = useQuizProgress();
  const { activity } = useActivityProgress();

  const character = useMemo(() => {
    const id = getSelectedCharacterId();
    return getCharacterById(id);
  }, []);

  const [streak, setStreak] = useState(0);

  const totalQuestions = Object.values(progress).reduce((a, p) => a + p.total, 0);
  const totalCorrect = Object.values(progress).reduce((a, p) => a + p.correct, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    const lastVisit = profile.last_visit;
    if (lastVisit === today) {
      setStreak(profile.streak);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = lastVisit === yesterday ? profile.streak + 1 : 1;
      setStreak(newStreak);
      updateProfile({ streak: newStreak, last_visit: today });
    }
  }, [profile]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Learner";

  // Daily missions with refresh
  const dailyMissions = getDailyMissions();
  const missionProgress = getMissionProgress();

  const activityMap: Record<string, number> = {
    aptitude: totalQuestions,
    interview: activity.interviewTurns,
    chat: activity.chatTurns,
    career: 0,
    mentor: 0,
    startup: 0,
  };

  const missions = dailyMissions.map(m => ({
    ...m,
    current: Math.min(missionProgress[m.trackKey] || activityMap[m.trackKey] || 0, m.target),
    IconComponent: iconMap[m.icon] || Brain,
  }));

  const completedCount = missions.filter(m => m.current >= m.target).length;

  if (loading) return <DashboardSkeleton />;

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
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
            <h1 className="text-2xl font-bold text-foreground">Hey, {displayName}! 🔥</h1>
            <p className="text-sm text-muted-foreground">{character?.name || "XOVA"} is ready to help you learn today</p>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{streak}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Trophy, label: "Streak", value: `${streak} days`, color: "text-orange-400" },
            { icon: Target, label: "Questions", value: totalQuestions.toString(), color: "text-primary" },
            { icon: TrendingUp, label: "Accuracy", value: `${accuracy}%`, color: "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card p-4 text-center">
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-foreground">Daily Missions</h2>
            </div>
            <span className="text-xs text-muted-foreground">{completedCount}/{missions.length} done · Refreshes at 12 PM</span>
          </div>
          <div className="space-y-3">
            {missions.map((mission) => {
              const completed = mission.current >= mission.target;
              return (
                <Link key={mission.id} to={mission.link} className="surface-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors block">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${completed ? "bg-green-500/10" : "bg-secondary"}`}>
                    {completed ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <mission.IconComponent className={`w-5 h-5 ${mission.color}`} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{mission.title}</h3>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Link to={item.to} className="surface-card p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-all group block">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
