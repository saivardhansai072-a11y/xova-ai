import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ActivityProgress = {
  chatTurns: number;
  interviewTurns: number;
};

export function useActivityProgress() {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityProgress>({ chatTurns: 0, interviewTurns: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActivity({ chatTurns: 0, interviewTurns: 0 });
      setLoading(false);
      return;
    }

    const fetchCounts = async () => {
      setLoading(true);

      const [chatRes, interviewRes] = await Promise.all([
        supabase
          .from("chat_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("mode", "chat")
          .eq("role", "user"),
        supabase
          .from("chat_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .like("mode", "interview-%")
          .eq("role", "user"),
      ]);

      setActivity({
        chatTurns: chatRes.count ?? 0,
        interviewTurns: interviewRes.count ?? 0,
      });

      setLoading(false);
    };

    fetchCounts();
  }, [user]);

  return { activity, loading };
}
