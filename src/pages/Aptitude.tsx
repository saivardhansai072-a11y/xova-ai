import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, BookOpen, Code, Calculator, Globe, Lightbulb } from "lucide-react";
import MentorAvatar from "@/components/MentorAvatar";

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
};

type Category = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
};

const categories: Category[] = [
  { id: "cs", name: "Computer Science", icon: Code, color: "text-primary" },
  { id: "math", name: "Mathematics", icon: Calculator, color: "text-mentor-thinking" },
  { id: "general", name: "General Knowledge", icon: Globe, color: "text-mentor-celebrating" },
  { id: "logic", name: "Logical Reasoning", icon: Lightbulb, color: "text-mentor-listening" },
];

const allQuestions: Question[] = [
  // Computer Science
  { id: 1, category: "cs", question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: 1, explanation: "Binary search divides the search space in half each iteration, giving O(log n) complexity." },
  { id: 2, category: "cs", question: "Which data structure uses FIFO ordering?", options: ["Stack", "Queue", "Tree", "Graph"], correct: 1, explanation: "A Queue follows First-In-First-Out (FIFO) ordering." },
  { id: 3, category: "cs", question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct: 0, explanation: "HTML stands for HyperText Markup Language." },
  { id: 4, category: "cs", question: "Which sorting algorithm has O(n log n) average-case complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correct: 2, explanation: "Merge Sort has O(n log n) average-case time complexity." },
  { id: 5, category: "cs", question: "What does API stand for?", options: ["Application Programming Interface", "Applied Program Integration", "Automated Protocol Interface", "Application Process Interconnect"], correct: 0, explanation: "API stands for Application Programming Interface — a way for software to communicate." },
  // Math
  { id: 6, category: "math", question: "What is the result of 2^10?", options: ["512", "1024", "2048", "256"], correct: 1, explanation: "2^10 = 1024. This is fundamental in computing." },
  { id: 7, category: "math", question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], correct: 1, explanation: "Using the power rule, d/dx(x²) = 2x." },
  { id: 8, category: "math", question: "What is the value of π (pi) to 2 decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], correct: 1, explanation: "π ≈ 3.14159... rounded to 2 decimal places is 3.14." },
  { id: 9, category: "math", question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correct: 2, explanation: "√144 = 12 because 12 × 12 = 144." },
  { id: 10, category: "math", question: "What is 15% of 200?", options: ["25", "30", "35", "40"], correct: 1, explanation: "15% of 200 = 0.15 × 200 = 30." },
  // General
  { id: 11, category: "general", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, explanation: "Mars is called the Red Planet due to iron oxide on its surface." },
  { id: 12, category: "general", question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "NaCl", "O2"], correct: 0, explanation: "Water is H2O — two hydrogen atoms and one oxygen atom." },
  { id: 13, category: "general", question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"], correct: 1, explanation: "Leonardo da Vinci painted the Mona Lisa in the early 16th century." },
  { id: 14, category: "general", question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, explanation: "The Pacific Ocean is the largest, covering about 63 million square miles." },
  { id: 15, category: "general", question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, explanation: "Plants absorb CO2 for photosynthesis, releasing oxygen." },
  // Logic
  { id: 16, category: "logic", question: "If all roses are flowers and some flowers fade quickly, which is true?", options: ["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "Roses are not flowers"], correct: 1, explanation: "Since some flowers fade quickly and roses are flowers, some roses may fade quickly." },
  { id: 17, category: "logic", question: "What comes next: 2, 6, 18, 54, ?", options: ["108", "162", "148", "216"], correct: 1, explanation: "Each number is multiplied by 3: 54 × 3 = 162." },
  { id: 18, category: "logic", question: "If A > B and B > C, then:", options: ["A < C", "A = C", "A > C", "Cannot determine"], correct: 2, explanation: "By transitivity: if A > B and B > C, then A > C." },
  { id: 19, category: "logic", question: "Find the odd one out: Apple, Mango, Potato, Banana", options: ["Apple", "Mango", "Potato", "Banana"], correct: 2, explanation: "Potato is a vegetable; the rest are fruits." },
  { id: 20, category: "logic", question: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], correct: 1, explanation: "At 3:15, the minute hand is at 90° and the hour hand is at 97.5°, so the angle is 7.5°." },
];

type Progress = Record<string, { total: number; correct: number; attempted: number[] }>;

export default function AptitudePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = localStorage.getItem("xova-progress");
    return saved ? JSON.parse(saved) : {};
  });

  const categoryQuestions = allQuestions.filter((q) => q.category === selectedCategory);
  const q = categoryQuestions[currentQ];

  const saveProgress = (cat: string, correct: boolean) => {
    setProgress((prev) => {
      const catProgress = prev[cat] || { total: 0, correct: 0, attempted: [] };
      const updated = {
        ...prev,
        [cat]: {
          total: catProgress.total + 1,
          correct: catProgress.correct + (correct ? 1 : 0),
          attempted: [...catProgress.attempted, q?.id || 0],
        },
      };
      localStorage.setItem("xova-progress", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    saveProgress(selectedCategory!, isCorrect);
  };

  const handleNext = () => {
    if (currentQ + 1 >= categoryQuestions.length) {
      setFinished(true);
    } else {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    handleRestart();
  };

  // Category selection
  if (!selectedCategory) {
    return (
      <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aptitude Training</h1>
          <p className="text-muted-foreground mb-8">Choose a category to start learning. Track your progress over time.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((cat, i) => {
              const catProgress = progress[cat.id];
              const pct = catProgress ? Math.round((catProgress.correct / catProgress.total) * 100) : 0;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="surface-card p-5 text-left hover:border-primary/30 transition-colors group"
                >
                  <cat.icon className={`w-6 h-6 ${cat.color} mb-3`} />
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allQuestions.filter((q) => q.category === cat.id).length} questions
                  </p>
                  {catProgress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{catProgress.total} attempted</span>
                        <span>{pct}% correct</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Overall stats */}
          {Object.keys(progress).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 surface-card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Overall Progress</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-foreground">
                    {Object.values(progress).reduce((a, b) => a + b.total, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Attempted</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-mentor-celebrating">
                    {Object.values(progress).reduce((a, b) => a + b.correct, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary">
                    {Math.round(
                      (Object.values(progress).reduce((a, b) => a + b.correct, 0) /
                        Math.max(1, Object.values(progress).reduce((a, b) => a + b.total, 0))) *
                        100
                    )}%
                  </div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  if (finished) {
    const pct = Math.round((score / categoryQuestions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pb-24 md:pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="surface-card p-8 text-center max-w-md w-full">
          <MentorAvatar state={pct >= 60 ? "celebrating" : "explaining"} size="md" />
          <Trophy className="w-12 h-12 text-mentor-celebrating mx-auto mt-6" />
          <h2 className="text-2xl font-bold text-foreground mt-4">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-gradient-primary mt-2">{pct}%</p>
          <p className="text-muted-foreground mt-2">{score} out of {categoryQuestions.length} correct</p>
          <p className="text-sm text-muted-foreground mt-1">
            {pct >= 80 ? "Outstanding!" : pct >= 60 ? "Good job, keep going!" : "Don't give up!"}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={handleRestart} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-foreground font-medium hover:opacity-90 transition-opacity">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={handleBack} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Categories
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz
  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={handleBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          ← Back to categories
        </button>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground font-medium">
            Question {currentQ + 1} of {categoryQuestions.length}
          </span>
          <span className="text-sm font-medium text-primary">Score: {score}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full mb-8">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentQ + 1) / categoryQuestions.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-semibold text-foreground mb-6">{q.question}</h2>
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let cls = "surface-card p-4 cursor-pointer hover:border-primary/40 transition-all";
                if (answered) {
                  if (idx === q.correct) cls = "surface-card p-4 border-mentor-celebrating/60 bg-mentor-celebrating/10";
                  else if (idx === selected) cls = "surface-card p-4 border-destructive/60 bg-destructive/10";
                }
                return (
                  <motion.button key={idx} onClick={() => handleSelect(idx)} className={`w-full text-left flex items-center gap-3 ${cls}`} whileTap={!answered ? { scale: 0.98 } : {}}>
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0">{String.fromCharCode(65 + idx)}</div>
                    <span className="text-sm text-foreground">{opt}</span>
                    {answered && idx === q.correct && <CheckCircle2 className="w-5 h-5 text-mentor-celebrating ml-auto flex-shrink-0" />}
                    {answered && idx === selected && idx !== q.correct && <XCircle className="w-5 h-5 text-destructive ml-auto flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 surface-card p-4">
                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Explanation: </span>{q.explanation}</p>
              </motion.div>
            )}
            {answered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex justify-end">
                <button onClick={handleNext} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                  {currentQ + 1 >= categoryQuestions.length ? "See Results" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
