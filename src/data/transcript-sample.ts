import type { ConversationLanguage } from "@/types/interview";

/** Sample transcript body shown in the voice-first panel (PoC placeholder). */
export const transcriptSampleByLanguage: Record<ConversationLanguage, string> = {
  en: "It was a monolith-to-microservices migration in a fintech with around two million users and zero downtime constraints.",
  pt: "Foi uma migração de monólito para microsserviços numa fintech com cerca de dois milhões de utilizadores e requisito de zero downtime.",
};
