import type { InterviewMessage } from "@/types/interview";

export const seedInterviewMessages: InterviewMessage[] = [
  {
    id: "m1",
    from: "candidate",
    text: {
      en: "Hello! Nice to meet you. Should I start with distributed systems or API architecture?",
      pt: "Olá! Prazer em conhecê-lo. Quer que eu comece por sistemas distribuídos ou arquitetura de APIs?",
    },
  },
  {
    id: "m2",
    from: "interviewer",
    text: {
      en: "Tell me about the most complex project in your career.",
      pt: "Fale sobre o projeto mais complexo da sua carreira.",
    },
  },
];
