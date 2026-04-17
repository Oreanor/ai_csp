import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

import type { Candidate, CandidateFormality, CandidateUnderPressure } from "@/types/interview";

function formalityDisplay(
  f: CandidateFormality,
  t: (key: string) => string,
): string {
  const map: Record<CandidateFormality, string> = {
    formal: t("formalityFormal"),
    neutral: t("formalityNeutral"),
    informal: t("formalityInformal"),
  };
  return map[f];
}

function underPressureDisplay(
  u: CandidateUnderPressure,
  t: (key: string) => string,
): string {
  const map: Record<CandidateUnderPressure, string> = {
    composed: t("underPressureComposed"),
    verbose: t("underPressureVerbose"),
    humor: t("underPressureHumor"),
    defensive: t("underPressureDefensive"),
  };
  return map[u];
}

type ProfilePanelBodyProps = {
  candidate: Candidate;
  onEditProfile?: () => void;
  /** Optional block (e.g. browser TTS) shown before the edit button. */
  interviewTts?: ReactNode;
};

export function ProfilePanelBody({ candidate, onEditProfile, interviewTts }: ProfilePanelBodyProps) {
  const t = useTranslations("Profile");

  return (
    <div className="space-y-4 text-sm">
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("experience")}
        </h4>
        <p className="leading-relaxed text-foreground">{candidate.background}</p>
      </section>
      {candidate.cvText ? (
        <>
          <Separator />
          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("cv")}
            </h4>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-2 text-xs text-foreground">
              {candidate.cvText}
            </pre>
          </section>
        </>
      ) : null}
      <Separator />
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("techStack")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="rounded-full bg-brand-muted/90 font-normal text-brand-foreground"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </section>
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("personality")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {candidate.traits.map((trait) => (
            <Badge
              key={trait}
              variant="secondary"
              className="rounded-full bg-brand-muted/90 font-normal text-brand-foreground"
            >
              {trait}
            </Badge>
          ))}
        </div>
      </section>
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("socialStyle")}
        </h4>
        <p className="leading-relaxed text-foreground">
          {candidate.socialStyle === "introvert"
            ? t("socialStyleIntrovert")
            : candidate.socialStyle === "extrovert"
              ? t("socialStyleExtrovert")
              : t("socialStyleAmbivert")}
        </p>
      </section>
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("formality")}
        </h4>
        <p className="leading-relaxed text-foreground">
          {formalityDisplay(candidate.formality, t)}
        </p>
      </section>
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("underPressure")}
        </h4>
        <p className="leading-relaxed text-foreground">
          {underPressureDisplay(candidate.underPressure, t)}
        </p>
      </section>
      <Separator />
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("motivation")}
        </h4>
        <p className="leading-relaxed text-foreground">{candidate.motivation}</p>
      </section>
      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("communicationStyle")}
        </h4>
        <p className="leading-relaxed text-foreground">
          {candidate.communicationStyle}
        </p>
      </section>
      {interviewTts ? (
        <>
          <Separator />
          {interviewTts}
        </>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onEditProfile}
        disabled={!onEditProfile}
      >
        {t("editProfile")}
      </Button>
    </div>
  );
}
