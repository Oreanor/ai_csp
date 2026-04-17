export type CandidateStatus = "online" | "offline";

export type ConversationLanguage = "en" | "pt";

/** STT request: fixed locale or Whisper auto-detect. */
export type SttLanguageMode = "auto" | "en" | "pt";

export type TopModalView = "sessions" | "history" | "settings";

export function isConversationLanguage(
  value: string | null,
): value is ConversationLanguage {
  return value === "en" || value === "pt";
}

export function isSttLanguageMode(value: string | null): value is SttLanguageMode {
  return value === "auto" || value === "en" || value === "pt";
}

/** How openly / talkatively the simulated candidate tends to behave in dialogue. */
export type CandidateSocialStyle = "introvert" | "ambivert" | "extrovert";

export function isCandidateSocialStyle(value: string | null): value is CandidateSocialStyle {
  return value === "introvert" || value === "ambivert" || value === "extrovert";
}

/** Spoken register — independent of app UI language. */
export type CandidateFormality = "formal" | "neutral" | "informal";

export function isCandidateFormality(value: string | null): value is CandidateFormality {
  return value === "formal" || value === "neutral" || value === "informal";
}

/** How the persona tends to react to stress or hard questions (not trivial small-talk). */
export type CandidateUnderPressure = "composed" | "verbose" | "humor" | "defensive";

export function isCandidateUnderPressure(value: string | null): value is CandidateUnderPressure {
  return (
    value === "composed" ||
    value === "verbose" ||
    value === "humor" ||
    value === "defensive"
  );
}

export type Candidate = {
  id: string;
  initials: string;
  name: string;
  role: string;
  status: CandidateStatus;
  seniority: string;
  background: string;
  skills: string[];
  traits: string[];
  motivation: string;
  communicationStyle: string;
  /** Introvert ↔ extrovert spectrum for tone and verbosity in replies. */
  socialStyle: CandidateSocialStyle;
  /** Formal vs informal address (PT: você vs tu); separate from UI locale. */
  formality: CandidateFormality;
  /** Pattern when the question is stressful or probing. */
  underPressure: CandidateUnderPressure;
  /** Raw CV text (PoC: pasted or from .txt upload). */
  cvText?: string;
};

export type InterviewMessage = {
  id: string;
  from: "candidate" | "interviewer";
  text: Record<ConversationLanguage, string>;
};

/** Browser-only interview session clock (Start → Pause/Resume → Stop). */
export type InterviewSessionMode = "idle" | "running" | "paused";
