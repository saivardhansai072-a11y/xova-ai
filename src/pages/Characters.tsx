import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Sparkles, ArrowRight, X } from "lucide-react";
import {
  defaultCharacters,
  getCustomCharacters,
  saveCustomCharacter,
  deleteCustomCharacter,
  getSelectedCharacterId,
  setSelectedCharacterId,
  AICharacter,
  CustomCharacterData,
} from "@/lib/characters";
import { toast } from "sonner";

const colorOptions = [
  { label: "Emerald", value: "from-emerald-400 to-cyan-500" },
  { label: "Rose", value: "from-rose-400 to-pink-500" },
  { label: "Amber", value: "from-amber-400 to-orange-500" },
  { label: "Violet", value: "from-violet-400 to-purple-500" },
  { label: "Sky", value: "from-sky-400 to-blue-500" },
  { label: "Lime", value: "from-lime-400 to-green-500" },
];

function CharacterCard({
  character,
  isSelected,
  onSelect,
  onDelete,
}: {
  character: AICharacter;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative surface-card p-4 text-left transition-all group overflow-hidden ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/30"
      }`}
    >
      {/* Glow background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${character.color} opacity-0 group-hover:opacity-5 transition-opacity`}
      />

      {/* Character image */}
      <div className="relative flex justify-center mb-3">
        <div
          className="relative w-24 h-24 rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 8px 30px -8px ${character.glowColor}` }}
        >
          {character.image ? (
            <img
              src={character.image}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${character.color} flex items-center justify-center`}
            >
              <span className="text-2xl font-bold text-foreground">
                {character.name.charAt(0)}
              </span>
            </div>
          )}

          {/* 3D effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        {/* Floating particles */}
        <motion.div
          className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${character.color}`}
          animate={{
            y: [-5, -15, -5],
            x: [0, 5, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          style={{ top: 10, right: 20 }}
        />
        <motion.div
          className={`absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r ${character.color}`}
          animate={{
            y: [-3, -12, -3],
            x: [0, -4, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          style={{ top: 15, left: 25 }}
        />
      </div>

      {/* Info */}
      <h3 className="font-semibold text-foreground text-center text-sm">{character.name}</h3>
      <p className="text-xs text-muted-foreground text-center mt-0.5">{character.anime}</p>

      {/* Selected badge */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </motion.div>
      )}

      {/* Delete for custom */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-destructive-foreground" />
        </button>
      )}
    </motion.button>
  );
}

export default function CharactersPage() {
  const [selectedId, setSelectedId] = useState(getSelectedCharacterId());
  const [customChars, setCustomChars] = useState(getCustomCharacters());
  const [showCreator, setShowCreator] = useState(false);
  const [form, setForm] = useState<CustomCharacterData>({
    name: "",
    anime: "",
    personality: "",
    greeting: "",
    color: colorOptions[0].value,
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSelectedCharacterId(id);
    toast.success("Character selected!");
  };

  const handleDelete = (id: string) => {
    deleteCustomCharacter(id);
    setCustomChars(getCustomCharacters());
    if (selectedId === id) {
      setSelectedId("goku");
      setSelectedCharacterId("goku");
    }
    toast.success("Character deleted");
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.personality.trim() || !form.greeting.trim()) {
      toast.error("Please fill in name, personality, and greeting");
      return;
    }
    saveCustomCharacter(form);
    setCustomChars(getCustomCharacters());
    setForm({ name: "", anime: "", personality: "", greeting: "", color: colorOptions[0].value });
    setShowCreator(false);
    toast.success("Custom character created!");
  };

  return (
    <div className="min-h-screen px-6 pb-24 md:pt-20 pt-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Choose Your Mentor</h1>
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showCreator ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreator ? "Cancel" : "Create"}
          </button>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Each character has a unique 3D personality that guides your learning experience.
        </p>

        {/* Custom Creator */}
        <AnimatePresence>
          {showCreator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="surface-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Create Custom Character</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Character Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Sensei Zero"
                        className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Anime / Origin</label>
                      <input
                        value={form.anime}
                        onChange={(e) => setForm({ ...form, anime: e.target.value })}
                        placeholder="e.g. Custom, My Hero Academia"
                        className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Color Theme</label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setForm({ ...form, color: opt.value })}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${opt.value} ring-2 transition-all ${
                            form.color === opt.value ? "ring-foreground scale-110" : "ring-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Personality & Teaching Style *</label>
                    <textarea
                      value={form.personality}
                      onChange={(e) => setForm({ ...form, personality: e.target.value })}
                      placeholder="Describe how this character teaches, their catchphrases, personality traits, and teaching metaphors..."
                      rows={4}
                      className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Greeting Message *</label>
                    <textarea
                      value={form.greeting}
                      onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                      placeholder="What does this character say when they first meet the student?"
                      rows={2}
                      className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Character <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default Characters */}
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Anime Mentors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <AnimatePresence>
            {defaultCharacters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isSelected={selectedId === char.id}
                onSelect={() => handleSelect(char.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Custom Characters */}
        {customChars.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Your Custom Characters
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence>
                {customChars.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedId === char.id}
                    onSelect={() => handleSelect(char.id)}
                    onDelete={() => handleDelete(char.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
