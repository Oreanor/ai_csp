import type { Candidate } from "@/types/interview";

/** English / generic voice-name hints (browser catalog varies by OS). */
const FEMALE_NAME_RE =
  /\b(female|woman|zira|susan|linda|emma|victoria|joanna|aria|jenny|heather|hazel|sonia|lisa|sarah|karen|amy|ivy|joana|ines|maria|lucia|sofia|ana|helena|beatriz|camila|fernanda|isabel|carla|laura|paula|raquel|teresa|clara|diana|elena|natalia|patricia|sandra|vanessa)\b/i;
const MALE_NAME_RE =
  /\b(male|man|david|mark|daniel|george|thomas|andrew|brian|james|john|ryan|jorge|ricardo|miguel|antonio|carlos|pedro|manuel|francisco|luis|paulo|rodrigo|diego|fernando|gabriel|hugo|ivo|joão|jose|marco|nelson|raul|sergio|tiago|vicente)\b/i;

function nameSoundsFemale(fullName: string): boolean {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? "").toLowerCase();
  const last = (parts[parts.length - 1] ?? "").toLowerCase();
  const commonFemaleFirst = new Set([
    "maria",
    "ana",
    "lisa",
    "sara",
    "sarah",
    "emma",
    "julia",
    "laura",
    "sofia",
    "ines",
    "joana",
    "beatriz",
    "carla",
    "helena",
    "patricia",
    "fernanda",
    "camila",
    "isabel",
    "natalia",
    "vanessa",
    "clara",
    "diana",
    "elena",
    "paula",
    "raquel",
    "teresa",
    "lucia",
    "lúcia",
  ]);
  if (commonFemaleFirst.has(first)) return true;
  // Very rough Latin-style first name: ends in 'a' but not 'ma'/'pa' exceptions
  if (first.length >= 3 && first.endsWith("a") && !first.endsWith("ma") && first !== "luca") {
    return true;
  }
  if (last.length >= 3 && last.endsWith("a") && commonFemaleFirst.has(last)) return true;
  return false;
}

/**
 * Pick a speechSynthesis voice for the candidate using name heuristics + catalog keywords.
 * Falls back to browser default for the locale list, then first listed voice.
 */
export function inferVoiceUriForCandidate(
  voicesForLocale: SpeechSynthesisVoice[],
  candidate: Pick<Candidate, "name" | "id">,
): string | null {
  if (voicesForLocale.length === 0) return null;

  const def = voicesForLocale.find((v) => v.default);
  if (def) return def.voiceURI;

  const females = voicesForLocale.filter((v) => FEMALE_NAME_RE.test(v.name));
  const males = voicesForLocale.filter((v) => MALE_NAME_RE.test(v.name));

  const preferFemale = nameSoundsFemale(candidate.name);
  if (preferFemale && females.length > 0) return females[0].voiceURI;
  if (!preferFemale && males.length > 0) return males[0].voiceURI;
  if (females.length > 0) return females[0].voiceURI;
  if (males.length > 0) return males[0].voiceURI;

  const idx = Math.abs(hashString(candidate.id)) % voicesForLocale.length;
  return voicesForLocale[idx]?.voiceURI ?? voicesForLocale[0].voiceURI;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
