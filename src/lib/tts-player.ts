// Centralized TTS player with audio element tracking for lip-sync

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;

type TTSListener = (audio: HTMLAudioElement | null) => void;

let currentAudio: HTMLAudioElement | null = null;
const listeners = new Set<TTSListener>();

export function onTTSAudioChange(listener: TTSListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify(audio: HTMLAudioElement | null) {
  currentAudio = audio;
  listeners.forEach(fn => fn(audio));
}

export function stopTTS() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    notify(null);
  }
  window.speechSynthesis?.cancel();
}

function splitText(text: string, maxLen: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if (!s) continue;
    const candidate = current ? `${current} ${s}` : s;
    if (candidate.length <= maxLen) { current = candidate; continue; }
    if (current) chunks.push(current);
    if (s.length <= maxLen) { current = s; continue; }
    for (let i = 0; i < s.length; i += maxLen) chunks.push(s.slice(i, i + maxLen));
    current = "";
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function speakText(text: string, voiceId?: string): Promise<void> {
  stopTTS();

  const clean = text.replace(/[#*`_~\[\]()>]/g, "").replace(/\n+/g, ". ").trim();
  const chunks = splitText(clean, 420);
  if (!chunks.length) return;

  for (const chunk of chunks) {
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: chunk, voiceId }),
      });

      if (!resp.ok) throw new Error(`TTS ${resp.status}`);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      notify(audio);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => { URL.revokeObjectURL(url); notify(null); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); notify(null); reject(new Error("playback failed")); };
        audio.play().catch(err => { URL.revokeObjectURL(url); notify(null); reject(err); });
      });
    } catch {
      // Fallback to browser speech for this chunk
      await new Promise<void>(resolve => {
        if (!("speechSynthesis" in window)) { resolve(); return; }
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.rate = 0.95;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
  }
}
