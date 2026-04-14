"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CandidatesSidebar } from "@/components/interview/candidates-sidebar";
import { InterviewControlBar } from "@/components/interview/interview-control-bar";
import { InterviewMessageLog } from "@/components/interview/interview-message-log";
import { NewCandidateDialog } from "@/components/interview/new-candidate-dialog";
import { ProfilePanelShell } from "@/components/interview/profile-panel-shell";
import { VoiceStage } from "@/components/interview/voice-stage";
import { WelcomeModal } from "@/components/interview/welcome-modal";
import { WorkspaceHeader } from "@/components/interview/workspace-header";
import { WorkspaceModal } from "@/components/interview/workspace-modal";
import { Badge } from "@/components/ui/badge";
import { useAppLocale } from "@/components/providers/locale-provider";
import { initialCandidates } from "@/data/candidates";
import { seedInterviewMessages } from "@/data/seed-messages";
import { workspaceSurfaces } from "@/lib/workspace/surfaces";
import type { Candidate, InterviewMessage, TopModalView } from "@/types/interview";

function messagesMapForCandidates(candidates: Candidate[]): Record<string, InterviewMessage[]> {
  return Object.fromEntries(
    candidates.map((c) => [c.id, [...seedInterviewMessages]] as const),
  );
}

export function InterviewWorkspace() {
  const tInterview = useTranslations("Interview");
  const { locale } = useAppLocale();

  const [candidateList, setCandidateList] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    initialCandidates[0]?.id ?? "",
  );
  const [activeModal, setActiveModal] = useState<TopModalView | null>(null);
  const [addPersonaOpen, setAddPersonaOpen] = useState(false);
  const [messagesByCandidateId, setMessagesByCandidateId] = useState<
    Record<string, InterviewMessage[]>
  >(() => messagesMapForCandidates(initialCandidates));
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  const selectedCandidate = useMemo(
    () =>
      candidateList.find((c) => c.id === selectedCandidateId) ?? candidateList[0],
    [candidateList, selectedCandidateId],
  );

  if (!selectedCandidate) {
    return null;
  }

  const toggleModal = (view: TopModalView) => {
    setActiveModal((prev) => (prev === view ? null : view));
  };

  const skillsHeadline = `${selectedCandidate.skills[0] ?? ""}, ${selectedCandidate.skills[1] ?? ""}`;

  const handleAddPersona = (candidate: Candidate) => {
    setCandidateList((prev) => [...prev, candidate]);
    setSelectedCandidateId(candidate.id);
    setMessagesByCandidateId((prev) => ({
      ...prev,
      [candidate.id]: [...seedInterviewMessages],
    }));
  };

  const chatMessages =
    messagesByCandidateId[selectedCandidate.id] ?? seedInterviewMessages;

  const handleSendChatMessage = (text: string) => {
    const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry: InterviewMessage = {
      id,
      from: "interviewer",
      text: { en: text, pt: text },
    };
    setMessagesByCandidateId((prev) => {
      const list = prev[selectedCandidate.id] ?? [...seedInterviewMessages];
      return { ...prev, [selectedCandidate.id]: [...list, entry] };
    });
  };

  return (
    <div className={workspaceSurfaces.page}>
      <main className={workspaceSurfaces.shell}>
        <WorkspaceHeader
          activeModal={activeModal}
          onToggleModal={toggleModal}
          onOpenDisclaimer={() => setWelcomeOpen(true)}
        />

        <section className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)_300px]">
          <CandidatesSidebar
            candidates={candidateList}
            selectedId={selectedCandidate.id}
            onSelect={setSelectedCandidateId}
            onAddClick={() => setAddPersonaOpen(true)}
          />

          <section className={workspaceSurfaces.mainColumn}>
            <div className={workspaceSurfaces.mainHeader}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-content-center rounded-full bg-brand-muted text-xs font-bold text-brand-foreground">
                  {selectedCandidate.initials}
                </span>
                <div>
                  <h3 className="text-xl font-semibold leading-tight">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCandidate.role} · {skillsHeadline}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
                >
                  <span className="block text-[10px] font-semibold leading-none">
                    {tInterview("live")}
                  </span>
                  <span className="text-sm font-semibold">{tInterview("liveTimer")}</span>
                </Badge>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <VoiceStage candidate={selectedCandidate} conversationLanguage={locale} />
              <InterviewMessageLog
                candidate={selectedCandidate}
                messages={chatMessages}
                conversationLanguage={locale}
              />
            </div>

            <InterviewControlBar onSendMessage={handleSendChatMessage} />
          </section>

          <aside className={workspaceSurfaces.profileColumn}>
            <ProfilePanelShell candidate={selectedCandidate} />
          </aside>
        </section>
      </main>

      <NewCandidateDialog
        open={addPersonaOpen}
        onOpenChange={setAddPersonaOpen}
        onAdd={handleAddPersona}
      />

      <WorkspaceModal
        activeModal={activeModal}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null);
        }}
      />

      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
    </div>
  );
}
