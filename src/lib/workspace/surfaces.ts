import { cn } from "@/lib/utils";

/** Semantic layout classes for the interview workspace (light + dark via tokens). */
export const workspaceSurfaces = {
  page: "min-h-screen bg-muted/50 p-4 text-foreground md:p-8",
  shell:
    "mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:h-[calc(100vh-4rem)]",
  sidebar: "border-r border-border bg-muted/40",
  sidebarHeader: "flex items-center justify-between border-b border-border px-4 py-3",
  mainColumn: "flex min-h-0 min-w-0 w-full flex-col bg-card",
  mainHeader:
    "flex flex-wrap items-stretch justify-between gap-3 border-b border-border px-4 py-3",
  /** Fixed right column (profile); visible from `md` breakpoint. */
  profileColumn:
    "hidden h-full min-h-0 w-[300px] shrink-0 flex-col border-l border-border bg-muted/30 md:flex",
};

export function candidateRowClass(selected: boolean) {
  return cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition",
    selected
      ? "border-brand/35 bg-brand-muted/80"
      : "border-border bg-card hover:bg-muted/50",
  );
}
