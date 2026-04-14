"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LightboxDialogBody,
  LightboxDialogFooter,
  LightboxDialogHeader,
} from "@/components/ui/lightbox-dialog";
import { Separator } from "@/components/ui/separator";

type HistoryEntry = {
  when: string;
  candidate: string;
  summary: string;
  messages: string;
  recording: "yes" | "no";
};

type HistoryModalContentProps = {
  onOpenChange: (open: boolean) => void;
};

export function HistoryModalContent({ onOpenChange }: HistoryModalContentProps) {
  const t = useTranslations("HistoryModal");
  const entries = t.raw("entries") as HistoryEntry[];

  return (
    <>
      <LightboxDialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </LightboxDialogHeader>

      <LightboxDialogBody>
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={`${entry.when}-${entry.candidate}`}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold leading-tight">{entry.candidate}</p>
                  <p className="text-xs text-muted-foreground">{entry.when}</p>
                  <p className="pt-1 text-sm text-foreground/90">{entry.summary}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant="secondary" className="tabular-nums">
                    {entry.messages} {t("msgUnit")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      entry.recording === "yes"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : "text-muted-foreground"
                    }
                  >
                    {entry.recording === "yes" ? t("recordingYes") : t("recordingNo")}
                  </Badge>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title={t("btnDisabledHint")}
                >
                  {t("btnDetails")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={entry.recording !== "yes"}
                  title={
                    entry.recording === "yes"
                      ? t("btnDisabledHint")
                      : t("recordingNo")
                  }
                >
                  {t("btnPlayback")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </LightboxDialogBody>

      <LightboxDialogFooter align="end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("btnClose")}
        </Button>
      </LightboxDialogFooter>
    </>
  );
}
