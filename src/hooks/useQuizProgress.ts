import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Progress = Record<string, { total: number; correct: number }>;

export function useQuizProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("quiz_progress")
        .select("*")
        .eq("user_id", user.id);
      
      if (data) {
        const p: Progress = {};
        for (const row of data as any[]) {
          p[`${row.topic_id}-${row.subtopic_id}`] = {
            total: row.total_attempted,
            correct: row.total_correct,
          };
        }
        setProgress(p);
      }
      setLoaded(true);
    };

    fetch();
  }, [user]);

  const saveProgress = useCallback(async (topicId: string, subtopicId: string, correct: boolean) => {
    if (!user) return;

    const key = `${topicId}-${subtopicId}`;
    const current = progress[key] || { total: 0, correct: 0 };
    const updated = {
      total: current.total + 1,
      correct: current.correct + (correct ? 1 : 0),
    };

    setProgress((prev) => ({ ...prev, [key]: updated }));

    await supabase
      .from("quiz_progress")
      .upsert({
        user_id: user.id,
        topic_id: topicId,
        subtopic_id: subtopicId,
        total_attempted: updated.total,
        total_correct: updated.correct,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,topic_id,subtopic_id" });
  }, [user, progress]);

  return { progress, saveProgress, loaded };
}
