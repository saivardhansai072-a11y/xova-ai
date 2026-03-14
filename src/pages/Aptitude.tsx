import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import MentorAvatar from "@/components/MentorAvatar";

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

const questionBank: Question[] = [
  {
    id: 1,
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1,
    explanation: "Binary search divides the search space in half each iteration, giving O(log n) complexity.",
  },
  {
    id: 2,
    question: "Which data structure uses FIFO ordering?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correct: 1,
    explanation: "A Queue follows First-In-First-Out (FIFO) ordering — the first element added is the first removed.",
  },
  {
    id: 3,
    question: "What does HTML stand for?",
    options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
    correct: 0,
    explanation: "HTML stands for HyperText Markup Language, used to structure content on the web.",
  },
  {
    id: 4,
    question: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
    correct: 2,
    explanation: "Merge Sort has O(n log n) average-case time complexity, which is optimal for comparison-based sorting.",
  },
  {
    id: 5,
    question: "What is the result of 2^10?",
    options: ["512", "1024", "2048", "256"],
    correct: 1,
    explanation: "2^10 = 1024. This is a fundamental value in computing (1 KB = 1024 bytes).",
  },
];

export default function AptitudePage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = questionBank[currentQ];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questionBank.length) {
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

  if (finished) {
    const pct = Math.round((score / questionBank.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pb-24 md:pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="surface-card p-8 text-center max-w-md w-full"
        >
          <MentorAvatar state={pct >= 60 ? "celebrating" : "explaining"} size="md" />
          <Trophy className="w-12 h-12 text-mentor-celebrating mx-auto mt-6" />
          <h2 className="text-2xl font-bold text-foreground mt-4">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-gradient-primary mt-2">{pct}%</p>
          <p className="text-muted-foreground mt-2">
            You got {score} out of {questionBank.length} correct
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {pct >= 80 ? "Outstanding performance!" : pct >= 60 ? "Good job, keep practicing!" : "Don't give up, try again!"}
          </p>
          <button
            onClick={handleRestart}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground font-medium">
            Question {currentQ + 1} of {questionBank.length}
          </span>
          <span className="text-sm font-medium text-primary">Score: {score}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full mb-8">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((currentQ + 1) / questionBank.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question */}
            <h2 className="text-xl font-semibold text-foreground mb-6">{q.question}</h2>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let optionClass = "surface-card p-4 cursor-pointer hover:border-primary/40 transition-all";
                if (answered) {
                  if (idx === q.correct) optionClass = "surface-card p-4 border-mentor-celebrating/60 bg-mentor-celebrating/10";
                  else if (idx === selected) optionClass = "surface-card p-4 border-destructive/60 bg-destructive/10";
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left flex items-center gap-3 ${optionClass}`}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm text-foreground">{opt}</span>
                    {answered && idx === q.correct && <CheckCircle2 className="w-5 h-5 text-mentor-celebrating ml-auto flex-shrink-0" />}
                    {answered && idx === selected && idx !== q.correct && <XCircle className="w-5 h-5 text-destructive ml-auto flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 surface-card p-4"
              >
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Explanation: </span>
                  {q.explanation}
                </p>
              </motion.div>
            )}

            {answered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                  {currentQ + 1 >= questionBank.length ? "See Results" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
