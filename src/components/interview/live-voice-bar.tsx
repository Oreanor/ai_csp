"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mic, SendHorizontal, Square, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useGeminiLive } from "@/lib/voice/use-gemini-live";

type LiveVoiceBarProps = {
  systemPrompt: string;
  onTranscript: (text: string, role: "user" | "model") => void;
  onSendMessage: (text: string) => boolean | void | Promise<boolean | void>;
  interactionEnabled?: boolean;
  allowSend?: boolean;
  candidateReplyPending?: boolean;
  onCancelCandidateReply?: () => void;
  onRecordingChange?: (active: boolean) => void;
  onLiveSpeakingChange?: (speaking: boolean) => void;
  onLiveStatusChange?: (live: boolean) => void;
};

export function LiveVoiceBar({
  systemPrompt,
  onTranscript,
  onSendMessage,
  interactionEnabled = true,
  allowSend = true,
  candidateReplyPending = false,
  onCancelCandidateReply,
  onRecordingChange,
  onLiveSpeakingChange,
  onLiveStatusChange,
}: LiveVoiceBarProps) {
  const tInterview = useTranslations("Interview");
  const tVoice = useTranslations("Voice");

  const [draft, setDraft] = useState("");
  const [sendBusy, setSendBusy] = useState(false);

  const { status, error, connect, disconnect, sendText } = useGeminiLive({
    systemPrompt,
    onTranscript,
    onSpeakingChange: onLiveSpeakingChange,
  });

  const isLive = status === "live";
  const isConnecting = status === "connecting";

  useEffect(() => {
    onLiveStatusChange?.(isLive);
  }, [isLive, onLiveStatusChange]);

  useEffect(() => {
    onRecordingChange?.(isLive);
  }, [isLive, onRecordingChange]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sendBusy) return;

    if (isLive) {
      sendText(text);
      setDraft("");
      return;
    }

    if (!allowSend) return;
    setSendBusy(true);
    setDraft("");
    try {
      const result = await Promise.resolve(onSendMessage(text));
      if (result === false) setDraft(text);
    } catch {
      setDraft(text);
    } finally {
      setSendBusy(false);
    }
  }, [draft, sendBusy, isLive, sendText, allowSend, onSendMessage]);

  const handleConnect = useCallback(() => {
    if (isLive || isConnecting) {
      disconnect();
    } else {
      void connect();
    }
  }, [isLive, isConnecting, connect, disconnect]);

  const connectDisabled = !interactionEnabled || (status === "connecting");

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="flex flex-col gap-2 p-3">
        {/* Live voice row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            className={cn(
              "h-10 w-fit shrink-0 gap-2 border-transparent px-3 shadow-sm",
              "bg-foreground text-background hover:bg-foreground/85 hover:text-background [&_svg]:text-background",
              isLive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90 [&_svg]:text-destructive-foreground",
            )}
            onClick={handleConnect}
            disabled={connectDisabled}
            aria-label={isLive ? tVoice("liveDisconnect") : tVoice("liveConnect")}
          >
            {isConnecting ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : isLive ? (
              <Square className="size-5 shrink-0" />
            ) : (
              <Mic className="size-5 shrink-0" />
            )}
            <span>
              {isConnecting
                ? tVoice("liveConnecting")
                : isLive
                  ? tVoice("liveDisconnect")
                  : tVoice("liveConnect")}
            </span>
          </Button>

          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="inline-block size-2 animate-pulse rounded-full bg-green-500" />
              {tVoice("liveBadge")}
            </span>
          )}

          {candidateReplyPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-9 shrink-0 px-3 text-muted-foreground hover:text-foreground"
              onClick={onCancelCandidateReply}
            >
              {tInterview("cancelAction")}
            </Button>
          )}
        </div>

        {/* Status / error hints */}
        {isLive && (
          <p className="text-xs text-muted-foreground" role="status">
            {tVoice("liveHint")}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        {/* Text input row */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              disabled={!interactionEnabled || sendBusy || candidateReplyPending}
              placeholder={
                isLive ? tVoice("liveInputPlaceholder") : tInterview("inputPlaceholder")
              }
              className={`h-10 w-full min-w-0 ${draft.trim() ? "pr-10" : ""}`}
              aria-label={tInterview("inputPlaceholder")}
            />
            {draft.trim() && (
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
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 shrink-0"
            aria-label={tInterview("sendMessage")}
            disabled={
              !interactionEnabled ||
              (!isLive && !allowSend) ||
              sendBusy ||
              candidateReplyPending
            }
            onClick={() => { void handleSend(); }}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
