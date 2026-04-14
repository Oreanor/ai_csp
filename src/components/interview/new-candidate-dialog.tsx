"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LightboxDialogBody,
  LightboxDialogContent,
  LightboxDialogFooter,
  LightboxDialogHeader,
} from "@/components/ui/lightbox-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  initialsFromName,
  newPersonaId,
  parseCommaTags,
} from "@/lib/utils/candidate";
import type { Candidate } from "@/types/interview";

type NewCandidateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (candidate: Candidate) => void;
};

const emptyForm = {
  name: "",
  role: "",
  seniority: "",
  background: "",
  skillsRaw: "",
  traitsRaw: "",
  motivation: "",
  communicationStyle: "",
  cvText: "",
};

export function NewCandidateDialog({
  open,
  onOpenChange,
  onAdd,
}: NewCandidateDialogProps) {
  const t = useTranslations("AddPersona");
  const formId = useId();
  const [form, setForm] = useState(emptyForm);
  const [pdfHint, setPdfHint] = useState(false);

  const reset = () => {
    setForm(emptyForm);
    setPdfHint(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      return;
    }
    const candidate: Candidate = {
      id: newPersonaId(),
      initials: initialsFromName(name),
      name,
      role: form.role.trim() || "—",
      status: "online",
      seniority: form.seniority.trim() || "—",
      background: form.background.trim() || "—",
      skills: parseCommaTags(form.skillsRaw),
      traits: parseCommaTags(form.traitsRaw),
      motivation: form.motivation.trim() || "—",
      communicationStyle: form.communicationStyle.trim() || "—",
      cvText: form.cvText.trim() || undefined,
    };
    onAdd(candidate);
    reset();
    onOpenChange(false);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type === "application/pdf") {
      setPdfHint(true);
      return;
    }
    const text = await file.text();
    setForm((prev) => ({
      ...prev,
      cvText: prev.cvText ? `${prev.cvText}\n\n${text}` : text,
    }));
    setPdfHint(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <LightboxDialogContent size="xl">
        <LightboxDialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </LightboxDialogHeader>
        <LightboxDialogBody>
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-x-6 gap-y-3 py-1 md:grid-cols-2"
          >
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor={`${formId}-name`}>{t("name")}</Label>
            <Input
              id={`${formId}-name`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              autoComplete="name"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-role`}>{t("role")}</Label>
            <Input
              id={`${formId}-role`}
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-seniority`}>{t("seniority")}</Label>
            <Input
              id={`${formId}-seniority`}
              value={form.seniority}
              onChange={(e) =>
                setForm((p) => ({ ...p, seniority: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor={`${formId}-background`}>{t("background")}</Label>
            <Textarea
              id={`${formId}-background`}
              value={form.background}
              onChange={(e) =>
                setForm((p) => ({ ...p, background: e.target.value }))
              }
              rows={2}
              className="min-h-0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-cv-file`}>{t("cvUpload")}</Label>
            <Input
              id={`${formId}-cv-file`}
              type="file"
              accept=".txt,.text,.md,text/plain,text/markdown"
              onChange={handleFile}
              className="cursor-pointer"
            />
            {pdfHint ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t("cvPdfHint")}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-cv`}>{t("cvPaste")}</Label>
            <Textarea
              id={`${formId}-cv`}
              value={form.cvText}
              onChange={(e) => setForm((p) => ({ ...p, cvText: e.target.value }))}
              rows={3}
              placeholder={t("cvPlaceholder")}
              className="min-h-0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-skills`}>{t("skills")}</Label>
            <Input
              id={`${formId}-skills`}
              value={form.skillsRaw}
              onChange={(e) =>
                setForm((p) => ({ ...p, skillsRaw: e.target.value }))
              }
              placeholder={t("skillsHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-traits`}>{t("traits")}</Label>
            <Input
              id={`${formId}-traits`}
              value={form.traitsRaw}
              onChange={(e) =>
                setForm((p) => ({ ...p, traitsRaw: e.target.value }))
              }
              placeholder={t("traitsHint")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-motivation`}>{t("motivation")}</Label>
            <Textarea
              id={`${formId}-motivation`}
              value={form.motivation}
              onChange={(e) =>
                setForm((p) => ({ ...p, motivation: e.target.value }))
              }
              rows={2}
              className="min-h-0"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-style`}>{t("communicationStyle")}</Label>
            <Textarea
              id={`${formId}-style`}
              value={form.communicationStyle}
              onChange={(e) =>
                setForm((p) => ({ ...p, communicationStyle: e.target.value }))
              }
              rows={2}
              className="min-h-0"
            />
          </div>
          </form>
        </LightboxDialogBody>
        <LightboxDialogFooter align="end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {t("save")}
          </Button>
        </LightboxDialogFooter>
      </LightboxDialogContent>
    </Dialog>
  );
}
