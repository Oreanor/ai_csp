"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Separator } from "@/components/ui/separator";
import type { AppLocale } from "@/lib/i18n/config";
import type { InterviewSessionMode } from "@/types/interview";

type LlmRuntimeInfo = { mode: "gemini"; modelId: string } | { mode: "stub"; modelId: null };

type ProfileSessionPanelProps = {
  candidateName: string;
  sessionMode: InterviewSessionMode;
  sessionWallClockStartedAt: number | null;
  sessionElapsedMs: number;
  transcriptMessageCount: number;
  uiLocale: AppLocale;
  autoReadAloud: boolean;
  ttsBrowserSupported: boolean;
};

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function ProfileSessionPanel({
  candidateName,
  sessionMode,
  sessionWallClockStartedAt,
  sessionElapsedMs,
  transcriptMessageCount,
  uiLocale,
  autoReadAloud,
  ttsBrowserSupported,
}: ProfileSessionPanelProps) {
  const t = useTranslations("Profile");
  const [llm, setLlm] = useState<LlmRuntimeInfo | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/llm/info");
        const raw = await res.text();
        if (!res.ok) {
          throw new Error(raw.trim().slice(0, 120) || res.statusText);
        }
        const data = JSON.parse(raw) as LlmRuntimeInfo;
        if (!cancelled) {
          setLlm(data);
          setLlmError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLlm(null);
          setLlmError(e instanceof Error ? e.message : t("sessionAiError"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per mount
  }, []);

  const dateLocale = uiLocale === "pt" ? "pt-PT" : "en-GB";
  const startedStr =
    sessionWallClockStartedAt != null
      ? new Intl.DateTimeFormat(dateLocale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(sessionWallClockStartedAt))
      : t("sessionDash");

  const stateLabel =
    sessionMode === "running"
      ? t("sessionStateRunning")
      : sessionMode === "paused"
        ? t("sessionStatePaused")
        : t("sessionStateIdle");

  const uiLanguageLabel =
    uiLocale === "pt" ? t("sessionUiLangPt") : t("sessionUiLangEn");

  const ttsOut = !ttsBrowserSupported
    ? t("sessionTtsUnsupported")
    : autoReadAloud
      ? t("sessionTtsOn")
      : t("sessionTtsOff");

  return (
    <div className="space-y-4 text-sm">
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sessionCandidateHeading")}
        </h4>
        <p className="font-medium leading-relaxed text-foreground">{candidateName}</p>
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sessionTimingHeading")}
        </h4>
        <dl className="space-y-1.5 text-muted-foreground">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <dt>{t("sessionStateLabel")}</dt>
            <dd className="text-right text-foreground">{stateLabel}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <dt>{t("sessionStartedLabel")}</dt>
            <dd className="text-right text-foreground">{startedStr}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <dt>{t("sessionElapsedLabel")}</dt>
            <dd className="font-mono text-right text-foreground">
              {sessionMode === "idle" ? t("sessionDash") : formatElapsed(sessionElapsedMs)}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <dt>{t("sessionMessagesLabel")}</dt>
            <dd className="text-right text-foreground">{transcriptMessageCount}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {sessionMode === "idle" ? t("sessionFootnoteIdle") : t("sessionFootnoteActive")}
        </p>
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sessionAiHeading")}
        </h4>
        {llmError ? (
          <p className="text-xs text-destructive">{llmError}</p>
        ) : llm == null ? (
          <p className="text-xs text-muted-foreground">{t("sessionAiLoading")}</p>
        ) : llm.mode === "gemini" ? (
          <dl className="space-y-1.5 text-muted-foreground">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
              <dt>{t("sessionProviderLabel")}</dt>
              <dd className="text-right text-foreground">{t("sessionProviderGemini")}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
              <dt>{t("sessionModelLabel")}</dt>
              <dd className="max-w-[min(100%,14rem)] break-all text-right font-mono text-xs text-foreground">
                {llm.modelId}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="leading-relaxed text-muted-foreground">{t("sessionProviderStub")}</p>
        )}
      </section>

      <Separator />

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sessionAudioHeading")}
        </h4>
        <div className="space-y-2 leading-relaxed text-muted-foreground">
          <p>{t("sessionAudioIn")}</p>
          <p className="text-foreground/90">{ttsOut}</p>
        </div>
      </section>

      <Separator />

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sessionUiHeading")}
        </h4>
        <p className="leading-relaxed text-muted-foreground">{uiLanguageLabel}</p>
      </section>
    </div>
  );
}
