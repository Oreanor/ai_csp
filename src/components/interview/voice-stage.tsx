"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VoiceWaveform } from "@/components/interview/voice-waveform";
import type { Candidate, ConversationLanguage } from "@/types/interview";
import { transcriptSampleByLanguage } from "@/data/transcript-sample";
import { workspaceSurfaces } from "@/lib/workspace/surfaces";

type VoiceStageProps = {
  candidate: Candidate;
  conversationLanguage: ConversationLanguage;
};

export function VoiceStage({
  candidate,
  conversationLanguage,
}: VoiceStageProps) {
  const t = useTranslations("Voice");

  return (
    <div className={`grid place-items-center px-6 py-6 ${workspaceSurfaces.voiceCanvas}`}>
      <div className="w-full max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("candidateAnswering")}
        </p>
        <div className="mx-auto grid h-40 w-40 place-content-center rounded-full border border-border bg-muted/40 shadow-inner">
          <div className="grid h-24 w-24 place-content-center rounded-full border-2 border-brand bg-card text-3xl font-semibold text-brand">
            {candidate.initials}
          </div>
        </div>
        <VoiceWaveform />
        <Card className="mx-auto mt-4 border-border text-left shadow-none">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("transcript")}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-base leading-relaxed text-foreground">
              {transcriptSampleByLanguage[conversationLanguage]}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
