import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, ChevronLeft, Search, BookOpen, TrendingUp } from "lucide-react";
import { aptitudeTopics, AptitudeTopic, AptitudeSubtopic, AptitudeQuestion, totalTopicCount, totalQuestionCount } from "@/lib/aptitude-data";

type Progress = Record<string, { total: number; correct: number }>;

export default function AptitudePage() {
  const [selectedTopic, setSelectedTopic] = useState<AptitudeTopic | null>(null);
  const [selectedSub, setSelectedSub] = useState<AptitudeSubtopic | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = localStorage.getItem("xova-apt-progress");
    return saved ? JSON.parse(saved) : {};
  });

  const questions = selectedSub?.questions || [];
  const q = questions[currentQ];

  const saveProgress = (key: string, correct: boolean) => {
    setProgress((prev) => {
      const p = prev[key] || { total: 0, correct: 0 };
      const updated = { ...prev, [key]: { total: p.total + 1, correct: p.correct + (correct ? 1 : 0) } };
      localStorage.setItem("xova-apt-progress", JSON.stringify(updated));
      // Also update legacy progress for dashboard
      const legacy = JSON.parse(localStorage.getItem("xova-progress") || "{}");
      const cat = selectedTopic?.id || "general";
      const lp = legacy[cat] || { total: 0, correct: 0, attempted: [] };
      legacy[cat] = { total: lp.total + 1, correct: lp.correct + (correct ? 1 : 0), attempted: [...lp.attempted] };
      localStorage.setItem("xova-progress", JSON.stringify(legacy));
      return updated;
    });
  };

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    saveProgress(`${selectedTopic?.id}-${selectedSub?.id}`, isCorrect);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const autoAdvance = () => {
    // Find next subtopic in current topic, or next topic
    if (selectedTopic) {
      const subIdx = selectedTopic.subtopics.indexOf(selectedSub!);
      if (subIdx < selectedTopic.subtopics.length - 1) {
        startSubtopic(selectedTopic.subtopics[subIdx + 1]);
        return;
      }
      // Find next topic
      const topicIdx = aptitudeTopics.indexOf(selectedTopic);
      if (topicIdx < aptitudeTopics.length - 1) {
        const nextTopic = aptitudeTopics[topicIdx + 1];
        setSelectedTopic(nextTopic);
        startSubtopic(nextTopic.subtopics[0]);
        return;
      }
    }
    // Back to topics
    goBack();
  };

  const startSubtopic = (sub: AptitudeSubtopic) => {
    setSelectedSub(sub);
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  };

  const goBack = () => {
    if (finished || selectedSub) {
      setSelectedSub(null);
      setFinished(false);
      setCurrentQ(0);
      setSelected(null);
      setScore(0);
      setAnswered(false);
    } else {
      setSelectedTopic(null);
    }
  };

  const filteredTopics = aptitudeTopics.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempted = Object.values(progress).reduce((a, p) => a + p.total, 0);
  const totalCorrect = Object.values(progress).reduce((a, p) => a + p.correct, 0);
  const overallAcc = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Topic selection
  if (!selectedTopic) {
    return (
      <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Aptitude Training</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {totalTopicCount} topics · {totalQuestionCount}+ questions
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="surface-card p-3 text-center">
              <div className="text-lg font-bold text-foreground">{totalAttempted}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Attempted</div>
            </div>
            <div className="surface-card p-3 text-center">
              <div className="text-lg font-bold text-green-400">{totalCorrect}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Correct</div>
            </div>
            <div className="surface-card p-3 text-center">
              <div className="text-lg font-bold text-primary">{overallAcc}%</div>
              <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Topics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredTopics.map((topic, i) => {
              const key = topic.id;
              const p = Object.entries(progress)
                .filter(([k]) => k.startsWith(key))
                .reduce((acc, [, v]) => ({ total: acc.total + v.total, correct: acc.correct + v.correct }), { total: 0, correct: 0 });
              const pct = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
              const totalQ = topic.subtopics.reduce((a, s) => a + s.questions.length, 0);

              return (
                <motion.button
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedTopic(topic)}
                  className="surface-card p-3 text-left hover:border-primary/30 transition-colors group"
                >
                  <div className="text-2xl mb-2">{topic.icon}</div>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{topic.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {totalQ} Qs · {topic.subtopics.length} sets
                  </p>
                  {p.total > 0 && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-secondary rounded-full">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{pct}%</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Subtopic selection
  if (!selectedSub) {
    return (
      <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
        <div className="max-w-2xl mx-auto">
          <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> All Topics
          </button>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{selectedTopic.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-foreground">{selectedTopic.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedTopic.subtopics.length} question sets</p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedTopic.subtopics.map((sub, i) => {
              const key = `${selectedTopic.id}-${sub.id}`;
              const p = progress[key];
              const pct = p ? Math.round((p.correct / p.total) * 100) : 0;
              return (
                <motion.button
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => startSubtopic(sub)}
                  className="w-full surface-card p-4 text-left flex items-center gap-4 hover:border-primary/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedTopic.color} flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground">{sub.questions.length} questions</p>
                  </div>
                  {p && (
                    <div className="text-right">
                      <span className="text-xs font-medium text-primary">{pct}%</span>
                      <p className="text-[10px] text-muted-foreground">{p.total} done</p>
                    </div>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-24 md:pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="surface-card p-8 text-center max-w-md w-full">
          <Trophy className={`w-12 h-12 mx-auto ${pct >= 80 ? "text-yellow-400" : pct >= 60 ? "text-primary" : "text-muted-foreground"}`} />
          <h2 className="text-2xl font-bold text-foreground mt-4">Set Complete!</h2>
          <p className="text-4xl font-bold text-gradient-primary mt-2">{pct}%</p>
          <p className="text-muted-foreground mt-2">{score}/{questions.length} correct</p>
          <p className="text-sm text-muted-foreground mt-1">
            {pct >= 80 ? "Outstanding! 🔥" : pct >= 60 ? "Good job! Keep going! 💪" : "Keep practicing! You'll get there! ✨"}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => startSubtopic(selectedSub)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={autoAdvance} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              Next Set <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={goBack} className="text-xs text-muted-foreground mt-4 hover:text-foreground">
            Back to {selectedTopic.name}
          </button>
        </motion.div>
      </div>
    );
  }

  // Quiz
  return (
    <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> {selectedTopic.name}
        </button>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{selectedSub.name} · Q{currentQ + 1}/{questions.length}</span>
          <span className="text-sm font-medium text-primary">Score: {score}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full mb-6">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-semibold text-foreground mb-5">{q.question}</h2>
            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                let cls = "surface-card p-3.5 cursor-pointer hover:border-primary/40 transition-all";
                if (answered) {
                  if (idx === q.correct) cls = "surface-card p-3.5 border-green-500/60 bg-green-500/10";
                  else if (idx === selected) cls = "surface-card p-3.5 border-destructive/60 bg-destructive/10";
                }
                return (
                  <motion.button key={idx} onClick={() => handleSelect(idx)} className={`w-full text-left flex items-center gap-3 ${cls}`} whileTap={!answered ? { scale: 0.98 } : {}}>
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm text-foreground">{opt}</span>
                    {answered && idx === q.correct && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto flex-shrink-0" />}
                    {answered && idx === selected && idx !== q.correct && <XCircle className="w-4 h-4 text-destructive ml-auto flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 surface-card p-4">
                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Explanation: </span>{q.explanation}</p>
              </motion.div>
            )}
            {answered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex justify-end">
                <button onClick={handleNext} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                  {currentQ + 1 >= questions.length ? "Results" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
