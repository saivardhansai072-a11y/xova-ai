import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  selected_character: string | null;
  streak: number;
  last_visit: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setLoading(false);
        return;
      }

      const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || null;
      const { data: created } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: fallbackName,
          avatar_url: null,
          selected_character: null,
          streak: 0,
          last_visit: null,
        }, { onConflict: "id" })
        .select("*")
        .single();

      if (created) setProfile(created as Profile);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const payload = {
      id: user.id,
      ...updates,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (!error && data) setProfile(data as Profile);

    return { error };
  };

  return { profile, loading, updateProfile };
}
