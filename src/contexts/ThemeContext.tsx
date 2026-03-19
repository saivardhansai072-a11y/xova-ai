import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSelectedCharacterId, getCharacterById, AICharacter } from "@/lib/characters";

type CharacterTheme = {
  primary: string;
  accent: string;
  ring: string;
  mentorGlow: string;
  sidebarPrimary: string;
};

const characterThemes: Record<string, CharacterTheme> = {
  goku: {
    primary: "35 92% 55%",
    accent: "45 97% 54%",
    ring: "35 92% 55%",
    mentorGlow: "35 92% 55%",
    sidebarPrimary: "35 92% 55%",
  },
  naruto: {
    primary: "24 95% 53%",
    accent: "217 91% 60%",
    ring: "24 95% 53%",
    mentorGlow: "24 95% 53%",
    sidebarPrimary: "24 95% 53%",
  },
  luffy: {
    primary: "0 84% 60%",
    accent: "45 97% 54%",
    ring: "0 84% 60%",
    mentorGlow: "0 84% 60%",
    sidebarPrimary: "0 84% 60%",
  },
  hinata: {
    primary: "239 84% 67%",
    accent: "270 60% 55%",
    ring: "239 84% 67%",
    mentorGlow: "239 84% 67%",
    sidebarPrimary: "239 84% 67%",
  },
  mikasa: {
    primary: "0 72% 45%",
    accent: "220 9% 46%",
    ring: "0 72% 45%",
    mentorGlow: "0 72% 45%",
    sidebarPrimary: "0 72% 45%",
  },
  suzume: {
    primary: "330 81% 70%",
    accent: "199 89% 68%",
    ring: "330 81% 70%",
    mentorGlow: "330 81% 70%",
    sidebarPrimary: "330 81% 70%",
  },
};

const defaultTheme: CharacterTheme = {
  primary: "217.2 91.2% 59.8%",
  accent: "270 60% 55%",
  ring: "217.2 91.2% 59.8%",
  mentorGlow: "217.2 91.2% 59.8%",
  sidebarPrimary: "217.2 91.2% 59.8%",
};

type ThemeContextType = {
  currentCharacter: AICharacter | undefined;
  refreshTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  currentCharacter: undefined,
  refreshTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(characterId: string) {
  const theme = characterThemes[characterId] || defaultTheme;
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--mentor-glow", theme.mentorGlow);
  root.style.setProperty("--sidebar-primary", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-ring", theme.ring);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentCharacter, setCurrentCharacter] = useState<AICharacter | undefined>();

  const refreshTheme = () => {
    const id = getSelectedCharacterId();
    const char = getCharacterById(id);
    setCurrentCharacter(char);
    applyTheme(id);
  };

  useEffect(() => {
    refreshTheme();

    // Listen for storage changes (character selection)
    const handler = (e: StorageEvent) => {
      if (e.key === "xova-selected-character") refreshTheme();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentCharacter, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
