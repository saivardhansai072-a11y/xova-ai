import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Zap, Palette, Info } from "lucide-react";

interface SettingToggleProps {
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function SettingToggle({ label, description, icon: Icon, checked, onChange }: SettingToggleProps) {
  return (
    <div className="surface-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <motion.div
          className="absolute top-1 w-5 h-5 rounded-full bg-foreground"
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="space-y-3">
          <SettingToggle
            label="Voice Responses"
            description="Enable text-to-speech for mentor responses"
            icon={Volume2}
            checked={voiceEnabled}
            onChange={setVoiceEnabled}
          />
          <SettingToggle
            label="Animations"
            description="Enable mentor avatar animations"
            icon={Zap}
            checked={animations}
            onChange={setAnimations}
          />
          <SettingToggle
            label="High Contrast"
            description="Increase visual contrast for accessibility"
            icon={Palette}
            checked={highContrast}
            onChange={setHighContrast}
          />
        </div>

        <div className="mt-8 surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">About XOVA</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            XOVA is an AI-powered mentor platform that combines conversational AI, adaptive learning,
            and animated interactions to create a personalized educational experience.
          </p>
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>Built with ❤️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
