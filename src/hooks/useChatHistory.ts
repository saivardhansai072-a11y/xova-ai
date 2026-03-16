import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function useChatHistory(characterId: string, mode: string = "chat") {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("character_id", characterId)
        .eq("mode", mode)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data && data.length > 0) {
        setMessages(
          (data as any[]).map((d) => ({ id: d.id, role: d.role, content: d.content }))
        );
      }
      setLoaded(true);
    };

    fetch();
  }, [user, characterId, mode]);

  const saveMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("chat_history").insert({
      user_id: user.id,
      character_id: characterId,
      role,
      content,
      mode,
    });
  }, [user, characterId, mode]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id)
      .eq("character_id", characterId)
      .eq("mode", mode);
    setMessages([]);
  }, [user, characterId, mode]);

  return { messages, setMessages, saveMessage, clearHistory, loaded };
}
