"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LightboxDialogBody,
  LightboxDialogFooter,
  LightboxDialogHeader,
} from "@/components/ui/lightbox-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsModalContentProps = {
  onOpenChange: (open: boolean) => void;
  interviewBaseSystemPrompt: string;
  onInterviewSettingsSaved: (next: { baseSystemPrompt: string; updatedAt: string }) => void;
};

export function SettingsModalContent({
  onOpenChange,
  interviewBaseSystemPrompt,
  onInterviewSettingsSaved,
}: SettingsModalContentProps) {
  const t = useTranslations("SettingsModal");
  const formId = useId();

  const [systemPromptExtra, setSystemPromptExtra] = useState(interviewBaseSystemPrompt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSystemPromptExtra(interviewBaseSystemPrompt);
  }, [interviewBaseSystemPrompt]);

  const close = () => onOpenChange(false);

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/interview/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseSystemPrompt: systemPromptExtra }),
      });
      const raw = await res.text();
      let data: { baseSystemPrompt?: unknown; updatedAt?: unknown; error?: unknown } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          data = { error: raw.slice(0, 200) };
        }
      }
      if (!res.ok) {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error.trim()
            : t("saveSettingsFailed");
        throw new Error(msg);
      }
      const nextPrompt =
        typeof data.baseSystemPrompt === "string" ? data.baseSystemPrompt : systemPromptExtra;
      const updatedAt =
        typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString();
      onInterviewSettingsSaved({ baseSystemPrompt: nextPrompt, updatedAt });
      close();
    } catch (e) {
      const msg = e instanceof Error && e.message.trim() ? e.message.trim() : t("saveSettingsFailed");
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <LightboxDialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("a11yDescription")}</DialogDescription>
      </LightboxDialogHeader>

      <LightboxDialogBody>
        <form
          id={formId}
          className="grid gap-3 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-prompt`}>{t("fieldLabel")}</Label>
            <Textarea
              id={`${formId}-prompt`}
              value={systemPromptExtra}
              onChange={(e) => setSystemPromptExtra(e.target.value)}
              placeholder={t("fieldPlaceholder")}
              rows={8}
              className="field-sizing-fixed min-h-0 resize-y font-mono text-xs leading-relaxed"
            />
            {saveError ? (
              <p className="text-xs text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}
          </div>
        </form>
      </LightboxDialogBody>

      <LightboxDialogFooter align="end">
        <Button type="button" variant="outline" onClick={close}>
          {t("cancel")}
        </Button>
        <Button type="submit" form={formId} disabled={isSaving}>
          {isSaving ? t("saving") : t("save")}
        </Button>
      </LightboxDialogFooter>
    </>
  );
}
