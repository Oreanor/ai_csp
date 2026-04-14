import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Candidate } from "@/types/interview";

type ProfilePanelBodyProps = {
  candidate: Candidate;
};

export function ProfilePanelBody({ candidate }: ProfilePanelBodyProps) {
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
              className="rounded-full bg-emerald-500/15 font-normal text-emerald-800 dark:text-emerald-100"
            >
              {trait}
            </Badge>
          ))}
        </div>
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
      <Button variant="outline" className="w-full">
        {t("editProfile")}
      </Button>
    </div>
  );
}
