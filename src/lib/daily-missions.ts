// Daily missions that refresh at 12pm every day

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  target: number;
  trackKey: string; // key to track progress
  link: string;
  color: string;
}

const missionPool: DailyMission[][] = [
  // Set A
  [
    { id: "apt5", title: "Solve 5 Aptitude Questions", description: "Sharpen your mind", icon: "Brain", target: 5, trackKey: "aptitude", link: "/aptitude", color: "text-primary" },
    { id: "int1", title: "Practice 1 Interview", description: "Prepare for success", icon: "Briefcase", target: 1, trackKey: "interview", link: "/interview", color: "text-yellow-400" },
    { id: "chat1", title: "Chat with Your Mentor", description: "Learn something new", icon: "MessageCircle", target: 1, trackKey: "chat", link: "/chat", color: "text-green-400" },
    { id: "career1", title: "Explore a Career Path", description: "Plan your future", icon: "Compass", target: 1, trackKey: "career", link: "/career", color: "text-purple-400" },
  ],
  // Set B
  [
    { id: "apt10", title: "Solve 10 Aptitude Questions", description: "Push your limits", icon: "Brain", target: 10, trackKey: "aptitude", link: "/aptitude", color: "text-primary" },
    { id: "int2", title: "Complete 2 Interview Rounds", description: "Build confidence", icon: "Briefcase", target: 2, trackKey: "interview", link: "/interview", color: "text-yellow-400" },
    { id: "mentor1", title: "Voice Chat with Mentor", description: "Practice speaking", icon: "Mic", target: 1, trackKey: "mentor", link: "/mentor", color: "text-green-400" },
    { id: "startup1", title: "Explore Startup Ideas", description: "Think entrepreneurial", icon: "Rocket", target: 1, trackKey: "startup", link: "/startup", color: "text-orange-400" },
  ],
  // Set C
  [
    { id: "apt7", title: "Solve 7 Aptitude Questions", description: "Stay consistent", icon: "Brain", target: 7, trackKey: "aptitude", link: "/aptitude", color: "text-primary" },
    { id: "chat3", title: "Ask 3 Questions to Mentor", description: "Curiosity wins", icon: "MessageCircle", target: 3, trackKey: "chat", link: "/chat", color: "text-green-400" },
    { id: "int1b", title: "Practice Technical Interview", description: "Crack the code", icon: "Code", target: 1, trackKey: "interview", link: "/interview", color: "text-yellow-400" },
    { id: "career2", title: "Research 2 Career Options", description: "Know your path", icon: "Compass", target: 2, trackKey: "career", link: "/career", color: "text-purple-400" },
  ],
  // Set D
  [
    { id: "apt3", title: "Solve 3 Hard Questions", description: "Quality over quantity", icon: "Brain", target: 3, trackKey: "aptitude", link: "/aptitude", color: "text-primary" },
    { id: "int3", title: "Complete HR Interview", description: "Soft skills matter", icon: "Briefcase", target: 1, trackKey: "interview", link: "/interview", color: "text-yellow-400" },
    { id: "chat2", title: "Learn a New Concept", description: "Expand knowledge", icon: "MessageCircle", target: 1, trackKey: "chat", link: "/chat", color: "text-green-400" },
    { id: "mentor2", title: "Get Career Advice", description: "Plan ahead", icon: "Compass", target: 1, trackKey: "career", link: "/career", color: "text-purple-400" },
  ],
];

function getCycleStart(now = new Date()): Date {
  const cycleStart = new Date(now);
  cycleStart.setHours(12, 0, 0, 0);
  if (now.getTime() < cycleStart.getTime()) {
    cycleStart.setDate(cycleStart.getDate() - 1);
  }
  return cycleStart;
}

export function getDailyMissions(): DailyMission[] {
  const cycleStart = getCycleStart();
  const dayIndex = Math.floor(cycleStart.getTime() / 86400000) % missionPool.length;
  return missionPool[dayIndex];
}

export function getCycleKey(): string {
  return getCycleStart().toISOString().split("T")[0];
}

export function getMissionProgress(): Record<string, number> {
  const key = `xova-missions-${getCycleKey()}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : {};
}

export function trackMissionProgress(trackKey: string, amount = 1) {
  const key = `xova-missions-${getCycleKey()}`;
  const progress = getMissionProgress();
  progress[trackKey] = (progress[trackKey] || 0) + amount;
  localStorage.setItem(key, JSON.stringify(progress));
}

// Clean up old mission data (keep only last 3 days)
export function cleanupOldMissions() {
  const today = getCycleKey();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("xova-missions-") && !k.endsWith(today)) {
      const dateStr = k.replace("xova-missions-", "");
      const diff = Date.now() - new Date(dateStr).getTime();
      if (diff > 3 * 86400000) localStorage.removeItem(k);
    }
  }
}
