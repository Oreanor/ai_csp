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

type SessionCurrent = {
  name: string;
  role: string;
  duration: string;
  model: string;
};

type SessionRow = {
  name: string;
  role: string;
  status: "live" | "paused" | "done";
  duration: string;
  model: string;
};

type SessionsModalContentProps = {
  onOpenChange: (open: boolean) => void;
};

function statusLabel(t: (key: string) => string, status: SessionRow["status"]) {
  if (status === "live") return t("statusLive");
  if (status === "paused") return t("statusPaused");
  return t("statusDone");
}

function statusBadgeClass(status: SessionRow["status"]) {
  if (status === "live") {
    return "border-destructive/40 bg-destructive/10 text-destructive";
  }
  if (status === "paused") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
  return "text-muted-foreground";
}

export function SessionsModalContent({ onOpenChange }: SessionsModalContentProps) {
  const t = useTranslations("SessionsModal");
  const current = t.raw("current") as SessionCurrent;
  const rows = t.raw("rows") as SessionRow[];

  return (
    <>
      <LightboxDialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </LightboxDialogHeader>

      <LightboxDialogBody>
        <div className="space-y-6">
          <section className="space-y-3" aria-labelledby="sessions-active-heading">
            <h3
              id="sessions-active-heading"
              className="text-sm font-semibold text-foreground"
            >
              {t("activeSection")}
            </h3>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold leading-tight">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.role}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{t("colDuration")}:</span>{" "}
                      {current.duration}
                    </span>
                    <span>
                      <span className="font-medium text-foreground">{t("colModel")}:</span>{" "}
                      {current.model}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-destructive/40 bg-destructive/10 text-destructive"
                >
                  {t("statusLive")}
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title={t("btnDisabledHint")}
                >
                  {t("btnPause")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled
                  title={t("btnDisabledHint")}
                >
                  {t("btnEnd")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled
                  title={t("btnDisabledHint")}
                >
                  {t("btnNew")}
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="sessions-other-heading">
            <h3
              id="sessions-other-heading"
              className="text-sm font-semibold text-foreground"
            >
              {t("otherSection")}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-x-3 gap-y-1 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground max-sm:hidden sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto]">
                <span>{t("colCandidate")}</span>
                <span>{t("colRole")}</span>
                <span className="text-center">{t("colStatus")}</span>
                <span className="text-right">{t("colDuration")}</span>
                <span className="text-right">{t("colModel")}</span>
              </div>
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li
                    key={`${row.name}-${row.status}`}
                    className="px-3 py-3 max-sm:space-y-2 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-3"
                  >
                    <p className="text-sm font-medium leading-tight">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.role}</p>
                    <div className="flex justify-between gap-2 sm:justify-center">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {t("colStatus")}
                      </span>
                      <Badge variant="outline" className={statusBadgeClass(row.status)}>
                        {statusLabel(t, row.status)}
                      </Badge>
                    </div>
                    <p className="text-right text-sm tabular-nums text-muted-foreground">
                      {row.duration}
                    </p>
                    <p className="text-right text-xs text-muted-foreground">{row.model}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </LightboxDialogBody>

      <LightboxDialogFooter align="end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("btnClose")}
        </Button>
      </LightboxDialogFooter>
    </>
  );
}
