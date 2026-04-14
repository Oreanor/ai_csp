export type CandidateStatus = "online" | "offline";

export type ConversationLanguage = "en" | "pt";

export type TopModalView = "sessions" | "history" | "settings";

export function isConversationLanguage(
  value: string | null,
): value is ConversationLanguage {
  return value === "en" || value === "pt";
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
  /** Raw CV text (PoC: pasted or from .txt upload). */
  cvText?: string;
};

export type InterviewMessage = {
  id: string;
  from: "candidate" | "interviewer";
  text: Record<ConversationLanguage, string>;
};
