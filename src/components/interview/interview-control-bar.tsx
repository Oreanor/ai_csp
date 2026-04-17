"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, SendHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SttLanguageMode } from "@/types/interview";

type InterviewControlBarProps = {
  onSendMessage: (text: string) => void | Promise<void>;
  /** When false, mic, language, and text input are disabled (no active interview surface). */
  interactionEnabled?: boolean;
  /** When false, Send and Enter-to-send are disabled (e.g. mic test: draft/STT only). */
  allowSend?: boolean;
  /** While the LLM is generating the candidate reply */
  candidateReplyPending?: boolean;
  /** Aborts the in-flight /api/llm/complete request */
  onCancelCandidateReply?: () => void;
  /** Fired when microphone capture starts or stops (for UI such as the voice stage). */
  onRecordingChange?: (recording: boolean) => void;
};

export function InterviewControlBar({
  onSendMessage,
  interactionEnabled = true,
  allowSend = true,
  candidateReplyPending = false,
  onCancelCandidateReply,
  onRecordingChange,
}: InterviewControlBarProps) {
  const tInterview = useTranslations("Interview");
  const tVoice = useTranslations("Voice");
  const [draft, setDraft] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [sttLanguage, setSttLanguage] = useState<SttLanguageMode>("auto");
  const [sendBusy, setSendBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const sttAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      sttAbortRef.current?.abort();
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  useEffect(() => {
    onRecordingChange?.(isRecording);
  }, [isRecording, onRecordingChange]);

  const cancelTranscription = () => {
    sttAbortRef.current?.abort();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sendBusy || !allowSend) return;
    setSendBusy(true);
    setDraft("");
    try {
      await Promise.resolve(onSendMessage(text));
    } catch {
      setDraft(text);
    } finally {
      setSendBusy(false);
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!blob.size) {
      console.warn("[STT] stop: audio blob is empty (0 bytes) — check mic / browser MediaRecorder");
      setMicError(tVoice("recordingEmpty"));
      return;
    }

    console.info("[STT] sending", blob.size, "bytes,", blob.type || "no type", "lang=", sttLanguage);

    setIsTranscribing(true);
    setMicError(null);
    const ac = new AbortController();
    sttAbortRef.current = ac;
    try {
      const payload = new FormData();
      payload.append("audio", new File([blob], "speech.webm", { type: blob.type || "audio/webm" }));
      payload.append("language", sttLanguage);

      const res = await fetch("/api/stt/transcribe", {
        method: "POST",
        body: payload,
        signal: ac.signal,
      });

      const raw = await res.text();
      let data: { text?: string; error?: string } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as { text?: string; error?: string };
        } catch {
          console.error("[STT] response is not JSON", res.status);
          throw new Error(tVoice("sttFailed"));
        }
      }

      console.info("[STT] /api/stt/transcribe status=", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || tVoice("sttFailed"));
      }

      const text = data.text?.trim();
      if (text) {
        setDraft((prev) => (prev ? `${prev} ${text}` : text));
        console.info(
          "[STT] transcript appended to input draft (press Send to post to the chat):",
          text.slice(0, 200) + (text.length > 200 ? "…" : ""),
        );
      } else {
        console.warn("[STT] server returned ok but empty text");
        setMicError(tVoice("sttEmptyResult"));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.info("[STT] transcribe cancelled");
        return;
      }
      const message = error instanceof Error ? error.message : tVoice("sttFailed");
      console.error("[STT] transcribe error:", message);
      setMicError(message);
    } finally {
      sttAbortRef.current = null;
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        /* ignore */
      }
    }
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    setMicError(null);

    if (
      typeof window === "undefined" ||
      !("MediaRecorder" in window) ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setMicError(tVoice("micNotSupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferredMime });

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        console.info("[STT] recorder stopped, chunks=", chunksRef.current.length, "blob.size=", audioBlob.size);
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        void transcribeBlob(audioBlob);
      };

      // Timeslice helps some browsers emit data reliably before stop.
      recorder.start(100);
      console.info("[STT] recording started", preferredMime);
      setIsRecording(true);
    } catch {
      setMicError(tVoice("micPermissionDenied"));
    }
  };

  const handleMicToggle = async () => {
    if (!interactionEnabled || isTranscribing || candidateReplyPending) return;
    if (isRecording) {
      setIsRecording(false);
      stopRecording();
      return;
    }
    await startRecording();
  };

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="default"
              className={cn(
                "h-10 w-fit shrink-0 gap-2 border-transparent px-3 shadow-sm",
                "bg-foreground text-background hover:bg-foreground/85 hover:text-background",
                "[&_svg]:text-background",
                isRecording &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground [&_svg]:text-destructive-foreground",
              )}
              aria-label={tVoice("micAria")}
              onClick={() => {
                void handleMicToggle();
              }}
              disabled={
                !interactionEnabled || isTranscribing || candidateReplyPending
              }
            >
              <Mic className="size-5 shrink-0" />
              <span>
                {isTranscribing
                  ? tVoice("transcribing")
                  : candidateReplyPending
                    ? tInterview("waitingForReply")
                    : isRecording
                      ? tVoice("stopRecording")
                      : tVoice("pressToSpeak")}
              </span>
            </Button>
            <Select
              value={sttLanguage}
              onValueChange={(v) => {
                if (v === "auto" || v === "en" || v === "pt") {
                  setSttLanguage(v);
                }
              }}
              disabled={
                !interactionEnabled ||
                isRecording ||
                isTranscribing ||
                candidateReplyPending
              }
            >
              <SelectTrigger
                size="sm"
                className="h-10 w-[11.5rem] shrink-0"
                aria-label={tVoice("sttLanguageAria")}
              >
                <SelectValue placeholder={tVoice("sttLangAuto")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{tVoice("sttLangAuto")}</SelectItem>
                <SelectItem value="en">{tVoice("sttLangEn")}</SelectItem>
                <SelectItem value="pt">{tVoice("sttLangPt")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isTranscribing || candidateReplyPending ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (isTranscribing) {
                  cancelTranscription();
                } else {
                  onCancelCandidateReply?.();
                }
              }}
            >
              {tInterview("cancelAction")}
            </Button>
          ) : null}
        </div>
        {micError ? (
          <p className="text-xs text-destructive" role="status">
            {micError}
          </p>
        ) : isRecording ? (
          <p className="text-xs text-muted-foreground" role="status">
            {tVoice("recording")}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (allowSend) void send();
                }
              }}
              disabled={
                !interactionEnabled || sendBusy || candidateReplyPending
              }
              placeholder={tInterview("inputPlaceholder")}
              className={`h-10 w-full min-w-0 ${draft.trim() ? "pr-10" : ""}`}
              aria-label={tInterview("inputPlaceholder")}
            />
            {draft.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={tInterview("clearInput")}
                disabled={!interactionEnabled}
                onClick={() => setDraft("")}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 shrink-0"
            aria-label={tInterview("sendMessage")}
            disabled={
              !interactionEnabled ||
              !allowSend ||
              sendBusy ||
              candidateReplyPending
            }
            onClick={() => {
              void send();
            }}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
