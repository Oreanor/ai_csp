"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  initialsFromName,
  newPersonaId,
  parseCommaTags,
} from "@/lib/utils";
import type {
  Candidate,
  CandidateFormality,
  CandidateSocialStyle,
  CandidateUnderPressure,
} from "@/types/interview";

export type CandidatePersonaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Snapshot when opening edit (stable while dialog is open). */
  editSource: Candidate | null;
  onSave: (candidate: Candidate) => void;
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
  socialStyle: "ambivert" as CandidateSocialStyle,
  formality: "neutral" as CandidateFormality,
  underPressure: "composed" as CandidateUnderPressure,
  cvText: "",
};

function candidateToForm(candidate: Candidate) {
  const dash = (s: string) => (s === "—" ? "" : s);
  return {
    name: candidate.name,
    role: dash(candidate.role),
    seniority: dash(candidate.seniority),
    background: dash(candidate.background),
    skillsRaw: candidate.skills.join(", "),
    traitsRaw: candidate.traits.join(", "),
    motivation: dash(candidate.motivation),
    communicationStyle: dash(candidate.communicationStyle),
    socialStyle: candidate.socialStyle,
    formality: candidate.formality,
    underPressure: candidate.underPressure,
    cvText: candidate.cvText ?? "",
  };
}

export function CandidatePersonaDialog({
  open,
  onOpenChange,
  mode,
  editSource,
  onSave,
}: CandidatePersonaDialogProps) {
  const t = useTranslations("AddPersona");
  const formId = useId();
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [pdfHint, setPdfHint] = useState(false);
  const [lastCvFileName, setLastCvFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editSource) {
      setForm(candidateToForm(editSource));
    } else if (mode === "create") {
      setForm(emptyForm);
    }
    setLastCvFileName(null);
    setPdfHint(false);
  }, [open, mode, editSource]);

  const reset = () => {
    setForm(emptyForm);
    setPdfHint(false);
    setLastCvFileName(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      return;
    }

    const base = {
      name,
      role: form.role.trim() || "—",
      seniority: form.seniority.trim() || "—",
      background: form.background.trim() || "—",
      skills: parseCommaTags(form.skillsRaw),
      traits: parseCommaTags(form.traitsRaw),
      motivation: form.motivation.trim() || "—",
      communicationStyle: form.communicationStyle.trim() || "—",
      socialStyle: form.socialStyle,
      formality: form.formality,
      underPressure: form.underPressure,
      cvText: form.cvText.trim() || undefined,
    };

    if (mode === "create") {
      const candidate: Candidate = {
        id: newPersonaId(),
        initials: initialsFromName(name),
        status: "online",
        ...base,
      };
      onSave(candidate);
    } else {
      if (!editSource) return;
      const candidate: Candidate = {
        ...editSource,
        initials: initialsFromName(name),
        ...base,
      };
      onSave(candidate);
    }

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
    setLastCvFileName(file.name);
    setForm((prev) => ({
      ...prev,
      cvText: prev.cvText ? `${prev.cvText}\n\n${text}` : text,
    }));
    setPdfHint(false);
  };

  const title = mode === "create" ? t("title") : t("editTitle");
  const description = mode === "create" ? t("description") : t("editDescription");

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </LightboxDialogHeader>
        <LightboxDialogBody>
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 py-1 md:grid-cols-2 md:gap-x-6 md:gap-y-4"
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
                rows={4}
                placeholder={t("backgroundPlaceholder")}
                className="min-h-[5.5rem] w-full resize-y"
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${formId}-cv-file`}>{t("cvUpload")}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={cvFileInputRef}
                  id={`${formId}-cv-file`}
                  type="file"
                  accept=".txt,.text,.md,text/plain,text/markdown"
                  onChange={handleFile}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={t("cvUpload")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => cvFileInputRef.current?.click()}
                >
                  {t("cvChooseFile")}
                </Button>
                {lastCvFileName ? (
                  <span className="text-xs text-muted-foreground">
                    {t("cvLastLoaded", { name: lastCvFileName })}
                  </span>
                ) : null}
              </div>
              {pdfHint ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t("cvPdfHint")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${formId}-cv`}>{t("cvPaste")}</Label>
              <Textarea
                id={`${formId}-cv`}
                value={form.cvText}
                onChange={(e) => setForm((p) => ({ ...p, cvText: e.target.value }))}
                rows={5}
                placeholder={t("cvPlaceholder")}
                className="min-h-[6rem] w-full resize-y"
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${formId}-skills`}>{t("skills")}</Label>
              <Input
                id={`${formId}-skills`}
                value={form.skillsRaw}
                onChange={(e) =>
                  setForm((p) => ({ ...p, skillsRaw: e.target.value }))
                }
                placeholder={t("skillsHint")}
                className="w-full"
              />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${formId}-traits`}>{t("traits")}</Label>
              <Input
                id={`${formId}-traits`}
                value={form.traitsRaw}
                onChange={(e) =>
                  setForm((p) => ({ ...p, traitsRaw: e.target.value }))
                }
                placeholder={t("traitsHint")}
                className="w-full"
              />
            </div>

            <div className="grid gap-1.5 md:col-span-1">
              <Label htmlFor={`${formId}-formality`}>{t("formality")}</Label>
              <Select
                value={form.formality}
                onValueChange={(v) => {
                  if (v === "formal" || v === "neutral" || v === "informal") {
                    setForm((p) => ({ ...p, formality: v }));
                  }
                }}
              >
                <SelectTrigger id={`${formId}-formality`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">{t("formalityFormal")}</SelectItem>
                  <SelectItem value="neutral">{t("formalityNeutral")}</SelectItem>
                  <SelectItem value="informal">{t("formalityInformal")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-snug text-muted-foreground">{t("formalityHint")}</p>
            </div>
            <div className="grid gap-1.5 md:col-span-1">
              <Label htmlFor={`${formId}-under-pressure`}>{t("underPressure")}</Label>
              <Select
                value={form.underPressure}
                onValueChange={(v) => {
                  if (
                    v === "composed" ||
                    v === "verbose" ||
                    v === "humor" ||
                    v === "defensive"
                  ) {
                    setForm((p) => ({ ...p, underPressure: v }));
                  }
                }}
              >
                <SelectTrigger id={`${formId}-under-pressure`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="composed">{t("underPressureComposed")}</SelectItem>
                  <SelectItem value="verbose">{t("underPressureVerbose")}</SelectItem>
                  <SelectItem value="humor">{t("underPressureHumor")}</SelectItem>
                  <SelectItem value="defensive">{t("underPressureDefensive")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-snug text-muted-foreground">{t("underPressureHint")}</p>
            </div>

            <div className="grid content-start gap-1.5 md:col-span-1">
              <Label htmlFor={`${formId}-social`}>{t("socialStyle")}</Label>
              <Select
                value={form.socialStyle}
                onValueChange={(v) => {
                  if (v === "introvert" || v === "ambivert" || v === "extrovert") {
                    setForm((p) => ({ ...p, socialStyle: v }));
                  }
                }}
              >
                <SelectTrigger id={`${formId}-social`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introvert">{t("socialStyleIntrovert")}</SelectItem>
                  <SelectItem value="ambivert">{t("socialStyleAmbivert")}</SelectItem>
                  <SelectItem value="extrovert">{t("socialStyleExtrovert")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-snug text-muted-foreground">
                {t("socialStyleHint")}
              </p>
            </div>
            <div className="grid gap-1.5 md:col-span-1">
              <Label htmlFor={`${formId}-motivation`}>{t("motivation")}</Label>
              <Textarea
                id={`${formId}-motivation`}
                value={form.motivation}
                onChange={(e) =>
                  setForm((p) => ({ ...p, motivation: e.target.value }))
                }
                rows={4}
                className="min-h-[5.5rem] w-full resize-y"
              />
            </div>

            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${formId}-style`}>{t("communicationStyle")}</Label>
              <Textarea
                id={`${formId}-style`}
                value={form.communicationStyle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, communicationStyle: e.target.value }))
                }
                rows={3}
                className="min-h-[4.5rem] w-full resize-y"
              />
            </div>
          </form>
        </LightboxDialogBody>
        <LightboxDialogFooter align="end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {mode === "create" ? t("save") : t("saveChanges")}
          </Button>
        </LightboxDialogFooter>
      </LightboxDialogContent>
    </Dialog>
  );
}
