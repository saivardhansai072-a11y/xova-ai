import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, ChevronLeft, Search, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { aptitudeTopics, AptitudeTopic, AptitudeSubtopic, AptitudeQuestion } from "@/lib/aptitude-data";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AptitudePage() {
  const { progress, saveProgress, loaded } = useQuizProgress();
  const [selectedTopic, setSelectedTopic] = useState<AptitudeTopic | null>(null);
  const [selectedSub, setSelectedSub] = useState<AptitudeSubtopic | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [search, setSearch] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<AptitudeQuestion[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const usedQuestionIds = useRef<Set<number>>(new Set());

  const q = activeQuestions[currentQ];

  // When subtopic is selected, shuffle questions and skip already-seen ones
  const startSubtopic = useCallback((sub: AptitudeSubtopic) => {
    setSelectedSub(sub);
    const shuffled = shuffleArray(sub.questions);
    setActiveQuestions(shuffled);
    usedQuestionIds.current = new Set(shuffled.map((q) => q.id));
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  }, []);

  // Generate new AI questions when user finishes all hardcoded ones
  const generateAIQuestions = useCallback(async (topicName: string, subName: string) => {
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Generate exactly 5 new aptitude questions for the topic "${topicName}" > "${subName}". 
Each question must be unique and professional-level for job placement exams.

Return ONLY a JSON array in this exact format, no other text:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]

Make questions challenging but fair. correct is the 0-based index of the right answer.`,
            },
          ],
          mode: "career",
        },
      });

      if (error) throw error;

      // Parse SSE stream response to get the full text
      const text = typeof data === "string" ? data : "";
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          question: string;
          options: string[];
          correct: number;
          explanation: string;
        }>;

        const newQuestions: AptitudeQuestion[] = parsed.map((q, i) => ({
          id: Date.now() + i,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
        }));

        setActiveQuestions(newQuestions);
        setCurrentQ(0);
        setSelected(null);
        setScore(0);
        setAnswered(false);
        setFinished(false);
        toast.success("New AI-generated questions loaded!");
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (err) {
      console.error("AI question generation failed:", err);
      toast.error("Couldn't generate new questions. Reshuffling existing ones.");
      // Fallback: reshuffle existing questions
      if (selectedSub) {
        setActiveQuestions(shuffleArray(selectedSub.questions));
        setCurrentQ(0);
        setSelected(null);
        setScore(0);
        setAnswered(false);
        setFinished(false);
      }
    } finally {
      setGeneratingAI(false);
    }
  }, [selectedSub]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    if (selectedTopic && selectedSub) {
      saveProgress(selectedTopic.id, selectedSub.id, isCorrect);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= activeQuestions.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const autoAdvance = () => {
    if (selectedTopic && selectedSub) {
      // First try next subtopic within same topic
      const subIdx = selectedTopic.subtopics.indexOf(selectedSub);
      if (subIdx < selectedTopic.subtopics.length - 1) {
        setCurrentLevel((l) => l + 1);
        startSubtopic(selectedTopic.subtopics[subIdx + 1]);
        return;
      }
      // All hardcoded subtopics done — generate AI level automatically
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      toast.info(`Level ${nextLevel} — Generating new questions...`);
      generateAIQuestions(selectedTopic.name, `Level ${nextLevel}`);
      return;
    }
    goBack();
  };

  const goBack = () => {
    if (finished || selectedSub) {
      setSelectedSub(null);
      setFinished(false);
      setCurrentQ(0);
      setSelected(null);
      setScore(0);
      setAnswered(false);
      setActiveQuestions([]);
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

  // Topic list
  if (!selectedTopic) {
    return (
      <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Aptitude Training</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {aptitudeTopics.length} topics · Professional job placement practice
          </p>

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

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

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
                  <p className="text-[10px] text-muted-foreground mt-1">{totalQ} Qs · {topic.subtopics.length} sets</p>
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

  // Subtopic list
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

  // Finished screen
  if (finished) {
    const pct = Math.round((score / activeQuestions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-24 md:pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="surface-card p-8 text-center max-w-md w-full">
          <Trophy className={`w-12 h-12 mx-auto ${pct >= 80 ? "text-yellow-400" : pct >= 60 ? "text-primary" : "text-muted-foreground"}`} />
          <h2 className="text-2xl font-bold text-foreground mt-4">Level {currentLevel} Complete!</h2>
          <p className="text-4xl font-bold text-gradient-primary mt-2">{pct}%</p>
          <p className="text-muted-foreground mt-2">{score}/{activeQuestions.length} correct</p>
          <p className="text-sm text-muted-foreground mt-1">
            {pct >= 80 ? "Outstanding! 🔥" : pct >= 60 ? "Good job! Keep going! 💪" : "Keep practicing! You'll get there! ✨"}
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-3 justify-center">
              <button onClick={() => startSubtopic(selectedSub)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
              <button onClick={autoAdvance} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                Next Set <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => generateAIQuestions(selectedTopic.name, selectedSub.name)}
              disabled={generatingAI}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
            >
              {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generatingAI ? "Generating..." : "Generate New Questions (AI)"}
            </button>
          </div>
          <button onClick={goBack} className="text-xs text-muted-foreground mt-4 hover:text-foreground">
            Back to {selectedTopic.name}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!q) return null;

  // Quiz question
  return (
    <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> {selectedTopic.name}
        </button>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{selectedSub.name} · Q{currentQ + 1}/{activeQuestions.length}</span>
          <span className="text-sm font-medium text-primary">Score: {score}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full mb-6">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentQ + 1) / activeQuestions.length) * 100}%` }} />
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
                  {currentQ + 1 >= activeQuestions.length ? "Results" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
