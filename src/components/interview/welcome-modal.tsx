"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LightboxDialogBody,
  LightboxDialogContent,
  LightboxDialogFooter,
  LightboxDialogHeader,
} from "@/components/ui/lightbox-dialog";
import { appVersion } from "@/lib/app-version";
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 list-outside list-disc space-y-1 pl-5 text-muted-foreground marker:text-muted-foreground/80">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

type WelcomeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const t = useTranslations("WelcomeModal");

  const whatCanItems = t.raw("whatCanItems") as string[];
  const plannedItems = t.raw("plannedItems") as string[];
  const dbOptions = t.raw("dbOptions") as string[];
  const llmOptions = t.raw("llmOptions") as string[];
  const voiceOptions = t.raw("voiceOptions") as string[];
  const researchItems = t.raw("researchItems") as string[];
  const release020Items = t.raw("release020Items") as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LightboxDialogContent size="wide">
        <LightboxDialogHeader>
          <DialogTitle>
            {t("title")} · v{appVersion}
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-snug">
            {t("description")}
          </DialogDescription>
        </LightboxDialogHeader>

        <LightboxDialogBody className="pb-8">
          <div className="max-w-none space-y-3.5 text-sm leading-snug">
            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("section020Title")}</h3>
              <p className="mt-1.5 text-muted-foreground">{t("section020Intro")}</p>
              <BulletList items={release020Items} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("section010Title")}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">{t("section010Intro")}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("sectionBuiltTitle")}</h3>
              <p className="mt-1.5 text-muted-foreground">{t("sectionBuiltBody")}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("sectionCanTitle")}</h3>
              <BulletList items={whatCanItems} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("sectionMocksTitle")}</h3>
              <p className="mt-1.5 text-muted-foreground">{t("sectionMocksBody")}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("sectionPlannedTitle")}</h3>
              <BulletList items={plannedItems} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("sectionChoicesTitle")}</h3>
              <p className="mt-1.5 text-muted-foreground">{t("choicesIntro")}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dbLabel")}
              </p>
              <BulletList items={dbOptions} />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("llmLabel")}
              </p>
              <BulletList items={llmOptions} />
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("voiceLabel")}
              </p>
              <BulletList items={voiceOptions} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground">
                {t("sectionResearchTitle")}
              </h3>
              <p className="mt-1.5 text-muted-foreground">{t("sectionResearchIntro")}</p>
              <BulletList items={researchItems} />
            </section>

            <p className="text-xs text-muted-foreground">
              {t("closing")} · {t("buildVersionHint", { version: appVersion })}
            </p>
          </div>
        </LightboxDialogBody>

        <LightboxDialogFooter align="center">
          <Button type="button" className="min-w-[8rem]" onClick={() => onOpenChange(false)}>
            {t("btnGotIt")}
          </Button>
        </LightboxDialogFooter>
      </LightboxDialogContent>
    </Dialog>
  );
}
