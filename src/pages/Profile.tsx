import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.display_name, profile?.avatar_url]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    const { error } = await updateProfile({
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    });

    if (error) {
      toast.error(error.message || "Could not update profile");
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  };

  const previewName = displayName || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen px-4 pb-24 md:pt-20 pt-8">
      <div className="max-w-xl mx-auto">
        <Link to="/settings" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to settings
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Edit profile</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Update your name and avatar used across the app.</p>

        <div className="surface-card p-4 flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-foreground">{previewName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{previewName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="Avatar image URL (https://...)"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
