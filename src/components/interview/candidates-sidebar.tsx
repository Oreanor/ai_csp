"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { candidateRowClass, workspaceSurfaces } from "@/lib/workspace/surfaces";
import type { Candidate } from "@/types/interview";

type CandidatesSidebarProps = {
  candidates: Candidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  /** When true, choosing another candidate is blocked (active interview session). */
  switchLocked?: boolean;
  /** When true, the add-candidate control is disabled (e.g. mic test or active session). */
  addLocked?: boolean;
};

export function CandidatesSidebar({
  candidates,
  selectedId,
  onSelect,
  onAddClick,
  switchLocked = false,
  addLocked = false,
}: CandidatesSidebarProps) {
  const t = useTranslations("Candidates");

  return (
    <aside className={workspaceSurfaces.sidebar}>
      <div className={workspaceSurfaces.sidebarHeader}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={t("addTooltip")}
          aria-label={t("addTooltip")}
          disabled={switchLocked || addLocked}
          onClick={onAddClick}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-3.25rem)]">
        <div className="space-y-2 p-3">
          {candidates.map((candidate) => {
            const selected = candidate.id === selectedId;
            const rowLocked = switchLocked && !selected;
            return (
              <button
                key={candidate.id}
                type="button"
                disabled={rowLocked}
                title={rowLocked ? t("switchLockedHint") : undefined}
                onClick={() => onSelect(candidate.id)}
                className={candidateRowClass(selected)}
              >
                <span className="grid h-9 w-9 place-content-center rounded-full bg-brand-muted text-xs font-bold text-brand-foreground">
                  {candidate.initials}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-semibold leading-tight">
                    {candidate.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {candidate.role}
                  </span>
                </span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/35"
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
