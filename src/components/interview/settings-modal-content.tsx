"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LightboxDialogBody,
  LightboxDialogFooter,
  LightboxDialogHeader,
} from "@/components/ui/lightbox-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { isAppLocale } from "@/lib/i18n/config";

type SettingsModalContentProps = {
  onOpenChange: (open: boolean) => void;
};

export function SettingsModalContent({ onOpenChange }: SettingsModalContentProps) {
  const t = useTranslations("SettingsModal");
  const formId = useId();

  const [model, setModel] = useState("balanced");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPromptExtra, setSystemPromptExtra] = useState("");
  const [ttsProfile, setTtsProfile] = useState("neutral");
  const [micMode, setMicMode] = useState("push");
  const [defaultInterviewLang, setDefaultInterviewLang] = useState("en");
  const [expandTranscript, setExpandTranscript] = useState(true);
  const [compactLog, setCompactLog] = useState(false);

  const close = () => onOpenChange(false);

  const handleSave = () => {
    close();
  };

  return (
    <>
      <LightboxDialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
        <p className="text-xs text-muted-foreground">{t("intro")}</p>
      </LightboxDialogHeader>

      <LightboxDialogBody>
        <form
          id={formId}
          className="grid gap-6 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
        <section className="space-y-4" aria-labelledby={`${formId}-ai-heading`}>
          <div>
            <h3
              id={`${formId}-ai-heading`}
              className="text-sm font-semibold text-foreground"
            >
              {t("sectionAi")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("sectionAiHint")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-model`}>{t("modelLabel")}</Label>
              <Select
                value={model}
                onValueChange={(v) => {
                  if (v) setModel(v);
                }}
              >
                <SelectTrigger id={`${formId}-model`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">{t("modelOptionFast")}</SelectItem>
                  <SelectItem value="balanced">{t("modelOptionBalanced")}</SelectItem>
                  <SelectItem value="quality">{t("modelOptionQuality")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("modelHint")}</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${formId}-temp`}>{t("temperatureLabel")}</Label>
                <span className="tabular-nums text-xs text-muted-foreground">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <input
                id={`${formId}-temp`}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <p className="text-xs text-muted-foreground">{t("temperatureHint")}</p>
            </div>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={`${formId}-prompt`}>{t("systemPromptLabel")}</Label>
            <Textarea
              id={`${formId}-prompt`}
              value={systemPromptExtra}
              onChange={(e) => setSystemPromptExtra(e.target.value)}
              placeholder={t("systemPromptPlaceholder")}
              rows={3}
              className="min-h-0 resize-y"
            />
          </div>
        </section>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-4" aria-labelledby={`${formId}-voice-heading`}>
            <h3
              id={`${formId}-voice-heading`}
              className="text-sm font-semibold text-foreground"
            >
              {t("sectionVoice")}
            </h3>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-tts`}>{t("ttsLabel")}</Label>
              <Select
                value={ttsProfile}
                onValueChange={(v) => {
                  if (v) setTtsProfile(v);
                }}
              >
                <SelectTrigger id={`${formId}-tts`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">{t("ttsOptionNeutral")}</SelectItem>
                  <SelectItem value="warm">{t("ttsOptionWarm")}</SelectItem>
                  <SelectItem value="crisp">{t("ttsOptionCrisp")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("ttsHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-mic`}>{t("micModeLabel")}</Label>
              <Select
                value={micMode}
                onValueChange={(v) => {
                  if (v) setMicMode(v);
                }}
              >
                <SelectTrigger id={`${formId}-mic`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">{t("micModePush")}</SelectItem>
                  <SelectItem value="vad">{t("micModeVad")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-in-device`}>{t("inputDeviceLabel")}</Label>
              <Input
                id={`${formId}-in-device`}
                readOnly
                value={t("devicePlaceholder")}
                className="bg-muted/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-out-device`}>{t("outputDeviceLabel")}</Label>
              <Input
                id={`${formId}-out-device`}
                readOnly
                value={t("devicePlaceholder")}
                className="bg-muted/50"
              />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby={`${formId}-session-heading`}>
            <h3
              id={`${formId}-session-heading`}
              className="text-sm font-semibold text-foreground"
            >
              {t("sectionSession")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("sectionSessionHint")}</p>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-def-lang`}>{t("defaultLangLabel")}</Label>
              <Select
                value={defaultInterviewLang}
                onValueChange={(v) => {
                  if (isAppLocale(v)) setDefaultInterviewLang(v);
                }}
              >
                <SelectTrigger id={`${formId}-def-lang`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("langEn")}</SelectItem>
                  <SelectItem value="pt">{t("langPt")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("defaultLangHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-retention`}>{t("retentionLabel")}</Label>
              <Input
                id={`${formId}-retention`}
                readOnly
                value={t("retentionPlaceholder")}
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">{t("retentionHint")}</p>
            </div>
          </section>
        </div>

        <Separator />

        <section className="space-y-4" aria-labelledby={`${formId}-ui-heading`}>
          <div>
            <h3
              id={`${formId}-ui-heading`}
              className="text-sm font-semibold text-foreground"
            >
              {t("sectionUi")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("sectionUiHint")}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id={`${formId}-transcript`}
                checked={expandTranscript}
                onCheckedChange={setExpandTranscript}
              />
              <Label htmlFor={`${formId}-transcript`} className="cursor-pointer font-normal">
                {t("showTranscriptLabel")}
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id={`${formId}-compact`}
                checked={compactLog}
                onCheckedChange={setCompactLog}
              />
              <Label htmlFor={`${formId}-compact`} className="cursor-pointer font-normal">
                {t("compactLogLabel")}
              </Label>
            </div>
          </div>
        </section>
        </form>
      </LightboxDialogBody>

      <LightboxDialogFooter align="end">
        <Button type="button" variant="outline" onClick={close}>
          {t("cancel")}
        </Button>
        <Button type="submit" form={formId}>
          {t("save")}
        </Button>
      </LightboxDialogFooter>
    </>
  );
}
