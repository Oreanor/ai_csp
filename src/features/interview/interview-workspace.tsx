"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";
import { useTranslations } from "next-intl";

import { CandidatesSidebar } from "@/components/interview/candidates-sidebar";
import { InterviewControlBar } from "@/components/interview/interview-control-bar";
import { InterviewMessageLog } from "@/components/interview/interview-message-log";
import { CandidatePersonaDialog } from "@/components/interview/candidate-persona-dialog";
import { ProfileTtsSection } from "@/components/interview/profile-tts-section";
import { ProfilePanelShell } from "@/components/interview/profile-panel-shell";
import { VoiceWaveform } from "@/components/interview/voice-waveform";
import { WelcomeModal } from "@/components/interview/welcome-modal";
import { WorkspaceHeader } from "@/components/interview/workspace-header";
import { WorkspaceModal } from "@/components/interview/workspace-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppLocale } from "@/components/providers/locale-provider";
import { initialCandidates } from "@/data/candidates";
import { INTERVIEW_AUTO_TTS_STORAGE_KEY } from "@/lib/constants/storage-keys";
import { isBrowserTtsSupported, stopBrowserTts } from "@/lib/voice/browser-tts";
import {
  buildCandidateSystemPrompt,
  interviewMessagesToLlm,
} from "@/lib/interview/interview-llm";
import {
  getInterviewSessionElapsedMs,
  initialInterviewSessionClock,
  interviewSessionReducer,
} from "@/lib/interview/interview-session";
import { cn } from "@/lib/utils";
import { workspaceSurfaces } from "@/lib/workspace/surfaces";
import type { Candidate, InterviewMessage, TopModalView } from "@/types/interview";

function messagesMapForCandidates(candidates: Candidate[]): Record<string, InterviewMessage[]> {
  return Object.fromEntries(candidates.map((c) => [c.id, [] as InterviewMessage[]] as const));
}

/** Parse `POST /api/llm/complete` body without throwing; accepts only object JSON with string fields. */
function parseLlmCompleteFetchPayload(
  raw: string,
  res: Response,
): { text?: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (!res.ok) {
      return { error: res.statusText || `Request failed (${res.status})` };
    }
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { error: trimmed.slice(0, 280) || res.statusText || "Invalid response" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { error: "Invalid JSON payload from server" };
  }
  const o = parsed as Record<string, unknown>;
  const textVal = o.text;
  const errVal = o.error;
  return {
    text: typeof textVal === "string" ? textVal : undefined,
    error: typeof errVal === "string" && errVal.trim() ? errVal.trim() : undefined,
  };
}

export function InterviewWorkspace() {
  const tInterview = useTranslations("Interview");
  const tTts = useTranslations("Tts");
  const { locale } = useAppLocale();

  const [candidateList, setCandidateList] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    initialCandidates[0]?.id ?? "",
  );
  const [activeModal, setActiveModal] = useState<TopModalView | null>(null);
  const [addPersonaOpen, setAddPersonaOpen] = useState(false);
  const [editPersonaOpen, setEditPersonaOpen] = useState(false);
  const [editPersonaSnapshot, setEditPersonaSnapshot] = useState<Candidate | null>(null);
  const [messagesByCandidateId, setMessagesByCandidateId] = useState<
    Record<string, InterviewMessage[]>
  >(() => messagesMapForCandidates(initialCandidates));
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [isCandidateReplying, setIsCandidateReplying] = useState(false);
  const [candidateReplyError, setCandidateReplyError] = useState<string | null>(null);
  const [autoPlayTts, setAutoPlayTtsState] = useState(true);
  const [ttsPlaybackActive, setTtsPlaybackActive] = useState(false);
  const [micRecording, setMicRecording] = useState(false);
  const [ttsBrowserSupported, setTtsBrowserSupported] = useState(false);
  const [autoPlayCandidateMessageId, setAutoPlayCandidateMessageId] = useState<string | null>(
    null,
  );
  const [interviewSession, dispatchInterviewSession] = useReducer(
    interviewSessionReducer,
    initialInterviewSessionClock,
  );
  const [sessionTick, setSessionTick] = useState(0);
  const [interviewerBaseSystemPrompt, setInterviewerBaseSystemPrompt] = useState("");
  const llmAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/interview/settings");
        const text = await res.text();
        if (cancelled || !res.ok) return;
        if (!text.trim()) return;
        const data = JSON.parse(text) as { baseSystemPrompt?: unknown };
        if (typeof data.baseSystemPrompt === "string") {
          setInterviewerBaseSystemPrompt(data.baseSystemPrompt);
        }
      } catch {
        /* PoC: ignore load errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(INTERVIEW_AUTO_TTS_STORAGE_KEY);
    if (raw === "0") {
      setAutoPlayTtsState(false);
    } else {
      setAutoPlayTtsState(true);
      if (raw == null) {
        window.localStorage.setItem(INTERVIEW_AUTO_TTS_STORAGE_KEY, "1");
      }
    }
    setTtsBrowserSupported(isBrowserTtsSupported());
  }, []);

  const setAutoPlayTts = useCallback((next: boolean) => {
    setAutoPlayTtsState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INTERVIEW_AUTO_TTS_STORAGE_KEY, next ? "1" : "0");
    }
  }, []);

  useEffect(() => {
    stopBrowserTts();
    setTtsPlaybackActive(false);
    setAutoPlayCandidateMessageId(null);
  }, [selectedCandidateId]);

  useEffect(() => {
    if (interviewSession.mode !== "running") return;
    const id = window.setInterval(() => setSessionTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [interviewSession.mode]);

  const sessionElapsedMs = useMemo(
    () => getInterviewSessionElapsedMs(interviewSession),
    [interviewSession, sessionTick],
  );

  const [micTestActive, setMicTestActive] = useState(false);
  const wasRunningBeforeMicTestRef = useRef(false);

  const endMicTest = useCallback(() => {
    setMicTestActive(false);
    if (wasRunningBeforeMicTestRef.current) {
      wasRunningBeforeMicTestRef.current = false;
      dispatchInterviewSession({ type: "RESUME" });
    }
  }, []);

  const startMicTest = useCallback(() => {
    if (interviewSession.mode === "running") {
      wasRunningBeforeMicTestRef.current = true;
      dispatchInterviewSession({ type: "PAUSE" });
    } else {
      wasRunningBeforeMicTestRef.current = false;
    }
    setMicTestActive(true);
  }, [interviewSession.mode]);

  const handleStartSession = useCallback(() => {
    setMicTestActive(false);
    wasRunningBeforeMicTestRef.current = false;
    dispatchInterviewSession({ type: "START" });
  }, []);

  const handlePauseSession = useCallback(() => {
    dispatchInterviewSession({ type: "PAUSE" });
  }, []);

  const handleResumeSession = useCallback(() => {
    setMicTestActive(false);
    wasRunningBeforeMicTestRef.current = false;
    dispatchInterviewSession({ type: "RESUME" });
  }, []);

  const handleStopSession = useCallback(() => {
    setMicTestActive(false);
    wasRunningBeforeMicTestRef.current = false;
    dispatchInterviewSession({ type: "STOP" });
  }, []);

  const switchLocked = interviewSession.mode !== "idle";

  const selectedCandidate = useMemo(
    () =>
      candidateList.find((c) => c.id === selectedCandidateId) ?? candidateList[0],
    [candidateList, selectedCandidateId],
  );

  const toggleModal = useCallback((view: TopModalView) => {
    setActiveModal((prev) => (prev === view ? null : view));
  }, []);

  const handleSelectCandidate = useCallback(
    (id: string) => {
      if (id === selectedCandidateId) return;

      if (micTestActive) {
        setMicTestActive(false);
        const wasRunningForTest = wasRunningBeforeMicTestRef.current;
        if (wasRunningForTest) {
          wasRunningBeforeMicTestRef.current = false;
          dispatchInterviewSession({ type: "RESUME" });
        }
        const allowSwitchAfterEndTest =
          interviewSession.mode === "idle" && !wasRunningForTest;
        if (!allowSwitchAfterEndTest) return;
      } else if (switchLocked) {
        return;
      }

      setSelectedCandidateId(id);
    },
    [micTestActive, interviewSession.mode, switchLocked, selectedCandidateId],
  );

  const openEditPersona = useCallback(() => {
    if (!selectedCandidate) return;
    setEditPersonaSnapshot(selectedCandidate);
    setEditPersonaOpen(true);
  }, [selectedCandidate]);

  const handleSendChatMessage = useCallback(
    async (text: string) => {
      if (!selectedCandidate) return;
      if (micTestActive) return;
      if (interviewSession.mode !== "running") return;

      /** Bind to the interview that started the request (avoids wrong thread if candidate changes mid-flight). */
      const candidateId = selectedCandidate.id;
      const candidateSnapshot = selectedCandidate;

      const userEntry: InterviewMessage = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        from: "interviewer",
        text: { en: text, pt: text },
      };

      let listWithUser: InterviewMessage[] = [];
      setMessagesByCandidateId((prev) => {
        const prevList = prev[candidateId] ?? [];
        listWithUser = [...prevList, userEntry];
        return { ...prev, [candidateId]: listWithUser };
      });

      setIsCandidateReplying(true);
      setCandidateReplyError(null);

      const ac = new AbortController();
      llmAbortRef.current = ac;

      try {
        const systemPrompt = buildCandidateSystemPrompt(candidateSnapshot, locale, {
          interviewerBasePrompt: interviewerBaseSystemPrompt,
        });
        const llmMessages = interviewMessagesToLlm(systemPrompt, listWithUser, locale);

        const res = await fetch("/api/llm/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: llmMessages,
            temperature: 0.45,
            maxOutputTokens: 1024,
          }),
          signal: ac.signal,
        });

        const raw = await res.text();
        const data = parseLlmCompleteFetchPayload(raw, res);

        if (!res.ok) {
          throw new Error(data.error ?? "LLM request failed");
        }

        const replyText = (data.text ?? "").trim();
        if (!replyText) {
          throw new Error(data.error?.trim() || "Empty reply");
        }

        const candidateEntry: InterviewMessage = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          from: "candidate",
          text: { en: replyText, pt: replyText },
        };

        setMessagesByCandidateId((prev) => {
          const list = prev[candidateId] ?? [];
          return {
            ...prev,
            [candidateId]: [...list, candidateEntry],
          };
        });

        if (autoPlayTts && isBrowserTtsSupported()) {
          setTtsPlaybackActive(true);
          setAutoPlayCandidateMessageId(candidateEntry.id);
        } else {
          setAutoPlayCandidateMessageId(null);
        }
      } catch (e) {
        const aborted = e instanceof DOMException && e.name === "AbortError";
        setMessagesByCandidateId((prev) => {
          const list = prev[candidateId] ?? [];
          const withoutFailedUser = list.filter((m) => m.id !== userEntry.id);
          return { ...prev, [candidateId]: withoutFailedUser };
        });
        if (aborted) {
          setCandidateReplyError(null);
          throw e;
        }
        console.error("[interview LLM]", e);
        const detail = e instanceof Error && e.message.trim() ? e.message.trim() : "";
        setCandidateReplyError(detail || tInterview("chatLlmError"));
        throw e;
      } finally {
        llmAbortRef.current = null;
        setIsCandidateReplying(false);
      }
    },
    [
      selectedCandidate,
      locale,
      autoPlayTts,
      tInterview,
      micTestActive,
      interviewSession.mode,
      interviewerBaseSystemPrompt,
    ],
  );

  if (!selectedCandidate) {
    return null;
  }

  const skillsHeadline = `${selectedCandidate.skills[0] ?? ""}, ${selectedCandidate.skills[1] ?? ""}`;

  const handleAddPersona = (candidate: Candidate) => {
    setCandidateList((prev) => [...prev, candidate]);
    setSelectedCandidateId(candidate.id);
    setMessagesByCandidateId((prev) => ({
      ...prev,
      [candidate.id]: [],
    }));
  };

  const handleUpdatePersona = (updated: Candidate) => {
    setCandidateList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const cancelCandidateReply = () => {
    llmAbortRef.current?.abort();
  };

  const chatMessages = messagesByCandidateId[selectedCandidate.id] ?? [];

  const replicaSurfaceActive =
    interviewSession.mode === "running" || micTestActive;
  const replicaAllowSend =
    interviewSession.mode === "running" && !micTestActive;

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
            onSelect={handleSelectCandidate}
            onAddClick={() => setAddPersonaOpen(true)}
            switchLocked={switchLocked}
            addLocked={micTestActive}
          />

          <section className={workspaceSurfaces.mainColumn}>
            <div
              className={cn(
                workspaceSurfaces.mainHeader,
                "flex flex-col items-stretch gap-3",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-brand-muted text-xs font-bold text-brand-foreground">
                    {selectedCandidate.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold leading-tight">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.role} · {skillsHeadline}
                    </p>
                  </div>
                </div>
                <VoiceWaveform
                  active={ttsPlaybackActive || isCandidateReplying || micRecording}
                  className="ml-auto shrink-0"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {interviewSession.mode === "idle" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={handleStartSession}
                    >
                      <Play className="size-3.5 shrink-0" />
                      {tInterview("sessionStart")}
                    </Button>
                  ) : null}
                  {interviewSession.mode === "running" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={handlePauseSession}
                      >
                        <Pause className="size-3.5 shrink-0" />
                        {tInterview("sessionPause")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={handleStopSession}
                      >
                        <Square className="size-3.5 shrink-0" />
                        {tInterview("sessionStop")}
                      </Button>
                    </>
                  ) : null}
                  {interviewSession.mode === "paused" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={handleResumeSession}
                      >
                        <Play className="size-3.5 shrink-0" />
                        {tInterview("sessionResume")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={handleStopSession}
                      >
                        <Square className="size-3.5 shrink-0" />
                        {tInterview("sessionStop")}
                      </Button>
                    </>
                  ) : null}
                </div>
                <div className="flex w-full shrink-0 justify-end sm:ml-auto sm:w-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant={micTestActive ? "secondary" : "outline"}
                    className="gap-1.5"
                    onClick={() => {
                      if (micTestActive) endMicTest();
                      else startMicTest();
                    }}
                  >
                    <Headphones className="size-3.5 shrink-0" />
                    {micTestActive
                      ? tInterview("micTestEnd")
                      : tInterview("micTestStart")}
                  </Button>
                </div>
              </div>
              {micTestActive ? (
                <p
                  className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100"
                  role="status"
                >
                  {tInterview("micTestHint")}
                </p>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-3 pb-2 pt-1">
              {candidateReplyError ? (
                <p className="shrink-0 border-b border-border bg-destructive/10 px-4 py-2 text-xs text-destructive">
                  {candidateReplyError}
                </p>
              ) : null}
              <InterviewMessageLog
                candidate={selectedCandidate}
                messages={chatMessages}
                conversationLanguage={locale}
                candidateTyping={isCandidateReplying || ttsPlaybackActive}
                candidateTypingLabel={
                  isCandidateReplying
                    ? undefined
                    : ttsPlaybackActive
                      ? tInterview("candidateSpeaking")
                      : undefined
                }
              />
              <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="interview-auto-tts"
                    size="sm"
                    checked={autoPlayTts}
                    disabled={
                      !ttsBrowserSupported ||
                      interviewSession.mode !== "running" ||
                      micTestActive
                    }
                    onCheckedChange={(v) => setAutoPlayTts(Boolean(v))}
                  />
                  <Label
                    htmlFor="interview-auto-tts"
                    className="cursor-pointer text-xs font-normal text-foreground"
                  >
                    {tTts("autoReadLabel")}
                  </Label>
                </div>
              </div>
            </div>

            <InterviewControlBar
              onSendMessage={handleSendChatMessage}
              interactionEnabled={replicaSurfaceActive}
              allowSend={replicaAllowSend}
              candidateReplyPending={isCandidateReplying}
              onCancelCandidateReply={cancelCandidateReply}
              onRecordingChange={setMicRecording}
            />
          </section>

          <aside className={workspaceSurfaces.profileColumn}>
            <ProfilePanelShell
              candidate={selectedCandidate}
              onEditProfile={openEditPersona}
              sessionMode={interviewSession.mode}
              sessionWallClockStartedAt={interviewSession.wallClockStartedAt}
              sessionElapsedMs={sessionElapsedMs}
              transcriptMessageCount={chatMessages.length}
              uiLocale={locale}
              autoReadAloud={autoPlayTts}
              ttsBrowserSupported={ttsBrowserSupported}
              interviewTts={
                <ProfileTtsSection
                  candidate={selectedCandidate}
                  messages={chatMessages}
                  conversationLanguage={locale}
                  autoPlayEnabled={autoPlayTts}
                  autoPlayMessageId={autoPlayCandidateMessageId}
                  onPlaybackActiveChange={setTtsPlaybackActive}
                />
              }
            />
          </aside>
        </section>
      </main>

      <CandidatePersonaDialog
        open={addPersonaOpen}
        onOpenChange={setAddPersonaOpen}
        mode="create"
        editSource={null}
        onSave={handleAddPersona}
      />

      <CandidatePersonaDialog
        open={editPersonaOpen}
        onOpenChange={(next) => {
          if (!next) setEditPersonaSnapshot(null);
          setEditPersonaOpen(next);
        }}
        mode="edit"
        editSource={editPersonaSnapshot}
        onSave={handleUpdatePersona}
      />

      <WorkspaceModal
        activeModal={activeModal}
        onOpenChange={(open) => {
          if (!open) setActiveModal(null);
        }}
        interviewBaseSystemPrompt={interviewerBaseSystemPrompt}
        onInterviewSettingsSaved={(next) =>
          setInterviewerBaseSystemPrompt(next.baseSystemPrompt)
        }
      />

      <WelcomeModal open={welcomeOpen} onOpenChange={setWelcomeOpen} />
    </div>
  );
}
