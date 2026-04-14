"use client";

import { useMemo, useState } from "react";

type UiLanguage = "en" | "pt";
type ConversationLanguage = "en" | "pt";
type TopView = "sessions" | "history" | "settings" | null;

type Candidate = {
  id: string;
  initials: string;
  name: string;
  role: string;
  status: "online" | "offline";
  seniority: string;
  background: string;
  skills: string[];
  traits: string[];
  motivation: string;
  communicationStyle: string;
};

type Message = {
  id: string;
  from: "candidate" | "interviewer";
  text: {
    en: string;
    pt: string;
  };
};

const dictionary = {
  en: {
    appName: "AI Candidate",
    sessions: "Sessions",
    history: "History",
    settings: "Settings",
    candidates: "Candidates",
    newCandidate: "New candidate",
    pause: "Pause",
    stop: "Stop",
    live: "LIVE",
    profile: "Profile",
    session: "Session",
    experience: "Experience",
    techStack: "Tech stack",
    personality: "Personality",
    motivation: "Motivation",
    communicationStyle: "Communication style",
    editProfile: "Edit profile",
    inputPlaceholder: "Type your interview question...",
    listenState: "Listening",
    thinkState: "Thinking",
    speakState: "Speaking",
    candidateAnswering: "Candidate is answering",
    transcript: "Transcript",
    pressToSpeak: "Press to speak",
    textMode: "Text",
    showProfile: "Show profile",
    hideProfile: "Hide profile",
    interviewerTag: "HR",
    languagePortuguese: "Portuguese",
    languageEnglish: "English",
    topModalTitle: {
      sessions: "Session controls",
      history: "Conversation history",
      settings: "Workspace settings",
    },
    topModalDescription: {
      sessions:
        "Start, pause, restart, and finish interview sessions from this panel.",
      history:
        "Review timestamps, messages, and playback records after each session.",
      settings:
        "Configure prompt behavior, voice, and interface preferences for the PoC.",
    },
  },
  pt: {
    appName: "AI Candidate",
    sessions: "Sessoes",
    history: "Historico",
    settings: "Configuracoes",
    candidates: "Candidatos",
    newCandidate: "Novo candidato",
    pause: "Pausar",
    stop: "Parar",
    live: "AO VIVO",
    profile: "Perfil",
    session: "Sessao",
    experience: "Experiencia",
    techStack: "Stack tecnica",
    personality: "Personalidade",
    motivation: "Motivacao",
    communicationStyle: "Estilo de comunicacao",
    editProfile: "Editar perfil",
    inputPlaceholder: "Digite sua pergunta da entrevista...",
    listenState: "Escutando",
    thinkState: "Processando",
    speakState: "Falando",
    candidateAnswering: "Candidato esta respondendo",
    transcript: "Transcricao",
    pressToSpeak: "Pressione para falar",
    textMode: "Texto",
    showProfile: "Mostrar perfil",
    hideProfile: "Ocultar perfil",
    interviewerTag: "RH",
    languagePortuguese: "Portugues",
    languageEnglish: "Ingles",
    topModalTitle: {
      sessions: "Controles de sessao",
      history: "Historico da conversa",
      settings: "Configuracoes do workspace",
    },
    topModalDescription: {
      sessions:
        "Inicie, pause, reinicie e finalize entrevistas por este painel.",
      history:
        "Revise horarios, mensagens e reproducoes apos cada sessao.",
      settings:
        "Configure prompt, voz e preferencias da interface para o PoC.",
    },
  },
} satisfies Record<UiLanguage, Record<string, unknown>>;

const candidates: Candidate[] = [
  {
    id: "carlos",
    initials: "CA",
    name: "Carlos Almeida",
    role: "Senior Backend",
    status: "online",
    seniority: "Senior",
    background: "8 years in backend engineering, 3 years in fintech.",
    skills: ["Node.js", "Go", "PostgreSQL", "Kafka", "Docker"],
    traits: ["Analytical", "Team-oriented", "Precise"],
    motivation: "Engineering leadership and complex technical challenges.",
    communicationStyle: "Formal, structured, with practical examples.",
  },
  {
    id: "maria",
    initials: "MS",
    name: "Maria Santos",
    role: "Product Manager",
    status: "offline",
    seniority: "Mid-level",
    background: "6 years across B2B SaaS and product discovery.",
    skills: ["Roadmapping", "Metrics", "User research"],
    traits: ["Curious", "Empathetic", "Organized"],
    motivation: "Building products with measurable user impact.",
    communicationStyle: "Friendly, objective, and collaborative.",
  },
  {
    id: "joao",
    initials: "JR",
    name: "Joao Ribeiro",
    role: "UX Designer",
    status: "offline",
    seniority: "Mid-level",
    background: "5 years in UX and design systems for web products.",
    skills: ["Figma", "Design systems", "Prototyping"],
    traits: ["Creative", "Methodical", "Calm"],
    motivation: "Designing intuitive experiences for complex products.",
    communicationStyle: "Clear, visual, and user-centered.",
  },
];

const seedMessages: Message[] = [
  {
    id: "m1",
    from: "candidate",
    text: {
      en: "Hello! Nice to meet you. Do you want me to focus on distributed systems or API architecture first?",
      pt: "Ola! Prazer em conhecer voce. Quer que eu foque primeiro em sistemas distribuidos ou arquitetura de APIs?",
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

export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("en");
  const [conversationLanguage, setConversationLanguage] =
    useState<ConversationLanguage>("pt");
  const [selectedCandidateId, setSelectedCandidateId] = useState("carlos");
  const [activeView, setActiveView] = useState<TopView>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isTextMode, setIsTextMode] = useState(false);

  const t = dictionary[uiLanguage];
  const selectedCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.id === selectedCandidateId) ??
      candidates[0],
    [selectedCandidateId],
  );

  return (
    <div className="min-h-screen bg-[#f1f1ef] p-4 text-[#252525] md:p-8">
      <main className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[#d9d9d4] bg-[#f7f6f4] shadow-sm md:h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-[#dddcd8] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="grid h-7 w-7 place-content-center rounded-md bg-[#5d57d9] text-xs font-bold text-white">
              AI
            </div>
            <span>{t.appName as string}</span>
          </div>
          <div className="flex items-center gap-2">
            {(["sessions", "history", "settings"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() =>
                  setActiveView((prev) => (prev === view ? null : view))
                }
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  activeView === view
                    ? "border-[#6963de] bg-[#6963de] text-white"
                    : "border-[#cecdc8] bg-white hover:bg-[#f3f3f0]"
                }`}
              >
                {t[view] as string}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUiLanguage((prev) => (prev === "en" ? "pt" : "en"))}
              className="grid h-8 w-8 place-content-center rounded-full bg-[#e7e5fa] text-xs font-semibold text-[#4a45b5]"
            >
              {uiLanguage.toUpperCase()}
            </button>
          </div>
        </header>

        <section className="relative grid h-full min-h-0 grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-r border-[#dddcd8] bg-[#f3f3f0]">
            <div className="flex items-center justify-between border-b border-[#dddcd8] px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6a6a66]">
                {t.candidates as string}
              </h2>
              <button
                type="button"
                className="grid h-7 w-7 place-content-center rounded-full border border-[#c8c7c3] bg-white text-[#575757]"
              >
                +
              </button>
            </div>
            <div className="space-y-2 p-3">
              {candidates.map((candidate) => {
                const isSelected = candidate.id === selectedCandidateId;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-[#cccbe8] bg-[#ecebf9]"
                        : "border-[#e0dfdb] bg-white hover:bg-[#f7f7f5]"
                    }`}
                  >
                    <span className="grid h-9 w-9 place-content-center rounded-full bg-[#dfddf6] text-xs font-bold text-[#4b46af]">
                      {candidate.initials}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold leading-tight">
                        {candidate.name}
                      </span>
                      <span className="block text-xs text-[#6c6c68]">
                        {candidate.role}
                      </span>
                    </span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        candidate.status === "online"
                          ? "bg-[#18a86d]"
                          : "bg-[#9b9b98]"
                      }`}
                    />
                  </button>
                );
              })}
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-dashed border-[#cecdc8] px-3 py-2 text-sm text-[#757570]"
              >
                + {t.newCandidate as string}
              </button>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-white">
            <div className="flex items-start justify-between border-b border-[#e2e2de] px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-content-center rounded-full bg-[#dfddf6] text-xs font-bold text-[#4b46af]">
                  {selectedCandidate.initials}
                </span>
                <div>
                  <h3 className="text-xl font-semibold leading-tight">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-sm text-[#555552]">
                    {selectedCandidate.role} - {selectedCandidate.skills[0]}, {selectedCandidate.skills[1]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-[#fbe4e4] px-3 py-2 text-center text-[#be4444]">
                  <p className="text-[11px] font-semibold">{t.live as string}</p>
                  <p className="text-sm font-semibold">04:17</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-[#cccac7] bg-[#f5f4f1] px-4 py-2 text-sm font-medium"
                >
                  {t.pause as string}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="rounded-xl border border-[#cccac7] bg-white px-3 py-2 text-sm font-medium"
                >
                  {isProfileOpen ? (t.hideProfile as string) : (t.showProfile as string)}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#eeede9]">
              <div className="grid place-items-center border-b border-[#dddcd8] px-6 py-6">
                <div className="w-full max-w-xl text-center">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#61615d]">
                    {t.candidateAnswering as string}
                  </p>
                  <div className="mx-auto grid h-40 w-40 place-content-center rounded-full border border-[#d4d3cf] bg-[#f5f4f0] shadow-inner">
                    <div className="grid h-24 w-24 place-content-center rounded-full border-2 border-[#605ad7] text-4xl font-semibold text-[#605ad7]">
                      {selectedCandidate.initials}
                    </div>
                  </div>
                  <Waveform />
                  <div className="mx-auto mt-4 rounded-2xl border border-[#d7d6d2] bg-white p-4 text-left">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#74746f]">
                      {t.transcript as string}
                    </p>
                    <p className="text-base leading-relaxed text-[#2c2c2b]">
                      {conversationLanguage === "en"
                        ? "It was a monolith-to-microservices migration in a fintech with around two million users and zero downtime constraints."
                        : "Foi uma migracao de monolito para microsservicos em uma fintech com cerca de dois milhoes de usuarios e exigencia de zero downtime."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                {seedMessages.map((message) => {
                  const isCandidate = message.from === "candidate";
                  return (
                    <article
                      key={message.id}
                      className="grid grid-cols-[64px_1fr] border-b border-[#ebebe8] px-4 py-2 text-sm"
                    >
                      <p
                        className={`font-semibold ${
                          isCandidate ? "text-[#4a46b0]" : "text-[#1f7d62]"
                        }`}
                      >
                        {isCandidate ? selectedCandidate.name.split(" ")[0] : "You"}
                      </p>
                      <p className="text-[#3a3a37]">
                        {conversationLanguage === "en" ? message.text.en : message.text.pt}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#dddcd8] bg-[#f7f6f4] p-3">
              <select
                value={conversationLanguage}
                onChange={(event) =>
                  setConversationLanguage(event.target.value as ConversationLanguage)
                }
                className="rounded-xl border border-[#cecdc8] bg-white px-3 py-2 text-sm"
              >
                <option value="pt">PT {t.languagePortuguese as string}</option>
                <option value="en">EN {t.languageEnglish as string}</option>
              </select>
              <button
                type="button"
                className="grid h-11 w-14 place-content-center rounded-xl border border-[#d2d1cc] bg-white text-sm"
                aria-label={t.listenState as string}
              >
                🎤
              </button>
              <span className="text-sm text-[#565653]">{t.pressToSpeak as string}</span>
              <button
                type="button"
                onClick={() => setIsTextMode((prev) => !prev)}
                className={`relative h-6 w-11 rounded-full transition ${
                  isTextMode ? "bg-[#5f59d8]" : "bg-[#cbc9c5]"
                }`}
                aria-label={t.textMode as string}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                    isTextMode ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-[#565653]">{t.textMode as string}</span>
              {isTextMode && (
                <input
                  type="text"
                  className="h-10 min-w-[220px] flex-1 rounded-xl border border-[#d2d1cc] bg-white px-3 text-sm outline-none focus:border-[#6963de]"
                  placeholder={t.inputPlaceholder as string}
                />
              )}
              <button
                type="button"
                className="rounded-xl border border-[#cccac7] bg-[#f5f4f1] px-4 py-2 text-sm font-medium"
              >
                {t.pause as string}
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#f0b6b6] bg-white px-4 py-2 text-sm font-medium text-[#c13f3f]"
              >
                {t.stop as string}
              </button>
            </div>
            <div className="flex gap-2 border-t border-[#ecebe8] bg-white px-4 py-2 text-xs text-[#6a6a66]">
              <span className="rounded-full bg-[#f2f0ea] px-2 py-1">
                {t.listenState as string}
              </span>
              <span className="rounded-full bg-[#f2f0ea] px-2 py-1">
                {t.thinkState as string}
              </span>
              <span className="rounded-full bg-[#f2f0ea] px-2 py-1">
                {t.speakState as string}
              </span>
            </div>
          </section>

          <aside
            className={`absolute right-0 top-0 z-10 hidden h-full w-[300px] border-l border-[#dddcd8] bg-[#f9f9f7] transition-transform duration-300 md:flex md:flex-col ${
              isProfileOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#dddcd8] px-4 pt-3">
              <div className="flex">
                <button
                  type="button"
                  className="border-b-2 border-[#5c56d8] px-2 pb-2 text-sm font-medium text-[#4a46b2]"
                >
                  {t.profile as string}
                </button>
                <button
                  type="button"
                  className="px-3 pb-2 text-sm text-[#70706c]"
                >
                  {t.session as string}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-[#6f6f6c] hover:bg-[#efeeea]"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              <InfoBlock label={t.experience as string} value={selectedCandidate.background} />
              <TagBlock
                label={t.techStack as string}
                values={selectedCandidate.skills}
                colorClass="bg-[#e4e8ff] text-[#3e489f]"
              />
              <TagBlock
                label={t.personality as string}
                values={selectedCandidate.traits}
                colorClass="bg-[#eaf4ed] text-[#2f7a53]"
              />
              <InfoBlock label={t.motivation as string} value={selectedCandidate.motivation} />
              <InfoBlock
                label={t.communicationStyle as string}
                value={selectedCandidate.communicationStyle}
              />
              <button
                type="button"
                className="w-full rounded-xl border border-[#cccac6] bg-[#f4f3ef] px-3 py-2 text-sm font-medium"
              >
                {t.editProfile as string}
              </button>
            </div>
          </aside>
        </section>
      </main>

      {activeView && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/20 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d4d3ce] bg-white p-6 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t.topModalTitle[activeView] as string}
              </h2>
              <button
                type="button"
                onClick={() => setActiveView(null)}
                className="rounded-md px-2 py-1 text-sm text-[#6f6f6c] hover:bg-[#f3f2ef]"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#575754]">
              {t.topModalDescription[activeView] as string}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Waveform() {
  const bars = [10, 18, 28, 20, 34, 22, 30, 16, 12];
  return (
    <div className="mx-auto mt-6 flex h-12 items-center justify-center gap-1.5">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-1.5 rounded-full bg-[#7670e6]"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6b6b67]">
        {label}
      </h4>
      <p className="leading-relaxed text-[#2b2b29]">{value}</p>
    </section>
  );
}

function TagBlock({
  label,
  values,
  colorClass,
}: {
  label: string;
  values: string[];
  colorClass: string;
}) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b6b67]">
        {label}
      </h4>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className={`rounded-full px-2.5 py-1 text-xs ${colorClass}`}>
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}
