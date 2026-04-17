"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterVoicesForLocale,
  findVoiceByUri,
  isBrowserTtsSupported,
  speakBrowserTts,
  stopBrowserTts,
} from "@/lib/voice/browser-tts";
import { inferVoiceUriForCandidate } from "@/lib/voice/infer-candidate-voice";
import type { Candidate, ConversationLanguage, InterviewMessage } from "@/types/interview";

type ProfileTtsSectionProps = {
  candidate: Candidate;
  messages: InterviewMessage[];
  conversationLanguage: ConversationLanguage;
  autoPlayEnabled: boolean;
  autoPlayMessageId: string | null;
  onPlaybackActiveChange: (active: boolean) => void;
};

const RATE = { slow: 0.88, normal: 1, fast: 1.18 } as const;
const PITCH = { low: 0.92, normal: 1, high: 1.08 } as const;

export function ProfileTtsSection({
  candidate,
  messages,
  conversationLanguage,
  autoPlayEnabled,
  autoPlayMessageId,
  onPlaybackActiveChange,
}: ProfileTtsSectionProps) {
  const t = useTranslations("Tts");
  const [mounted, setMounted] = useState(false);
  const supported = mounted && isBrowserTtsSupported();

  useEffect(() => {
    setMounted(true);
  }, []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState<string>("");
  const [rateKey, setRateKey] = useState<keyof typeof RATE>("normal");
  const [pitchKey, setPitchKey] = useState<keyof typeof PITCH>("normal");
  const lastAutoPlayedIdRef = useRef<string | null>(null);
  const lastCandidateIdRef = useRef<string | null>(null);

  const refreshVoices = useCallback(() => {
    if (!isBrowserTtsSupported()) return;
    setVoices(window.speechSynthesis.getVoices());
  }, []);

  useEffect(() => {
    if (!supported) return;
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [supported, refreshVoices]);

  const filteredVoices = useMemo(
    () => filterVoicesForLocale(voices, conversationLanguage),
    [voices, conversationLanguage],
  );

  useEffect(() => {
    if (filteredVoices.length === 0) return;
    const inferred = inferVoiceUriForCandidate(filteredVoices, candidate);
    if (!inferred) return;

    const switched = lastCandidateIdRef.current !== candidate.id;
    if (switched) {
      lastCandidateIdRef.current = candidate.id;
      setVoiceUri(inferred);
      return;
    }

    const valid = voiceUri && filteredVoices.some((v) => v.voiceURI === voiceUri);
    if (!valid) setVoiceUri(inferred);
  }, [candidate.id, candidate.name, filteredVoices, voiceUri]);

  useEffect(() => {
    if (autoPlayMessageId == null) {
      lastAutoPlayedIdRef.current = null;
    }
  }, [autoPlayMessageId]);

  useEffect(() => {
    if (!autoPlayEnabled) {
      stopBrowserTts();
      onPlaybackActiveChange(false);
    }
  }, [autoPlayEnabled, onPlaybackActiveChange]);

  const playText = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) {
        onPlaybackActiveChange(false);
        return;
      }
      stopBrowserTts();
      onPlaybackActiveChange(true);
      const voice = voiceUri ? findVoiceByUri(voices, voiceUri) : null;
      const u = speakBrowserTts(text.trim(), {
        voice,
        rate: RATE[rateKey],
        pitch: PITCH[pitchKey],
        langFallback: conversationLanguage,
      });
      const done = () => {
        onPlaybackActiveChange(false);
      };
      u.onend = done;
      u.onerror = done;
    },
    [
      supported,
      voiceUri,
      voices,
      rateKey,
      pitchKey,
      conversationLanguage,
      onPlaybackActiveChange,
    ],
  );

  useEffect(() => {
    if (!supported || !autoPlayEnabled || !autoPlayMessageId) return;
    if (lastAutoPlayedIdRef.current === autoPlayMessageId) return;
    const m = messages.find(
      (msg) => msg.id === autoPlayMessageId && msg.from === "candidate",
    );
    const text = m?.text[conversationLanguage]?.trim() ?? "";
    if (!text) {
      lastAutoPlayedIdRef.current = autoPlayMessageId;
      onPlaybackActiveChange(false);
      return;
    }
    lastAutoPlayedIdRef.current = autoPlayMessageId;
    playText(text);
  }, [
    supported,
    autoPlayEnabled,
    autoPlayMessageId,
    messages,
    conversationLanguage,
    playText,
    onPlaybackActiveChange,
  ]);

  useEffect(() => {
    return () => {
      stopBrowserTts();
    };
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4 text-sm">
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("profileSectionTitle")}
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("ttsHydrating")}</p>
        </section>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="space-y-4 text-sm">
        <section>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("profileSectionTitle")}
          </h4>
          <p className="leading-relaxed text-muted-foreground">{t("unsupported")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("profileSectionTitle")}
        </h4>
        <div className="grid gap-1">
          <Select
            value={
              voiceUri && filteredVoices.some((v) => v.voiceURI === voiceUri)
                ? voiceUri
                : (filteredVoices[0]?.voiceURI ?? "")
            }
            onValueChange={(v) => {
              if (v) setVoiceUri(v);
            }}
            disabled={filteredVoices.length === 0}
          >
            <SelectTrigger
              id={`tts-voice-${candidate.id}`}
              size="sm"
              className="h-9 w-full text-left text-xs"
              aria-label={t("voiceLabel")}
            >
              <SelectValue placeholder={t("voicePlaceholder")} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredVoices.map((v) => (
                <SelectItem key={v.voiceURI} value={v.voiceURI} className="text-xs">
                  {v.name} ({v.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="grid min-w-0 gap-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("speedLabel")}
            </h4>
            <Select
              value={rateKey}
              onValueChange={(v) => {
                if (v === "slow" || v === "normal" || v === "fast") setRateKey(v);
              }}
            >
              <SelectTrigger size="sm" className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">{t("speedSlow")}</SelectItem>
                <SelectItem value="normal">{t("speedNormal")}</SelectItem>
                <SelectItem value="fast">{t("speedFast")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 gap-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("pitchLabel")}
            </h4>
            <Select
              value={pitchKey}
              onValueChange={(v) => {
                if (v === "low" || v === "normal" || v === "high") setPitchKey(v);
              }}
            >
              <SelectTrigger size="sm" className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("pitchLow")}</SelectItem>
                <SelectItem value="normal">{t("pitchNormal")}</SelectItem>
                <SelectItem value="high">{t("pitchHigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}
