"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useTranslations } from "next-intl";

import { useAppLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAppLocale } from "@/lib/i18n/config";
import type { TopModalView } from "@/types/interview";

type WorkspaceHeaderProps = {
  activeModal: TopModalView | null;
  onToggleModal: (view: TopModalView) => void;
  onOpenDisclaimer: () => void;
};

const TOP_MODAL_VIEWS: TopModalView[] = ["sessions", "history", "settings"];

export function WorkspaceHeader({
  activeModal,
  onToggleModal,
  onOpenDisclaimer,
}: WorkspaceHeaderProps) {
  const tApp = useTranslations("App");
  const tHeader = useTranslations("Header");
  const tTheme = useTranslations("Theme");
  const tLang = useTranslations("Language");
  const { resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useAppLocale();

  const isDark = resolvedTheme === "dark";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3 text-lg font-semibold">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-content-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
            {tApp("shortLogo")}
          </div>
          <span className="truncate">{tApp("name")}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDisclaimer}
          className="shrink-0 border-2 border-foreground bg-foreground px-4 font-semibold tracking-wide text-background uppercase shadow-none hover:bg-foreground/90 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
          aria-label={tHeader("disclaimerAria")}
        >
          {tHeader("disclaimer")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TOP_MODAL_VIEWS.map((view) => (
          <Button
            key={view}
            type="button"
            variant={activeModal === view ? "default" : "outline"}
            size="sm"
            className={
              activeModal === view
                ? "bg-brand text-brand-foreground hover:bg-brand/90"
                : ""
            }
            onClick={() => onToggleModal(view)}
          >
            {tHeader(view)}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={tTheme("toggle")}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Select
          value={locale}
          onValueChange={(value) => {
            if (isAppLocale(value)) {
              setLocale(value);
            }
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-8 justify-center gap-1 border-0 bg-transparent px-2 text-sm font-normal text-foreground shadow-none hover:bg-muted/55 focus-visible:ring-2 dark:hover:bg-muted/35 [&_svg]:size-3.5 [&_svg]:text-muted-foreground/80"
            aria-label={tLang("interface")}
            title={tLang("interface")}
          >
            <SelectValue className="uppercase tabular-nums" />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-0">
            <SelectItem value="en" title={tLang("english")}>
              EN
            </SelectItem>
            <SelectItem value="pt" title={tLang("portuguese")}>
              PT
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
