import type { ConversationLanguage } from "@/types/interview";

export function isBrowserTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Prefer voices whose BCP-47 tag matches the UI interview language. */
export function filterVoicesForLocale(
  voices: SpeechSynthesisVoice[],
  locale: ConversationLanguage,
): SpeechSynthesisVoice[] {
  const prefix = locale === "pt" ? "pt" : "en";
  const norm = (lang: string) => lang.replace("_", "-").toLowerCase();
  const primary = voices.filter((v) => norm(v.lang).startsWith(prefix));
  const list = primary.length > 0 ? primary : voices;
  return [...list].sort((a, b) => {
    const c = a.lang.localeCompare(b.lang);
    return c !== 0 ? c : a.name.localeCompare(b.name);
  });
}

export function pickDefaultVoice(
  voices: SpeechSynthesisVoice[],
  locale: ConversationLanguage,
): SpeechSynthesisVoice | null {
  const list = filterVoicesForLocale(voices, locale);
  if (list.length === 0) return null;
  return list.find((v) => v.default) ?? list[0];
}

export function findVoiceByUri(
  voices: SpeechSynthesisVoice[],
  voiceURI: string,
): SpeechSynthesisVoice | null {
  return voices.find((v) => v.voiceURI === voiceURI) ?? null;
}

export function stopBrowserTts(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function speakBrowserTts(
  text: string,
  options: {
    voice: SpeechSynthesisVoice | null;
    rate: number;
    pitch: number;
    langFallback: ConversationLanguage;
  },
): SpeechSynthesisUtterance {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (options.voice) {
    u.voice = options.voice;
    u.lang = options.voice.lang;
  } else {
    u.lang = options.langFallback === "pt" ? "pt-BR" : "en-US";
  }
  u.rate = options.rate;
  u.pitch = options.pitch;
  synth.speak(u);
  return u;
}
